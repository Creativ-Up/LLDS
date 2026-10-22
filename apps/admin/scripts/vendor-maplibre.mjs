// Copie le worker de MapLibre GL (autonome, sans import) dans public/vendor/ : une fois le code
// empaqueté par Next, MapLibre ne peut plus le trouver à côté de son propre fichier.
// Le chemin est fourni à MapLibre via setWorkerUrl (src/features/lines/line-map.tsx).
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const source = resolve(dirname(require.resolve('maplibre-gl/package.json')), 'dist/maplibre-gl-worker.mjs');
const target = resolve(here, '../public/vendor/maplibre-gl-worker.mjs');

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
