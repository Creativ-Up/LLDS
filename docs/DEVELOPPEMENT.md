# Développement

## Prérequis

- **Node.js ≥ 22** et **pnpm 10** (`npm i -g pnpm@10`, version figée dans `packageManager`).
- **Docker Desktop** démarré (Supabase local).
- **ffmpeg** (optionnel) : génère les vidéos et audios placeholder du seed. Sans lui, le seed ne contient que les images et sous-titres.
- App mobile : un **build de développement** (Expo Dev Client) installé sur le téléphone — la carte MapLibre, le géofencing et les notifications n'existent pas dans Expo Go. Voir « Build de développement Android » ci-dessous.

## Premier lancement

```bash
pnpm bootstrap   # install + supabase start + seed complet + fichiers .env.local
pnpm dev         # admin (http://localhost:3000) + Metro (app mobile)
```

## Commandes

| Commande | Rôle |
| --- | --- |
| `pnpm dev` | Lance l'admin Next.js et le serveur Expo (Turborepo) |
| `pnpm dev:usb` | App sur un téléphone Android branché en USB (`adb reverse` de Metro et Supabase), sans dépendre du Wi-Fi |
| `pnpm dev:tunnel` | App via le tunnel Expo (exige `npx expo login`) ; Supabase local reste injoignable depuis le téléphone |
| `pnpm typecheck` / `pnpm lint` | Vérifications TypeScript strict et ESLint sur tout le monorepo |
| `pnpm test` | Tests unitaires de la logique partagée (géométrie du tracé, guidage, arrivées, trajet simulé) |
| `pnpm db:start` / `pnpm db:stop` | Démarre / arrête Supabase local |
| `pnpm db:reset` | Recrée la base : migrations → `seed.sql` → médias dans Storage → compte admin |
| `pnpm db:check` | Vérifie les règles d'accès (anonyme, utilisateur, admin) sur la base locale |
| `pnpm db:check:onboarding` | Rejoue les appels Supabase de l'onboarding mobile (inscription, erreurs Auth, profil, ligne en cours, invité) |
| `pnpm db:types` | Régénère `packages/shared/src/database.types.ts` (après chaque migration) |
| `pnpm tokens` | Régénère les tokens depuis `tokens/tokens.json` |
| `pnpm seed:build [--force]` | Régénère `supabase/seed.sql` et les placeholders depuis `seed/demo-seed.json` |
| `pnpm env:local` | Écrit `apps/admin/.env.local` et `apps/mobile/.env.local` (URL + clé anonyme locales) |

## Services locaux

| Service | URL |
| --- | --- |
| Admin | http://localhost:3000 |
| API Supabase | http://127.0.0.1:54321 |
| Supabase Studio (base, Storage, Auth) | http://127.0.0.1:54323 |
| Mailpit (e-mails, ex. réinitialisation) | http://127.0.0.1:54324 |
| Metro (Expo) | http://localhost:8081 |

Compte admin du seed : `admin@llds.local` / `change-me-admin` (voir `seed/demo-seed.json`).

Sur un téléphone physique, l'app remplace automatiquement `127.0.0.1` par l'adresse IP de la machine de développement (celle de Metro).

## Organisation

- `supabase/migrations/` : schéma (`docs/DATA_MODEL.md`), vues des valeurs calculées (`line_overview`, `stop_overview`, `line_stamps`), RLS, buckets Storage.
- `supabase/seed.sql` et `supabase/seed-media/` sont **générés** (non versionnés) par `scripts/seed/build-seed.ts`. Les identifiants sont des UUID v5 stables.
- `packages/shared` : schémas zod, énumérations (alignement vérifié à la compilation avec les types Postgres), fonctions de domaine, tokens générés, traductions FR / NL / EN.
- `apps/admin` : Next.js 16 (App Router, Cache Components, Tailwind v4 avec le thème `@llds/shared/tailwind-theme.css`).
- `apps/mobile` : Expo SDK 58, Expo Router (`src/app/`), polices Inter, i18n `react-i18next`.

## Back-office (admin)

- Routes : `/connexion`, `/` (tableau de bord), `/lignes`, `/lignes/{id}` (panneau d'arrêt : `?arret={id}&onglet=infos|media|services|reward`), `/cachets`, `/partenaires`, `/mediatheque`, `/utilisateurs`, `/reglages`.
- Accès : le proxy Next (`src/proxy.ts`) redirige vers la connexion et refuse les comptes non admin ; la RLS reste l'autorité.
- Les règles métier sont en base (`supabase/migrations/20261020100000_admin.sql`) : contrôle avant publication (`line_publication_issues`, publication refusée par trigger s'il reste un point bloquant), placement aimanté au tracé et ordonné le long de la ligne (`add_stop`, `move_stop`), réordonnancement, import du tracé, journal des modifications, liste et suppression RGPD des comptes.
- Fond de carte de l'éditeur : tuiles OpenFreeMap (en ligne, sans clé), configurable via `NEXT_PUBLIC_MAP_STYLE_URL` (vide = fond uni sans tuiles). Le worker MapLibre est copié dans `public/vendor/` au lancement (non versionné).
- Médias : téléversés depuis le navigateur dans Storage (barre de progression), métadonnées mesurées (taille, dimensions, durée, SHA-256). Bucket `media-public` pour couvertures, cachets et visuels partenaires ; `media` (URLs signées) pour le reste.
- `pnpm db:check` rejoue le critère d'acceptation M1 côté base (ligne de 3 arrêts créée de zéro, publiée, visible par l'app).

## Application mobile

- Parcours d'onboarding (`src/app/`) : `accueil` → `connexion` / `inscription` / `mot-de-passe-oublie` (lien e-mail → `nouveau-mot-de-passe`, schéma `llds://`, ou `exp://…/--/` dans Expo Go : `lib/links.ts`) → `langue` → `autorisations` → `lignes` → `ligne/[id]` → `transport` → `experience` → `pret` → `carte`. `index` redirige selon les préférences enregistrées ; `dev` garde l'écran de diagnostic et « Réinitialiser l'app » (déconnexion + effacement des choix).
- Expo Go 58 se déclare `executionEnvironment: "bare"` : le détecter avec `isRunningInExpoGo()` (paquet `expo`). `expo-notifications` n'y est chargé qu'en dehors d'Expo Go (`lib/notifications.ts`).
- Les choix (langue, ligne, sens, transport, expérience, mode invité) sont stockés sur l'appareil (`expo-sqlite/localStorage`) et recopiés dans `profiles` pour un compte. Les messages de validation des formulaires suivent l'ordre du prototype (`features/auth/auth-form.ts`).
- Mise en page : les positions de la maquette (390 × 852) sont recalées sur les zones sûres de l'appareil (`theme/layout.ts`).
- Le typecheck régénère d'abord les routes typées d'Expo Router (`scripts/typed-routes.js`), sans lancer Metro.
- E-mails envoyés en local (réinitialisation du mot de passe) : Mailpit, http://127.0.0.1:54324.

## Build de développement Android

Le code natif (`apps/mobile/android/`, non versionné) est généré par `expo prebuild` à partir de `app.config.ts` et de ses plugins. Après l'ajout d'une dépendance native :

```bash
cd apps/mobile
npx expo prebuild --platform android --no-install
cd android
# JDK : celui d'Android Studio (JAVA_HOME="C:\Program Files\Android\Android Studio\jbr")
./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

- Identifiant de l'application : `be.creativup.llds`. Le JavaScript vient toujours de Metro (`pnpm dev:usb`, puis « a ») ; seul l'ajout d'un module natif impose de recompiler.
- Windows : les fichiers objets CMake dépassent 260 caractères dans un dossier profond. Le plugin `plugins/with-long-path-cmake.js` impose CMake 3.31.6 (ninja ≥ 1.12, chemins longs) ; l'installer une fois avec `sdkmanager "cmake;3.31.6"`. La prise en charge des chemins longs doit être activée dans Windows (`LongPathsEnabled`).
- MIUI (Xiaomi) : activer « Installer via USB » dans les options développeur, sinon `adb install` échoue (`INSTALL_FAILED_USER_RESTRICTED`).

## Carte et arrivées (jalon M3)

- `src/app/carte.tsx` : carte MapLibre sans tuiles (fond crème, tracé et arrêts en GeoJSON, utilisable hors ligne), guidage vers le prochain arrêt, bandeau d'arrivée, fiche du point d'intérêt et fiche de ligne. La logique pure (tracé orienté selon le sens, prochain arrêt, consigne, entrées dans les rayons, trajet simulé) est dans `packages/shared/src/domain/route.ts`, testée par `pnpm test`.
- Arrivées application ouverte : position suivie par `features/map/use-tracking.ts` (précision > 50 m ignorée, sortie au-delà du rayon + 30 m) → bandeau + vibration. Application fermée : géofencing système (`features/map/geofencing.ts`, 15 arrêts non visités au plus, autorisation « Toujours ») → notification locale ; la toucher ouvre la fiche de l'arrêt.
- **Simulation de position** (menu développeur : menu Expo du build, ou appui long sur la pilule de ligne de la carte) : placer la position près d'un arrêt (« Approcher »), dans son rayon (« Entrer »), ou parcourir la ligne à ×10 / ×30 / ×100 la vitesse du mode de transport. Si l'application passe en arrière-plan pendant un trajet simulé, les arrivées à venir sont notifiées à l'heure prévue.
- Destinations des jalons suivants (`lecteur`, `carnet`, `parametres`, `cachets`, `avantages`) : écrans d'attente.

## Règles à garder en tête

- Nouvelle migration → `pnpm db:reset` puis `pnpm db:types` (le typecheck échoue si une énumération TS diverge de Postgres).
- Couleurs, rayons, traits, durées : uniquement via les tokens (`tokens/tokens.json` → `pnpm tokens`). Le thème Tailwind de l'admin n'expose **que** les couleurs LLDS.
- Textes d'interface : uniquement via les clés i18n de `packages/shared/src/i18n/locales/` ; NL et EN doivent avoir exactement les clés du FR (vérifié à la compilation). Le back-office est en français seulement (`admin.fr.ts`).
- La clé service role ne sort jamais des scripts locaux et des Edge Functions.
