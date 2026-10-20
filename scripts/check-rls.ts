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

// Nettoyage : suppression de l'utilisateur de test (clé service role locale).
const service = createClient<Database>(status.API_URL, status.SERVICE_ROLE_KEY, authOptions);
if (userId) await service.auth.admin.deleteUser(userId);
await Promise.all([user.auth.signOut(), admin.auth.signOut()]);

if (failures > 0) {
  console.error(`\n${failures} vérification(s) en échec.`);
  process.exit(1);
}
console.log('\nToutes les règles d’accès sont conformes.');
