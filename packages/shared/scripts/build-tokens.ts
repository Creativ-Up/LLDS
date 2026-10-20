/**
 * Génère les tokens de design à partir de `tokens/tokens.json` (source unique) :
 *   - src/tokens/generated.ts       → objet typé pour l'app mobile et l'admin
 *   - src/tokens/tokens.css         → variables CSS `--llds-*`
 *   - src/tokens/tailwind-theme.css → bloc `@theme` Tailwind v4 pour l'admin
 *
 * Usage : `pnpm tokens` (à la racine) ou `pnpm --filter @llds/shared tokens`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(here, '../../../tokens/tokens.json');
const outDir = resolve(here, '../src/tokens');

const colorValue = z.string().regex(/^(#[0-9A-Fa-f]{6}|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\))$/);
const typeStyle = z.object({
  size: z.number(),
  lineHeight: z.number().optional(),
  weight: z.number(),
  letterSpacing: z.number().optional(),
  uppercase: z.boolean().optional(),
});

const tokensSchema = z.object({
  color: z
    .object({
      palette: z.record(z.string(), colorValue),
      admin: z.record(z.string(), colorValue),
    })
    .catchall(colorValue),
  font: z.object({
    family: z.string(),
    weights: z.array(z.number()),
    italic: z.array(z.number()),
  }),
  type: z.record(z.string(), typeStyle),
  radius: z.record(z.string(), z.number()),
  stroke: z.record(z.string(), z.number()),
  layout: z.record(z.string(), z.number()),
  motion: z
    .object({ easing: z.tuple([z.number(), z.number(), z.number(), z.number()]) })
    .catchall(z.number()),
});

type Tokens = z.infer<typeof tokensSchema>;

const tokens: Tokens = tokensSchema.parse(JSON.parse(readFileSync(sourcePath, 'utf8')));

const HEADER = 'Généré par packages/shared/scripts/build-tokens.ts depuis tokens/tokens.json — ne pas modifier.';

const kebab = (key: string): string =>
  key
    .replace(/([a-z])([A-Z0-9])/g, '$1-$2')
    .replace(/([0-9])([a-zA-Z])/g, '$1-$2')
    .toLowerCase();

const entries = <T>(record: Record<string, T>): [string, T][] => Object.entries(record);

/** Couleurs « de premier niveau » (hors groupes palette / admin). */
function baseColors(t: Tokens): [string, string][] {
  return entries(t.color).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
}

function cubicBezier(t: Tokens): string {
  return `cubic-bezier(${t.motion.easing.join(', ')})`;
}

function motionDurations(t: Tokens): [string, number][] {
  return entries(t.motion).filter((entry): entry is [string, number] => typeof entry[1] === 'number');
}

function buildTs(t: Tokens): string {
  return `// ${HEADER}\n\nexport const tokens = ${JSON.stringify(t, null, 2)} as const;\n`;
}

function buildCss(t: Tokens): string {
  const lines: string[] = [];
  for (const [key, value] of baseColors(t)) lines.push(`--llds-${kebab(key)}: ${value};`);
  for (const [key, value] of entries(t.color.palette)) lines.push(`--llds-palette-${kebab(key)}: ${value};`);
  for (const [key, value] of entries(t.color.admin)) lines.push(`--llds-admin-${kebab(key)}: ${value};`);
  lines.push(`--llds-font: ${t.font.family}, system-ui, sans-serif;`);
  for (const [key, value] of entries(t.radius)) lines.push(`--llds-radius-${kebab(key)}: ${value}px;`);
  for (const [key, value] of entries(t.stroke)) lines.push(`--llds-stroke-${kebab(key)}: ${value}px;`);
  lines.push(`--llds-ease: ${cubicBezier(t)};`);
  for (const [key, value] of motionDurations(t)) lines.push(`--llds-duration-${kebab(key)}: ${value}ms;`);
  return `/* ${HEADER} */\n\n:root {\n${lines.map((l) => `  ${l}`).join('\n')}\n}\n`;
}

function buildTailwindTheme(t: Tokens): string {
  const lines: string[] = ['--color-*: initial;', '--color-white: #FFFFFF;', '--color-black: #000000;'];
  for (const [key, value] of baseColors(t)) {
    if (key !== 'white') lines.push(`--color-${kebab(key)}: ${value};`);
  }
  for (const [key, value] of entries(t.color.palette)) lines.push(`--color-palette-${kebab(key)}: ${value};`);
  for (const [key, value] of entries(t.color.admin)) lines.push(`--color-admin-${kebab(key)}: ${value};`);
  lines.push(`--font-sans: var(--font-inter), ${t.font.family}, system-ui, sans-serif;`);
  for (const [key, value] of entries(t.radius)) lines.push(`--radius-${kebab(key)}: ${value}px;`);
  lines.push(`--ease-llds: ${cubicBezier(t)};`);
  return `/* ${HEADER} */\n\n@theme {\n${lines.map((l) => `  ${l}`).join('\n')}\n}\n`;
}

const outputs: [string, string][] = [
  ['generated.ts', buildTs(tokens)],
  ['tokens.css', buildCss(tokens)],
  ['tailwind-theme.css', buildTailwindTheme(tokens)],
];

for (const [file, content] of outputs) {
  writeFileSync(resolve(outDir, file), content, 'utf8');
  console.log(`tokens → src/tokens/${file}`);
}
