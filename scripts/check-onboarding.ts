/**
 * Vérifie, contre l'instance Supabase locale, les appels faits par l'onboarding mobile (M2) :
 * inscription (profil créé avec prénom et langue), erreurs Auth attendues, connexion,
 * recopie des préférences dans le profil, ligne en cours, lecture des lignes en invité.
 *   pnpm db:check:onboarding
 * Le compte de test est supprimé à la fin (clé service, script local uniquement).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../packages/shared/src/database.types';
import { localSupabaseStatus } from './lib/supabase-cli';

type Client = SupabaseClient<Database>;

const status = localSupabaseStatus();
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const anon = (): Client => createClient<Database>(status.API_URL, status.ANON_KEY, options);
const service = createClient<Database>(status.API_URL, status.SERVICE_ROLE_KEY, options);

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (!ok) failures += 1;
  console.log(`${ok ? '✓' : '✗'} ${label}${!ok && detail !== undefined ? ` — ${JSON.stringify(detail)}` : ''}`);
}

const email = `onboarding-${Date.now()}@llds.local`;
const password = 'motdepasse-test';
let userId: string | undefined;

try {
  // Invité : lignes publiées lisibles sans session.
  const guest = anon();
  const lines = await guest.from('line_overview').select('id, code, stop_count, stamp_count, length_m').order('sort_order');
  check('invité : lignes publiées lisibles', !lines.error && (lines.data?.length ?? 0) > 0, lines.error);
  const lineId = lines.data?.[0]?.id;
  const settings = await guest.from('app_settings').select('walk_kmh, bike_kmh, car_kmh').single();
  check('invité : vitesses de déplacement lisibles', !settings.error && settings.data.walk_kmh > 0, settings.error);

  // Inscription : prénom + langue → profil.
  const client = anon();
  const signUp = await client.auth.signUp({ email, password, options: { data: { first_name: '  Jeanne ', lang: 'nl' } } });
  userId = signUp.data.user?.id;
  check('inscription : session ouverte (confirmation désactivée en local)', !signUp.error && !!signUp.data.session, signUp.error);
  const profile = await client.from('profiles').select('first_name, lang').eq('id', userId ?? '').single();
  check('inscription : profil créé (prénom nettoyé, langue)', profile.data?.first_name === 'Jeanne' && profile.data.lang === 'nl', profile.data);

  const again = await anon().auth.signUp({ email, password });
  // Sans confirmation, GoTrue renvoie user_already_exists ; avec confirmation, un faux utilisateur sans identité.
  check(
    'inscription : adresse déjà utilisée détectée',
    again.error?.code === 'user_already_exists' || again.data.user?.identities?.length === 0,
    again.error ?? again.data.user?.identities,
  );
  const weak = await anon().auth.signUp({ email: `weak-${email}`, password: 'court' });
  check('inscription : mot de passe trop court refusé (weak_password)', weak.error?.code === 'weak_password', weak.error);

  // Connexion.
  const bad = await anon().auth.signInWithPassword({ email, password: 'mauvais-mot-de-passe' });
  check('connexion : identifiants invalides (invalid_credentials)', bad.error?.code === 'invalid_credentials', bad.error);
  const login = anon();
  const signIn = await login.auth.signInWithPassword({ email, password });
  check('connexion : session ouverte', !signIn.error && !!signIn.data.session, signIn.error);

  // Préférences recopiées dans le profil.
  const patch = await login.from('profiles').update({ lang: 'fr', transport: 'velo', experience: 'audio' }).eq('id', userId ?? '');
  check('profil : langue, transport et expérience enregistrés', !patch.error, patch.error);
  const forbidden = await login.from('profiles').update({ points: 999 } as never).eq('id', userId ?? '');
  check('profil : points non modifiables par l’utilisateur', !!forbidden.error);

  // Prêt pour le départ : ligne en cours dans le sens choisi (upsert idempotent).
  if (lineId) {
    for (const direction of ['backward', 'forward'] as const) {
      const upsert = await login
        .from('line_progress')
        .upsert({ user_id: userId ?? '', line_id: lineId, direction }, { onConflict: 'user_id,line_id' });
      check(`progression : ligne en cours (${direction})`, !upsert.error, upsert.error);
    }
    const progress = await login.from('line_progress').select('direction, status').eq('line_id', lineId).single();
    check('progression : sens mis à jour, statut en cours', progress.data?.direction === 'forward' && progress.data.status === 'in_progress', progress.data);
    const other = await anon().from('line_progress').select('user_id').eq('line_id', lineId);
    // Le rôle anon n'a aucun droit sur la table : refus ou résultat vide.
    check('progression : invisible pour un invité', !!other.error || other.data.length === 0, other.data);
  }

  // Mot de passe oublié : lien envoyé (Mailpit en local).
  const reset = await anon().auth.resetPasswordForEmail(email, { redirectTo: 'llds://nouveau-mot-de-passe' });
  check('mot de passe oublié : e-mail de réinitialisation envoyé', !reset.error, reset.error);
} finally {
  if (userId) await service.auth.admin.deleteUser(userId);
}

console.log(failures === 0 ? '\nOnboarding : toutes les vérifications passent.' : `\n${failures} vérification(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
