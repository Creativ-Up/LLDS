# Modèle de données (Supabase / Postgres + PostGIS)

Les champs traduits sont des colonnes `jsonb` de la forme `{ "fr": "…", "nl": "…", "en": "…" }` ; repli sur `fr` si une langue manque.

## Contenu (géré dans l'admin)

**lines**
- `id uuid`, `code text` (ex. « L87 »), `name jsonb` (« Bassilly - Renaix »), `tagline jsonb` (ex. « pierre & porphyre »)
- `cover_media_id` → media (carte postale de la ligne)
- `track geography(LineString, 4326)` — tracé importé
- `length_m` — **calculé** (`ST_Length`) par trigger
- `status` : `draft | published | coming_soon` (coming_soon = affichée grisée, non sélectionnable)
- `content_version int` — incrémenté à chaque publication
- `sort_order int`, `created_at`, `updated_at`

**stops** (aucune limite de nombre)
- `id`, `line_id`, `position int` (ordre sur la ligne, réordonnable)
- `name jsonb` (« Gare de Bassilly »), `year int` (année de la carte postale, ex. 1905)
- `location geography(Point, 4326)`, `geofence_radius_m int` (défaut 80)
- `description jsonb`
- `services text[]` ⊂ `cafe, parking, info, restaurant, gare, patrimoine, remise`
- `points int` (défaut 50)
- `requires_on_site boolean` (défaut true : « Vivre l'expérience » actif seulement dans le rayon)
- `archive_media_id` (carte postale), `present_media_id` (photo actuelle, optionnelle — sans elle, pas de comparateur)
- `stamp_id` (optionnel) — cachet obtenu en terminant l'arrêt
- `guest_preview_s int` (défaut 12) — durée de l'aperçu invité

**stop_media** — une ligne par langue et type
- `stop_id`, `lang (fr|nl|en)`, `kind (video|audio|subtitles)`, `media_id`

**media**
- `id`, `bucket`, `path`, `mime`, `size_bytes`, `duration_s`, `width`, `height`, `sha256`, `credit text` (droits / source de l'archive)

**stamps**
- `id`, `name jsonb`, `image_media_id` (optionnel → cachet générique), `rule` : `stop_completed | line_completed | points_threshold`, `line_id` (optionnel), `points_threshold` (si règle de points)

**partners**
- `id`, `name`, `address`, `opening_hours jsonb`, `photo_media_id`, `logo_media_id`

**offers** (avantages / bons)
- `id`, `partner_id`, `title jsonb` (« 15% de remise sur votre addition »), `description jsonb`, `conditions jsonb`
- `required_stamp_id` — cachet à présenter
- `visible_from_stop_id` — l'avantage devient visible quand l'utilisateur atteint cet arrêt
- `valid_from`, `valid_until`, `active boolean`

**app_settings** (une ligne)
- `default_geofence_radius_m`, `walk_kmh` (4,5), `bike_kmh` (15), `car_kmh` (30), `default_guest_preview_s`

## Utilisateurs

**profiles** (1–1 avec `auth.users`)
- `first_name`, `lang`, `transport (pied|velo|voiture)`, `experience (complete|audio)`, `text_size`, `role (user|admin)`

**line_progress** — `user_id`, `line_id`, `direction (forward|backward)`, `status (in_progress|completed)`, `started_at`, `completed_at`

**stop_completions** — `user_id`, `stop_id`, `completed_at`, `points_awarded` ; **unique (user_id, stop_id)**

**user_stamps** — `user_id`, `stamp_id`, `awarded_at` ; unique

**offer_unlocks** — `user_id`, `offer_id`, `unlocked_at`

Valeurs **calculées, jamais stockées en dur** : nombre d'arrêts (`count(stops)`), points max (`sum(points)`), cachets de la ligne, points et cachets de l'utilisateur, prochain arrêt, durée estimée (`length_m / vitesse du mode`).

## Règles d'accès (RLS)

- Contenu : lecture publique (anon) des lignes `published` / `coming_soon` et de leurs arrêts, médias, cachets, partenaires et avantages actifs ; écriture réservée à `role = 'admin'`.
- Données utilisateur : chaque utilisateur ne lit et n'écrit que ses lignes. `stop_completions`, `user_stamps` et `offer_unlocks` ne sont écrites **que par l'Edge Function `complete-stop`** (service role), qui vérifie : utilisateur connecté, arrêt publié, pas déjà terminé, puis crédite les points, attribue les cachets (règles stop / ligne / seuil de points) et déverrouille les avantages.
- Les invités n'ont pas de compte : leur progression reste locale et **n'est pas conservée** (texte affiché dans l'app).

## Storage

- Bucket `media` (privé, URLs signées longue durée pour l'app) ; miniatures publiques dans `media-public` (couvertures, cachets, logos).
