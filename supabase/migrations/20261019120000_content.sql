-- Contenu géré dans le back-office : médias, lignes, cachets, arrêts, partenaires, avantages, réglages.
-- Référence : docs/DATA_MODEL.md. Aucune valeur calculée n'est saisie à la main (longueur, compteurs…).

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.lang_code as enum ('fr', 'nl', 'en');
create type public.line_status as enum ('draft', 'published', 'coming_soon');
-- L'ordre de l'énumération est l'ordre d'affichage des services (fiche du point).
create type public.stop_service as enum ('cafe', 'parking', 'info', 'restaurant', 'gare', 'patrimoine', 'remise');
create type public.stop_media_kind as enum ('video', 'audio', 'subtitles');
create type public.stamp_rule as enum ('stop_completed', 'line_completed', 'points_threshold');
create type public.media_bucket as enum ('media', 'media-public');

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------------

-- Texte traduit : objet { "fr": "…", "nl": "…", "en": "…" }, chaque clé optionnelle (repli sur fr).
create function public.is_i18n_text(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'object'
     and not exists (
       select 1
       from jsonb_each(value) as entry(key, val)
       where entry.key not in ('fr', 'nl', 'en')
          or jsonb_typeof(entry.val) <> 'string'
     );
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Réglages (une seule ligne)
-- ---------------------------------------------------------------------------

create table public.app_settings (
  id boolean primary key default true constraint app_settings_singleton check (id),
  default_geofence_radius_m integer not null default 80 check (default_geofence_radius_m between 10 and 1000),
  walk_kmh double precision not null default 4.5 check (walk_kmh > 0),
  bike_kmh double precision not null default 15 check (bike_kmh > 0),
  car_kmh double precision not null default 30 check (car_kmh > 0),
  default_guest_preview_s integer not null default 12 check (default_guest_preview_s > 0),
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (true);

create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

-- Valeurs par défaut des arrêts, lues dans les réglages au moment de la création.
create function public.default_geofence_radius_m()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select default_geofence_radius_m from public.app_settings where id;
$$;

create function public.default_guest_preview_s()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select default_guest_preview_s from public.app_settings where id;
$$;

-- ---------------------------------------------------------------------------
-- Médias (fichiers dans Storage)
-- ---------------------------------------------------------------------------

create table public.media (
  id uuid primary key default gen_random_uuid(),
  bucket public.media_bucket not null,
  path text not null check (btrim(path) <> ''),
  mime text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  duration_s double precision check (duration_s >= 0),
  width integer check (width > 0),
  height integer check (height > 0),
  sha256 text check (sha256 ~ '^[0-9a-f]{64}$'),
  -- Droits / source de l'archive.
  credit text,
  original_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_bucket_path_key unique (bucket, path)
);

create trigger media_updated_at before update on public.media
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Lignes
-- ---------------------------------------------------------------------------

create table public.lines (
  id uuid primary key default gen_random_uuid(),
  code text not null check (btrim(code) <> ''),
  name jsonb not null default '{}' check (public.is_i18n_text(name)),
  tagline jsonb not null default '{}' check (public.is_i18n_text(tagline)),
  cover_media_id uuid references public.media (id) on delete set null,
  track extensions.geography(LineString, 4326),
  -- Calculé par trigger à partir du tracé.
  length_m double precision,
  status public.line_status not null default 'draft',
  -- Incrémenté à chaque publication (l'app propose alors la mise à jour hors ligne).
  content_version integer not null default 0 check (content_version >= 0),
  published_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lines_code_key unique (code)
);

create index lines_track_idx on public.lines using gist (track);
create index lines_cover_media_idx on public.lines (cover_media_id);

create function public.lines_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.length_m := case when new.track is null then null else extensions.st_length(new.track) end;

  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.content_version := (case when tg_op = 'INSERT' then new.content_version else old.content_version end) + 1;
    new.published_at := now();
  end if;

  return new;
end;
$$;

create trigger lines_before_write before insert or update on public.lines
  for each row execute function public.lines_before_write();

create trigger lines_updated_at before update on public.lines
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Cachets
-- ---------------------------------------------------------------------------

create table public.stamps (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null default '{}' check (public.is_i18n_text(name)),
  -- Sans image : cachet générique dans l'app.
  image_media_id uuid references public.media (id) on delete set null,
  rule public.stamp_rule not null default 'stop_completed',
  line_id uuid references public.lines (id) on delete cascade,
  points_threshold integer check (points_threshold > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stamps_points_threshold_rule check ((rule = 'points_threshold') = (points_threshold is not null)),
  constraint stamps_line_completed_rule check (rule <> 'line_completed' or line_id is not null)
);

create index stamps_line_idx on public.stamps (line_id);
create index stamps_image_media_idx on public.stamps (image_media_id);

create trigger stamps_updated_at before update on public.stamps
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Arrêts (aucune limite de nombre)
-- ---------------------------------------------------------------------------

create table public.stops (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.lines (id) on delete cascade,
  -- Ordre sur la ligne (1 = premier arrêt dans le sens « aller »).
  position integer not null check (position >= 1),
  name jsonb not null default '{}' check (public.is_i18n_text(name)),
  -- Année de la carte postale d'archive.
  year integer check (year between 1800 and 2100),
  location extensions.geography(Point, 4326) not null,
  geofence_radius_m integer not null default public.default_geofence_radius_m()
    check (geofence_radius_m between 10 and 1000),
  description jsonb not null default '{}' check (public.is_i18n_text(description)),
  services public.stop_service[] not null default '{}',
  points integer not null default 50 check (points >= 0),
  requires_on_site boolean not null default true,
  archive_media_id uuid references public.media (id) on delete set null,
  -- Photo actuelle, optionnelle : sans elle, pas de comparateur hier / aujourd'hui.
  present_media_id uuid references public.media (id) on delete set null,
  stamp_id uuid references public.stamps (id) on delete set null,
  guest_preview_s integer not null default public.default_guest_preview_s() check (guest_preview_s > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Différée pour permettre le réordonnancement dans une seule transaction.
  constraint stops_line_position_key unique (line_id, position) deferrable initially deferred
);

create index stops_line_idx on public.stops (line_id);
create index stops_location_idx on public.stops using gist (location);
create index stops_archive_media_idx on public.stops (archive_media_id);
create index stops_present_media_idx on public.stops (present_media_id);
create index stops_stamp_idx on public.stops (stamp_id);

create trigger stops_updated_at before update on public.stops
  for each row execute function public.set_updated_at();

-- Une ligne par langue et par type de média (vidéo, audio seul, sous-titres).
create table public.stop_media (
  stop_id uuid not null references public.stops (id) on delete cascade,
  lang public.lang_code not null,
  kind public.stop_media_kind not null,
  media_id uuid not null references public.media (id) on delete cascade,
  primary key (stop_id, lang, kind)
);

create index stop_media_media_idx on public.stop_media (media_id);

-- ---------------------------------------------------------------------------
-- Partenaires et avantages
-- ---------------------------------------------------------------------------

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  address text,
  -- Affichée dans « Mes avantages » (« {ville} · {titre} »).
  city text,
  opening_hours jsonb not null default '{}' check (public.is_i18n_text(opening_hours)),
  photo_media_id uuid references public.media (id) on delete set null,
  logo_media_id uuid references public.media (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index partners_photo_media_idx on public.partners (photo_media_id);
create index partners_logo_media_idx on public.partners (logo_media_id);

create trigger partners_updated_at before update on public.partners
  for each row execute function public.set_updated_at();

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  title jsonb not null default '{}' check (public.is_i18n_text(title)),
  description jsonb not null default '{}' check (public.is_i18n_text(description)),
  conditions jsonb not null default '{}' check (public.is_i18n_text(conditions)),
  -- Cachet à présenter chez le partenaire.
  required_stamp_id uuid references public.stamps (id) on delete set null,
  -- L'avantage devient visible quand l'utilisateur atteint cet arrêt.
  visible_from_stop_id uuid references public.stops (id) on delete set null,
  valid_from date,
  valid_until date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_validity_range check (valid_from is null or valid_until is null or valid_until >= valid_from)
);

create index offers_partner_idx on public.offers (partner_id);
create index offers_required_stamp_idx on public.offers (required_stamp_id);
create index offers_visible_from_stop_idx on public.offers (visible_from_stop_id);

create trigger offers_updated_at before update on public.offers
  for each row execute function public.set_updated_at();
