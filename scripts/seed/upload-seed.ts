/**
 * Complète le seed après `supabase db reset` :
 *   - téléverse les médias du manifeste dans Storage (écrasement si déjà présents) ;
 *   - crée le compte admin de `seed/demo-seed.json` et lui donne le rôle `admin`.
 *
 * Utilise la clé service role de l'instance LOCALE uniquement.
 * Usage : `pnpm seed:upload` (inclus dans `pnpm db:reset`).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { seedFileSchema, type Database } from '@llds/shared';
import { createClient } from '@supabase/supabase-js';

import { localSupabaseStatus, repoRoot } from '../lib/supabase-cli';
import { mediaManifestSchema } from './manifest';

const status = localSupabaseStatus();
const supabase = createClient<Database>(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const manifest = mediaManifestSchema.parse(
  JSON.parse(readFileSync(resolve(repoRoot, 'supabase/seed-media/manifest.json'), 'utf8')),
);
const seed = seedFileSchema.parse(JSON.parse(readFileSync(resolve(repoRoot, 'seed/demo-seed.json'), 'utf8')));

async function uploadMedia(): Promise<void> {
  let bytes = 0;
  for (const entry of manifest.files) {
    const body = readFileSync(resolve(repoRoot, entry.file));
    const { error } = await supabase.storage
      .from(entry.bucket)
      .upload(entry.path, body, { contentType: entry.mime, upsert: true });
    if (error) throw new Error(`Téléversement de ${entry.bucket}/${entry.path} : ${error.message}`);
    bytes += body.byteLength;
  }
  console.log(`storage → ${manifest.files.length} fichiers (${(bytes / 1024 / 1024).toFixed(1)} Mo)`);
}

async function findUserId(email: string): Promise<string | null> {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) return user.id;
    if (data.users.length < 200) return null;
  }
}

async function ensureAdmin(): Promise<void> {
  const { email, password, first_name } = seed.admin;
  let userId = await findUserId(email);
  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, lang: 'fr' },
    });
    if (error) throw error;
    userId = data.user.id;
  }
  const { error } = await supabase.from('profiles').update({ role: 'admin', first_name }).eq('id', userId);
  if (error) throw error;
  console.log(`auth → compte admin ${email}`);
}

await uploadMedia();
await ensureAdmin();
