# Architecture technique

## Choix retenus

| Besoin | Choix | Pourquoi |
| --- | --- | --- |
| App mobile | **Expo (React Native) + TypeScript, Expo Router** | Une base de code iOS + Android, builds EAS sans Mac local, écosystème mûr pour carte, géoloc, vidéo et fichiers |
| Back-office | **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** | Même langage que l'app, partage des types, déploiement simple (Vercel) |
| Backend | **Supabase** : Postgres + **PostGIS**, Auth, Storage, Row Level Security, Edge Functions | Un seul service pour la base, les comptes (e-mail + mot de passe, réinitialisation), les fichiers et les règles d'accès ; calculs géographiques natifs |
| Carte | **MapLibre** (`@maplibre/maplibre-react-native` dans l'app, `maplibre-gl` dans l'admin) | Open source, pas de facturation par utilisateur, style entièrement maîtrisé |
| Géofencing | `expo-location` + `expo-task-manager` (régions surveillées en arrière-plan) | Alerte d'arrivée téléphone en poche |
| Notifications | `expo-notifications` (notifications locales) + `expo-haptics` | Pas besoin de serveur push pour le PoC |
| Vidéo / audio | `expo-video` (MP4 H.264, lecture en flux par requêtes HTTP Range ou fichier local), `expo-audio` pour le mode audio seul | Simple ; passage en HLS possible plus tard |
| Téléchargements | `expo-file-system` (téléchargements reprenables) | Hors ligne par ligne |
| Données locales | `expo-sqlite` (contenu téléchargé + file d'attente des actions hors ligne) ; `@tanstack/react-query` (+ persistance) pour le cache réseau | Fonctionne hors connexion, synchronise au retour du réseau |
| UI | `react-native-svg`, `react-native-reanimated`, `react-native-gesture-handler`, `@gorhom/bottom-sheet`, `@expo-google-fonts/inter` | Illustrations SVG, animations, comparateur glissant, fiches en bas d'écran |
| i18n | `i18next` + `react-i18next` (interface) ; colonnes traduites en base (contenus) | FR / NL / EN |
| Validation | `zod` (schémas partagés app / admin / Edge Functions) | Une seule définition des données |

## Carte : pas de dépendance aux tuiles pour le PoC

La carte du design n'affiche **pas de fond de carte routier** : fond crème, tracé de la ligne, arrêts et position. Elle se rend donc entièrement à partir de données GeoJSON (tracé + arrêts) téléchargées avec la ligne, **sans tuiles, et fonctionne hors ligne sans pack de tuiles**.

- Style MapLibre : couche `background` `#FFFDF2` + sources GeoJSON (tracé, arrêts, position).
- Optionnel (en ligne uniquement) : un fond très discret (routes, eau, noms de villages) issu de **Protomaps** (extrait PMTiles de la Belgique hébergé dans Supabase Storage ou Cloudflare R2), en opacité basse. À désactiver hors connexion.

## Géofencing

- iOS surveille au maximum **20 régions** par app, Android 100. L'app enregistre uniquement les arrêts **non visités les plus proches** de la ligne en cours (max 15), et réenregistre à chaque arrivée.
- Rayon par arrêt défini dans l'admin (défaut 80 m).
- Entrée dans une région → notification locale « Vous arrivez à … » + vibration ; si l'app est ouverte, bandeau en haut de la carte (voir `SCREENS.md`).

## Hors ligne

- Chaque ligne publiée a une `content_version`. Le téléchargement récupère un **manifeste** (Edge Function `line-manifest`) : données JSON de la ligne et de ses arrêts, liste des médias avec URL signée, taille et empreinte.
- La taille affichée (« Télécharger la ligne · N Mo ») est la **somme réelle** des médias du manifeste, selon le type d'expérience choisi (« Audio uniquement » télécharge l'audio, pas les vidéos).
- Les actions faites hors connexion (arrêt terminé, points, cachet) sont mises en file d'attente locale et envoyées au retour du réseau ; le serveur reste l'autorité (idempotence par `(user_id, stop_id)`).

## Structure du dépôt

~~~
/
├─ apps/
│  ├─ mobile/        Expo Router (app/), components/, features/, lib/
│  └─ admin/         Next.js App Router
├─ packages/
│  └─ shared/        types, schémas zod, tokens générés, i18n partagé
├─ supabase/
│  ├─ migrations/
│  ├─ functions/     line-manifest, complete-stop
│  └─ seed.sql       généré depuis seed/demo-seed.json
└─ turbo.json, pnpm-workspace.yaml
~~~

## Environnements

- Local : Supabase CLI. Recette : un projet Supabase + Vercel (admin) + EAS (builds internes).
- Variables : `SUPABASE_URL`, `SUPABASE_ANON_KEY` (app + admin), `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions uniquement, jamais dans l'app).
