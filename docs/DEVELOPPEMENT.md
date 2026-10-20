# Développement

## Prérequis

- **Node.js ≥ 22** et **pnpm 10** (`npm i -g pnpm@10`, version figée dans `packageManager`).
- **Docker Desktop** démarré (Supabase local).
- **ffmpeg** (optionnel) : génère les vidéos et audios placeholder du seed. Sans lui, le seed ne contient que les images et sous-titres.
- App mobile : **Expo Go** (SDK 58) sur un téléphone du même réseau, ou un émulateur Android / simulateur iOS. À partir du jalon M3 (MapLibre, géofencing), un *development build* sera nécessaire.

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
| `pnpm db:start` / `pnpm db:stop` | Démarre / arrête Supabase local |
| `pnpm db:reset` | Recrée la base : migrations → `seed.sql` → médias dans Storage → compte admin |
| `pnpm db:check` | Vérifie les règles d'accès (anonyme, utilisateur, admin) sur la base locale |
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

## Règles à garder en tête

- Nouvelle migration → `pnpm db:reset` puis `pnpm db:types` (le typecheck échoue si une énumération TS diverge de Postgres).
- Couleurs, rayons, traits, durées : uniquement via les tokens (`tokens/tokens.json` → `pnpm tokens`). Le thème Tailwind de l'admin n'expose **que** les couleurs LLDS.
- Textes d'interface : uniquement via les clés i18n de `packages/shared/src/i18n/locales/` ; NL et EN doivent avoir exactement les clés du FR (vérifié à la compilation).
- La clé service role ne sort jamais des scripts locaux et des Edge Functions.
