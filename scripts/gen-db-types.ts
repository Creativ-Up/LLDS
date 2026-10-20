/**
 * Génère packages/shared/src/database.types.ts depuis la base locale.
 * Usage : `pnpm db:types` (après `pnpm db:start` ou une nouvelle migration).
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { repoRoot, runSupabase } from './lib/supabase-cli';

const target = resolve(repoRoot, 'packages/shared/src/database.types.ts');
const types = runSupabase(['gen', 'types', 'typescript', '--local', '--schema', 'public']);

writeFileSync(
  target,
  `// Généré par \`pnpm db:types\` (supabase gen types) — ne pas modifier.\n\n${types.trim()}\n`,
  'utf8',
);
console.log(`types → ${target}`);
