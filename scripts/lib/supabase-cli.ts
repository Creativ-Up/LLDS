import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const require = createRequire(import.meta.url);
const cliEntry = resolve(dirname(require.resolve('supabase/package.json')), 'dist/supabase.js');

/** Exécute le CLI Supabase du dépôt (sans shell, compatible Windows) et renvoie sa sortie standard. */
export function runSupabase(args: string[]): string {
  const result = spawnSync(process.execPath, [cliEntry, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`supabase ${args.join(' ')} a échoué :\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

const statusSchema = z.object({
  API_URL: z.url(),
  ANON_KEY: z.string().min(1),
  SERVICE_ROLE_KEY: z.string().min(1),
  STUDIO_URL: z.url().optional(),
});
export type LocalSupabaseStatus = z.infer<typeof statusSchema>;

/** URL et clés de l'instance Supabase locale (`supabase start` doit avoir été lancé). */
export function localSupabaseStatus(): LocalSupabaseStatus {
  const raw = runSupabase(['status', '-o', 'json']);
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  return statusSchema.parse(JSON.parse(json));
}
