/**
 * Écrit les fichiers `.env.local` de l'admin et de l'app mobile à partir de l'instance Supabase locale.
 * Seules l'URL et la clé anonyme (publique) sont écrites : jamais la clé service role.
 * Usage : `pnpm env:local` (après `pnpm db:start`).
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { localSupabaseStatus, repoRoot } from './lib/supabase-cli';

const { API_URL, ANON_KEY } = localSupabaseStatus();
const header = '# Généré par `pnpm env:local` depuis `supabase status` (instance locale).';

const targets: [string, Record<string, string>][] = [
  ['apps/admin/.env.local', { NEXT_PUBLIC_SUPABASE_URL: API_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON_KEY }],
  ['apps/mobile/.env.local', { EXPO_PUBLIC_SUPABASE_URL: API_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY: ANON_KEY }],
];

for (const [file, vars] of targets) {
  const body = Object.entries(vars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  writeFileSync(resolve(repoRoot, file), `${header}\n${body}\n`, 'utf8');
  console.log(`env → ${file}`);
}
