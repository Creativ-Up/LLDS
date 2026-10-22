/**
 * Vérifie les règles d'accès sur l'instance locale (anonyme, utilisateur, admin).
 * Usage : `pnpm db:check` après `pnpm db:reset`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { seedFileSchema, type Database } from '@llds/shared';
import { createClient } from '@supabase/supabase-js';

import { localSupabaseStatus, repoRoot } from './lib/supabase-cli';

const status = localSupabaseStatus();
const seed = seedFileSchema.parse(JSON.parse(readFileSync(resolve(repoRoot, 'seed/demo-seed.json'), 'utf8')));
const authOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const client = () => createClient<Database>(status.API_URL, status.ANON_KEY, authOptions);
// Clé service role locale : uniquement pour retirer du journal les événements créés par les tests.
const service = createClient<Database>(status.API_URL, status.SERVICE_ROLE_KEY, authOptions);
const { data: lastEvent } = await service.from('admin_events').select('id').order('id', { ascending: false }).limit(1).maybeSingle();

let failures = 0;
function check(label: string, ok: boolean, detail = ''): void {
  if (!ok) failures += 1;
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
}

// Anonyme (invité)
const anon = client();
const { data: anonLines } = await anon.from('line_overview').select('code,status');
const anonCodes = (anonLines ?? []).map((l) => `${l.code}:${l.status}`).sort();
const expectedCodes = seed.lines
  .filter((l) => l.status !== 'draft')
  .map((l) => `${l.code}:${l.status}`)
  .sort();
check(
  'anon voit seulement les lignes publiées / bientôt disponibles',
  anonCodes.join() === expectedCodes.join(),
  anonCodes.join(),
);

const { data: anonStops } = await anon.from('stop_overview').select('id');
check('anon voit les arrêts des lignes visibles', (anonStops ?? []).length > 0, `${anonStops?.length ?? 0} arrêts`);

const { error: anonInsert } = await anon.from('lines').insert({ code: 'X1' });
check('anon ne peut pas créer de ligne', anonInsert !== null);

const { data: media } = await anon.from('media').select('path').eq('bucket', 'media').limit(1).single();
const signed = media ? await anon.storage.from('media').createSignedUrl(media.path, 60) : null;
check('anon peut signer l’URL d’un média publié', Boolean(signed?.data?.signedUrl), signed?.error?.message ?? '');

const { error: anonUpload } = await anon.storage
  .from('media')
  .upload('intrus.vtt', 'WEBVTT', { contentType: 'text/vtt' });
check('anon ne peut pas téléverser', anonUpload !== null);

// Utilisateur inscrit
const user = client();
const { data: signUp, error: signUpError } = await user.auth.signUp({
  email: `test-${Date.now()}@llds.local`,
  password: 'motdepasse-test',
  options: { data: { first_name: 'Camille', lang: 'nl' } },
});
check('inscription', !signUpError && Boolean(signUp.session), signUpError?.message ?? '');
const userId = signUp.user?.id ?? '';

const { data: profile } = await user.from('profiles').select('first_name,lang,role').eq('id', userId).single();
check(
  'profil créé à l’inscription (prénom, langue, rôle user)',
  profile?.first_name === 'Camille' && profile.lang === 'nl' && profile.role === 'user',
);

const { error: roleEscalation } = await user.from('profiles').update({ role: 'admin' }).eq('id', userId);
check('un utilisateur ne peut pas se donner le rôle admin', roleEscalation !== null, roleEscalation?.message ?? '');

const { error: prefError } = await user.from('profiles').update({ transport: 'velo' }).eq('id', userId);
check('un utilisateur modifie ses préférences', prefError === null, prefError?.message ?? '');

const { data: stop } = await user.from('stop_overview').select('id').limit(1).single();
const { error: selfAward } = await user
  .from('stop_completions')
  .insert({ user_id: userId, stop_id: stop?.id ?? '', points_awarded: 9999 });
check('un utilisateur ne peut pas se créditer de points', selfAward !== null);

const { data: drafts } = await user.from('lines').select('code').eq('status', 'draft');
check('un utilisateur ne voit pas les brouillons', (drafts ?? []).length === 0);

// Admin
const admin = client();
const { error: adminLogin } = await admin.auth.signInWithPassword({
  email: seed.admin.email,
  password: seed.admin.password,
});
check('connexion admin', adminLogin === null, adminLogin?.message ?? '');
const { data: allLines } = await admin.from('line_overview').select('code');
check('admin voit toutes les lignes', (allLines ?? []).length === seed.lines.length, `${allLines?.length ?? 0} lignes`);
const { data: profiles } = await admin.from('profiles').select('id');
check('admin lit les profils', (profiles ?? []).length >= 2);

// Fonctions d'administration (jalon M1) : refus pour un visiteur.
const { error: userPublish } = await user.rpc('publish_line', { p_line_id: stop?.id ?? '' });
check('un utilisateur ne peut pas publier', userPublish !== null, userPublish?.message ?? '');

// Parcours d'acceptation M1 côté base : ligne de 3 arrêts créée de zéro, publiée, visible par l'app.
const code = `TEST${Date.now() % 100000}`;
const { data: created, error: createError } = await admin.from('lines').insert({ code, name: { fr: 'Test' } }).select('id').single();
check('admin crée une ligne brouillon', createError === null && Boolean(created), createError?.message ?? '');
const lineId = created?.id ?? '';

const { error: earlyPublish } = await admin.rpc('publish_line', { p_line_id: lineId });
check('publication refusée sans tracé ni arrêt', earlyPublish?.message === 'line_not_publishable', earlyPublish?.message ?? '');

const { data: lengthM, error: trackError } = await admin.rpc('set_line_track', {
  p_line_id: lineId,
  p_geojson: { type: 'LineString', coordinates: [[4.0, 50.5, 120], [4.1, 50.5, 130], [4.2, 50.5, 125]] },
  p_source_name: 'test.gpx',
});
check('import du tracé (3D aplati) et longueur calculée', trackError === null && (lengthM ?? 0) > 10000, `${Math.round(lengthM ?? 0)} m`);

// Clics hors du tracé, dans le désordre : chaque arrêt doit être aimanté et rangé le long de la ligne.
const clicks: [number, number][] = [[4.15, 50.51], [4.02, 50.49], [4.09, 50.52]];
const stopIds: string[] = [];
for (const [lng, lat] of clicks) {
  const { data: id, error } = await admin.rpc('add_stop', { p_line_id: lineId, p_lng: lng, p_lat: lat });
  if (error || !id) check('ajout d’arrêt', false, error?.message ?? '');
  else stopIds.push(id);
}
const { data: placed } = await admin.from('stop_overview').select('id,position,lat,lng').eq('line_id', lineId).order('position');
const orderedLngs = (placed ?? []).map((s) => s.lng ?? 0);
check(
  'arrêts aimantés au tracé et ordonnés le long de la ligne',
  (placed ?? []).length === 3 &&
    (placed ?? []).every((s) => Math.abs((s.lat ?? 0) - 50.5) < 1e-9) &&
    orderedLngs.every((lng, i) => i === 0 || lng > (orderedLngs[i - 1] ?? 0)),
  orderedLngs.map((l) => l.toFixed(2)).join(' → '),
);

const { data: archive } = await admin.from('media').select('id').eq('bucket', 'media').like('mime', 'image/%').limit(1).single();
const { data: narration } = await admin.from('media').select('id').like('mime', 'audio/%').limit(1).single();
for (const [index, id] of (placed ?? []).map((s) => s.id ?? '').entries()) {
  await admin.from('stops').update({ name: { fr: `Arrêt ${index + 1}` }, archive_media_id: archive?.id ?? null }).eq('id', id);
  await admin.from('stop_media').insert({ stop_id: id, lang: 'fr', kind: 'audio', media_id: narration?.id ?? '' });
}

const { error: directPublish } = await admin.from('lines').update({ status: 'published' }).eq('id', lineId);
const { data: version, error: publishError } = await admin.rpc('publish_line', { p_line_id: lineId });
check('publication de la ligne complète', directPublish === null && publishError === null, publishError?.message ?? '');
const { data: republished } = await admin.rpc('publish_line', { p_line_id: lineId });
check('republication : nouvelle version de contenu', (republished ?? 0) === (version ?? 0) + 1, `v${republished ?? '?'}`);

const { data: anonLine } = await anon.from('line_overview').select('code,stop_count,status').eq('id', lineId).single();
check('la ligne publiée est visible par l’app', anonLine?.status === 'published' && anonLine.stop_count === 3);

const reversed = [...stopIds].reverse();
const { error: reorderError } = await admin.rpc('reorder_stops', { p_line_id: lineId, p_stop_ids: reversed });
check('réordonnancement des arrêts', reorderError === null, reorderError?.message ?? '');

const { data: incomplete } = await admin.rpc('line_publication_issues', { p_line_id: lineId });
check('contrôle avant publication sans point bloquant', (incomplete ?? []).every((i) => !i.blocking));

await admin.from('lines').delete().eq('id', lineId);

// Utilisateurs : liste (avec e-mail) et suppression RGPD par l'admin.
const { data: listed } = await admin.rpc('admin_list_users');
check('admin liste les comptes visiteurs', (listed ?? []).some((u) => u.id === userId));
const { error: userList } = await user.rpc('admin_list_users');
check('un visiteur ne peut pas lister les comptes', userList !== null);
const { error: deleteError } = await admin.rpc('admin_delete_user', { p_user_id: userId });
const { data: afterDelete } = await admin.rpc('admin_list_users');
check(
  'suppression d’un compte par l’admin',
  deleteError === null && !(afterDelete ?? []).some((u) => u.id === userId),
  deleteError?.message ?? '',
);

await Promise.all([user.auth.signOut(), admin.auth.signOut()]);
await service.from('admin_events').delete().gt('id', lastEvent?.id ?? 0);

if (failures > 0) {
  console.error(`\n${failures} vérification(s) en échec.`);
  process.exit(1);
}
console.log('\nToutes les règles d’accès sont conformes.');
