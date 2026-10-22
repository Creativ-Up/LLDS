// Génère .expo/types/router.d.ts (routes typées d'Expo Router) sans lancer Metro,
// pour que `pnpm typecheck` fonctionne sur un dépôt fraîchement cloné.
const fs = require('node:fs');
const path = require('node:path');

const root = path.dirname(require.resolve('../package.json'));
const typesDirectory = path.join(root, '.expo', 'types');

// Lu au chargement du module : à définir avant le require.
process.env.EXPO_ROUTER_APP_ROOT = path.join(root, 'src', 'app');
const { regenerateDeclarations } = require('@expo/router-server/build/typed-routes');

fs.mkdirSync(typesDirectory, { recursive: true });
regenerateDeclarations(typesDirectory, {});
