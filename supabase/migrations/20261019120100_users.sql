-- Utilisateurs : profils (1–1 avec auth.users) et progression.
-- stop_completions, user_stamps et offer_unlocks ne sont écrites que par l'Edge Function
-- `complete-stop` (service role) : aucun droit d'écriture côté client (voir migration RLS).

create type public.user_role as enum ('user', 'admin');
create type public.transport_mode as enum ('pied', 'velo', 'voiture');
create type public.experience_type as enum ('complete', 'audio');
create type public.text_size as enum ('normal', 'large', 'xlarge');
create type public.line_direction as enum ('forward', 'backward');
create type public.progress_status as enum ('in_progress', 'completed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  lang public.lang_code not null default 'fr',
  transport public.transport_mode,
  experience public.experience_type,
  text_size public.text_size not null default 'normal',
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Création automatique du profil à l'inscription. Le rôle n'est jamais lu dans les
-- métadonnées (modifiables par l'utilisateur) : il reste « user » par défaut.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta_lang text := new.raw_user_meta_data ->> 'lang';
begin
  insert into public.profiles (id, first_name, lang)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    case when meta_lang in ('fr', 'nl', 'en') then meta_lang::public.lang_code else 'fr' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.line_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  line_id uuid not null references public.lines (id) on delete cascade,
  direction public.line_direction not null default 'forward',
  status public.progress_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, line_id),
  constraint line_progress_completed_at check ((status = 'completed') = (completed_at is not null))
);

create index line_progress_line_idx on public.line_progress (line_id);

-- Unicité (user_id, stop_id) : les points d'un arrêt ne sont crédités qu'une fois.
create table public.stop_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  stop_id uuid not null references public.stops (id) on delete cascade,
  completed_at timestamptz not null default now(),
  points_awarded integer not null default 0 check (points_awarded >= 0),
  primary key (user_id, stop_id)
);

create index stop_completions_stop_idx on public.stop_completions (stop_id);

create table public.user_stamps (
  user_id uuid not null references auth.users (id) on delete cascade,
  stamp_id uuid not null references public.stamps (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, stamp_id)
);

create index user_stamps_stamp_idx on public.user_stamps (stamp_id);

create table public.offer_unlocks (
  user_id uuid not null references auth.users (id) on delete cascade,
  offer_id uuid not null references public.offers (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

create index offer_unlocks_offer_idx on public.offer_unlocks (offer_id);
