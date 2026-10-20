-- Règles d'accès (docs/DATA_MODEL.md § Règles d'accès).
-- Les GRANT sont explicites (indépendants du réglage `auto_expose_new_tables`), puis la RLS filtre les lignes.

-- ---------------------------------------------------------------------------
-- Fonctions d'aide (security definer : pas de récursion RLS, plan mis en cache)
-- ---------------------------------------------------------------------------

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- Ligne visible du public : publiée ou « bientôt disponible ».
create function public.is_line_visible(p_line_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lines l
    where l.id = p_line_id and l.status in ('published', 'coming_soon')
  );
$$;

create function public.is_stop_visible(p_stop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.stops s
    join public.lines l on l.id = s.line_id
    where s.id = p_stop_id and l.status in ('published', 'coming_soon')
  );
$$;

-- Média utilisé par un contenu visible du public.
create function public.is_media_public(p_media_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.lines l
      where l.cover_media_id = p_media_id and l.status in ('published', 'coming_soon')
    )
    or exists (
      select 1 from public.stops s
      join public.lines l on l.id = s.line_id
      where p_media_id in (s.archive_media_id, s.present_media_id)
        and l.status in ('published', 'coming_soon')
    )
    or exists (
      select 1 from public.stop_media sm
      join public.stops s on s.id = sm.stop_id
      join public.lines l on l.id = s.line_id
      where sm.media_id = p_media_id and l.status in ('published', 'coming_soon')
    )
    or exists (
      select 1 from public.stamps st
      where st.image_media_id = p_media_id
        and (st.line_id is null or public.is_line_visible(st.line_id))
    )
    or exists (
      select 1 from public.partners p
      where p_media_id in (p.photo_media_id, p.logo_media_id)
    );
$$;

-- ---------------------------------------------------------------------------
-- Privilèges
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;

-- Contenu : lecture publique (filtrée par RLS), écriture par les admins (RLS).
grant select on
  public.app_settings, public.media, public.lines, public.stamps, public.stops,
  public.stop_media, public.partners, public.offers,
  public.line_stamps, public.line_overview, public.stop_overview
to anon, authenticated;

grant insert, update, delete on
  public.media, public.lines, public.stamps, public.stops,
  public.stop_media, public.partners, public.offers
to authenticated;

grant update on public.app_settings to authenticated;

-- Profils : lecture de soi ; mise à jour limitée aux préférences (jamais le rôle).
grant select on public.profiles to authenticated;
grant update (first_name, lang, transport, experience, text_size) on public.profiles to authenticated;

-- Progression : l'utilisateur gère son parcours ; les récompenses sont en lecture seule.
grant select, insert, update, delete on public.line_progress to authenticated;
grant select on public.stop_completions, public.user_stamps, public.offer_unlocks to authenticated;

-- ---------------------------------------------------------------------------
-- RLS : contenu
-- ---------------------------------------------------------------------------

alter table public.app_settings enable row level security;
alter table public.media enable row level security;
alter table public.lines enable row level security;
alter table public.stamps enable row level security;
alter table public.stops enable row level security;
alter table public.stop_media enable row level security;
alter table public.partners enable row level security;
alter table public.offers enable row level security;

create policy "app_settings: lecture publique" on public.app_settings
  for select to anon, authenticated using (true);
create policy "app_settings: modification admin" on public.app_settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "lines: lecture des lignes visibles" on public.lines
  for select to anon, authenticated
  using (status in ('published', 'coming_soon') or (select public.is_admin()));
create policy "lines: écriture admin" on public.lines
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "stops: lecture des arrêts des lignes visibles" on public.stops
  for select to anon, authenticated
  using (public.is_line_visible(line_id) or (select public.is_admin()));
create policy "stops: écriture admin" on public.stops
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "stop_media: lecture des arrêts visibles" on public.stop_media
  for select to anon, authenticated
  using (public.is_stop_visible(stop_id) or (select public.is_admin()));
create policy "stop_media: écriture admin" on public.stop_media
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "media: lecture des médias publiés" on public.media
  for select to anon, authenticated
  using (public.is_media_public(id) or (select public.is_admin()));
create policy "media: écriture admin" on public.media
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "stamps: lecture des cachets visibles" on public.stamps
  for select to anon, authenticated
  using (line_id is null or public.is_line_visible(line_id) or (select public.is_admin()));
create policy "stamps: écriture admin" on public.stamps
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "partners: lecture publique" on public.partners
  for select to anon, authenticated using (true);
create policy "partners: écriture admin" on public.partners
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "offers: lecture des avantages actifs" on public.offers
  for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy "offers: écriture admin" on public.offers
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- RLS : données utilisateur (chacun ne voit que les siennes ; les admins lisent tout)
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.line_progress enable row level security;
alter table public.stop_completions enable row level security;
alter table public.user_stamps enable row level security;
alter table public.offer_unlocks enable row level security;

create policy "profiles: lecture de soi" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles: mise à jour de soi" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "line_progress: lecture" on public.line_progress
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "line_progress: création de soi" on public.line_progress
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "line_progress: mise à jour de soi" on public.line_progress
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "line_progress: suppression de soi" on public.line_progress
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "stop_completions: lecture" on public.stop_completions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "user_stamps: lecture" on public.user_stamps
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "offer_unlocks: lecture" on public.offer_unlocks
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
