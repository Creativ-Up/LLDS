-- Back-office (jalon M1) : contrôle avant publication, édition des arrêts sur la carte,
-- journal des modifications, gestion des utilisateurs et usages des médias.
-- Toutes les opérations d'écriture vérifient le rôle admin (en plus de la RLS).

alter table public.lines add column track_source_name text;

-- ---------------------------------------------------------------------------
-- Contrôle avant publication (docs/ADMIN.md § Éditeur de ligne)
-- ---------------------------------------------------------------------------

-- Manques bloquants d'un arrêt : nom FR, carte postale, vidéo ou audio FR.
create function public.stop_missing_items(p_stop_id uuid)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select array_remove(array[
    case when coalesce(btrim(s.name ->> 'fr'), '') = '' then 'name_fr' end,
    case when s.archive_media_id is null then 'archive' end,
    case when not exists (
      select 1 from public.stop_media sm
      where sm.stop_id = s.id and sm.lang = 'fr' and sm.kind in ('video', 'audio')
    ) then 'narration_fr' end
  ], null)
  from public.stops s
  where s.id = p_stop_id;
$$;

-- Liste des points du contrôle : `blocking` empêche la publication ; les traductions manquantes
-- sont signalées sans bloquer (repli sur le français).
create function public.line_publication_issues(p_line_id uuid)
returns table (code text, blocking boolean, stop_id uuid, missing text[])
language sql
stable
security definer
set search_path = ''
as $$
  select 'no_track', true, null::uuid, '{}'::text[]
  from public.lines l
  where l.id = p_line_id and l.track is null
  union all
  select 'no_stops', true, null::uuid, '{}'::text[]
  where not exists (select 1 from public.stops s where s.line_id = p_line_id)
  union all
  select 'stop_incomplete', true, s.id, public.stop_missing_items(s.id)
  from public.stops s
  where s.line_id = p_line_id and cardinality(public.stop_missing_items(s.id)) > 0
  union all
  select 'translations_partial', false, s.id, array_remove(array[
    case when coalesce(btrim(s.name ->> 'nl'), '') = '' then 'name_nl' end,
    case when coalesce(btrim(s.name ->> 'en'), '') = '' then 'name_en' end
  ], null)
  from public.stops s
  where s.line_id = p_line_id
    and (coalesce(btrim(s.name ->> 'nl'), '') = '' or coalesce(btrim(s.name ->> 'en'), '') = '');
$$;

-- Arrêts incomplets de toutes les lignes (tableau de bord : « Contenus à compléter »).
create function public.admin_incomplete_stops()
returns table (line_id uuid, line_code text, stop_id uuid, stop_position integer, stop_name jsonb, missing text[])
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.code, s.id, s.position, s.name, public.stop_missing_items(s.id)
  from public.stops s
  join public.lines l on l.id = s.line_id
  where public.is_admin() and cardinality(public.stop_missing_items(s.id)) > 0
  order by l.sort_order, s.position;
$$;

create function public.line_is_publishable(p_line_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.line_publication_issues(p_line_id) i where i.blocking);
$$;

-- Le trigger existant calcule la longueur et incrémente la version ; il refuse désormais
-- toute publication tant qu'un point bloquant subsiste.
create or replace function public.lines_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.length_m := case when new.track is null then null else extensions.st_length(new.track) end;

  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if tg_op = 'INSERT' or new.track is null or not public.line_is_publishable(new.id) then
      raise exception 'line_not_publishable'
        using errcode = 'P0001', hint = 'Complétez le tracé et les arrêts avant de publier.';
    end if;
    new.content_version := (case when tg_op = 'INSERT' then new.content_version else old.content_version end) + 1;
    new.published_at := now();
  end if;

  return new;
end;
$$;

create function public.assert_admin()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;

-- Publie (ou republie) une ligne : nouvelle version de contenu pour l'app.
create function public.publish_line(p_line_id uuid)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_status public.line_status;
  v_version integer;
begin
  perform public.assert_admin();
  select status into v_status from public.lines where id = p_line_id for update;
  if not found then
    raise exception 'line_not_found' using errcode = 'P0002';
  end if;

  if v_status = 'published' then
    if not public.line_is_publishable(p_line_id) then
      raise exception 'line_not_publishable' using errcode = 'P0001';
    end if;
    update public.lines
      set content_version = content_version + 1, published_at = now()
      where id = p_line_id
      returning content_version into v_version;
  else
    update public.lines set status = 'published' where id = p_line_id returning content_version into v_version;
  end if;

  return v_version;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tracé et arrêts sur la carte
-- ---------------------------------------------------------------------------

-- Importe un tracé GeoJSON (LineString, éventuellement 3D) et mémorise le nom du fichier source.
create function public.set_line_track(p_line_id uuid, p_geojson jsonb, p_source_name text)
returns double precision
language plpgsql
set search_path = ''
as $$
declare
  v_geom extensions.geometry;
  v_length double precision;
begin
  perform public.assert_admin();
  if p_geojson ->> 'type' <> 'LineString' then
    raise exception 'track_invalid' using errcode = '22023';
  end if;
  v_geom := extensions.st_setsrid(extensions.st_force2d(extensions.st_geomfromgeojson(p_geojson::text)), 4326);
  if extensions.st_npoints(v_geom) < 2 then
    raise exception 'track_invalid' using errcode = '22023';
  end if;

  update public.lines
    set track = v_geom::extensions.geography, track_source_name = nullif(btrim(p_source_name), '')
    where id = p_line_id
    returning length_m into v_length;
  if not found then
    raise exception 'line_not_found' using errcode = 'P0002';
  end if;
  return v_length;
end;
$$;

-- Point aimanté au tracé de la ligne (inchangé si la ligne n'a pas de tracé) et sa fraction le long du tracé.
create function public.snap_to_track(p_line_id uuid, p_lng double precision, p_lat double precision)
returns table (lng double precision, lat double precision, fraction double precision)
language sql
stable
security definer
set search_path = ''
as $$
  with input as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326) as pt,
           (select l.track::extensions.geometry from public.lines l where l.id = p_line_id) as track
  ),
  snapped as (
    select case when track is null then pt
                else extensions.st_lineinterpolatepoint(track, extensions.st_linelocatepoint(track, pt)) end as pt,
           case when track is null then null else extensions.st_linelocatepoint(track, pt) end as fraction
    from input
  )
  select extensions.st_x(pt), extensions.st_y(pt), fraction from snapped;
$$;

-- Ajoute un arrêt au point cliqué, aimanté au tracé et inséré dans l'ordre le long de la ligne.
create function public.add_stop(p_line_id uuid, p_lng double precision, p_lat double precision)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_snap record;
  v_position integer;
  v_id uuid;
begin
  perform public.assert_admin();
  if not exists (select 1 from public.lines where id = p_line_id) then
    raise exception 'line_not_found' using errcode = 'P0002';
  end if;

  select * into v_snap from public.snap_to_track(p_line_id, p_lng, p_lat);

  if v_snap.fraction is null then
    select coalesce(max(position), 0) + 1 into v_position from public.stops where line_id = p_line_id;
  else
    select count(*)::integer + 1 into v_position
    from public.stops s
    cross join lateral (select l.track::extensions.geometry as g from public.lines l where l.id = p_line_id) t
    where s.line_id = p_line_id
      and extensions.st_linelocatepoint(t.g, s.location::extensions.geometry) <= v_snap.fraction;
  end if;

  update public.stops set position = position + 1 where line_id = p_line_id and position >= v_position;
  insert into public.stops (line_id, position, location)
    values (p_line_id, v_position, extensions.st_setsrid(extensions.st_makepoint(v_snap.lng, v_snap.lat), 4326)::extensions.geography)
    returning id into v_id;
  return v_id;
end;
$$;

-- Déplace un arrêt (marqueur glissé) ; la position est aimantée au tracé.
create function public.move_stop(p_stop_id uuid, p_lng double precision, p_lat double precision)
returns table (lng double precision, lat double precision)
language plpgsql
set search_path = ''
as $$
declare
  v_line uuid;
  v_snap record;
begin
  perform public.assert_admin();
  select line_id into v_line from public.stops where id = p_stop_id;
  if not found then
    raise exception 'stop_not_found' using errcode = 'P0002';
  end if;
  select * into v_snap from public.snap_to_track(v_line, p_lng, p_lat);
  update public.stops
    set location = extensions.st_setsrid(extensions.st_makepoint(v_snap.lng, v_snap.lat), 4326)::extensions.geography
    where id = p_stop_id;
  return query select v_snap.lng, v_snap.lat;
end;
$$;

-- Nouvel ordre des arrêts d'une ligne (liste complète des identifiants).
create function public.reorder_stops(p_line_id uuid, p_stop_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform public.assert_admin();
  if (select count(*) from public.stops where line_id = p_line_id) <> cardinality(p_stop_ids)
     or exists (
       select 1 from unnest(p_stop_ids) as i(id)
       where not exists (select 1 from public.stops s where s.id = i.id and s.line_id = p_line_id)
     ) then
    raise exception 'stops_mismatch' using errcode = '22023';
  end if;
  update public.stops s
    set position = o.ord
    from unnest(p_stop_ids) with ordinality as o(id, ord)
    where s.id = o.id;
end;
$$;

-- Supprime un arrêt et renumérote les suivants.
create function public.delete_stop(p_stop_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_line uuid;
begin
  perform public.assert_admin();
  delete from public.stops where id = p_stop_id returning line_id into v_line;
  if v_line is null then
    raise exception 'stop_not_found' using errcode = 'P0002';
  end if;
  update public.stops s
    set position = r.rn
    from (select id, row_number() over (order by position) as rn from public.stops where line_id = v_line) r
    where s.id = r.id and s.position <> r.rn;
end;
$$;

-- Ordre des lignes dans l'app (écran « Votre ligne ? »).
create function public.reorder_lines(p_line_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform public.assert_admin();
  update public.lines l
    set sort_order = o.ord
    from unnest(p_line_ids) with ordinality as o(id, ord)
    where l.id = o.id;
end;
$$;

-- Les vues sont recréées pour exposer le nom du fichier de tracé.
drop view public.line_overview;
create view public.line_overview
with (security_invoker = true)
as
  select
    l.id,
    l.code,
    l.name,
    l.tagline,
    l.cover_media_id,
    l.status,
    l.content_version,
    l.published_at,
    l.sort_order,
    l.length_m,
    extensions.st_asgeojson(l.track)::jsonb as track_geojson,
    l.track_source_name,
    coalesce(s.stop_count, 0)::integer as stop_count,
    coalesce(s.points_max, 0)::integer as points_max,
    coalesce(k.stamp_count, 0)::integer as stamp_count,
    l.created_at,
    l.updated_at
  from public.lines l
  left join lateral (
    select count(*) as stop_count, sum(points) as points_max
    from public.stops
    where line_id = l.id
  ) s on true
  left join lateral (
    select count(*) as stamp_count
    from public.line_stamps
    where line_id = l.id
  ) k on true;

-- ---------------------------------------------------------------------------
-- Usages des médias (médiathèque : « Utilisé dans »)
-- ---------------------------------------------------------------------------

create view public.media_usages
with (security_invoker = true)
as
  select l.cover_media_id as media_id, 'line_cover'::text as usage, l.id as line_id, l.code as line_code,
         null::uuid as stop_id, null::jsonb as stop_name, null::public.lang_code as lang,
         null::public.stop_media_kind as kind, null::uuid as stamp_id, null::jsonb as stamp_name,
         null::uuid as partner_id, null::text as partner_name
  from public.lines l where l.cover_media_id is not null
  union all
  select s.archive_media_id, 'stop_archive', l.id, l.code, s.id, s.name, null, null, null, null, null, null
  from public.stops s join public.lines l on l.id = s.line_id where s.archive_media_id is not null
  union all
  select s.present_media_id, 'stop_present', l.id, l.code, s.id, s.name, null, null, null, null, null, null
  from public.stops s join public.lines l on l.id = s.line_id where s.present_media_id is not null
  union all
  select sm.media_id, 'stop_narration', l.id, l.code, s.id, s.name, sm.lang, sm.kind, null, null, null, null
  from public.stop_media sm join public.stops s on s.id = sm.stop_id join public.lines l on l.id = s.line_id
  union all
  select st.image_media_id, 'stamp_image', null, null, null, null, null, null, st.id, st.name, null, null
  from public.stamps st where st.image_media_id is not null
  union all
  select p.photo_media_id, 'partner_photo', null, null, null, null, null, null, null, null, p.id, p.name
  from public.partners p where p.photo_media_id is not null
  union all
  select p.logo_media_id, 'partner_logo', null, null, null, null, null, null, null, null, p.id, p.name
  from public.partners p where p.logo_media_id is not null;

-- ---------------------------------------------------------------------------
-- Journal des modifications (tableau de bord : « Dernières modifications »)
-- ---------------------------------------------------------------------------

create table public.admin_events (
  id bigint generated always as identity primary key,
  kind text not null,
  payload jsonb not null default '{}',
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index admin_events_created_idx on public.admin_events (created_at desc);

create function public.log_admin_event(p_kind text, p_payload jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_events (kind, payload, actor_id) values (p_kind, p_payload, auth.uid());
$$;

create function public.lines_log_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_admin_event('line_created', jsonb_build_object('code', new.code));
  elsif new.status = 'published' and new.content_version is distinct from old.content_version then
    perform public.log_admin_event('line_published', jsonb_build_object('code', new.code, 'version', new.content_version));
  elsif new.track is distinct from old.track and new.track is not null then
    perform public.log_admin_event('track_imported', jsonb_build_object('code', new.code));
  end if;
  return null;
end;
$$;

create trigger lines_log_events after insert or update on public.lines
  for each row execute function public.lines_log_events();

create function public.stop_media_log_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.log_admin_event('stop_media_added', jsonb_build_object(
    'stop_id', new.stop_id,
    'stop_name', (select s.name from public.stops s where s.id = new.stop_id),
    'lang', new.lang,
    'kind', new.kind
  ));
  return null;
end;
$$;

create trigger stop_media_log_events after insert or update of media_id on public.stop_media
  for each row execute function public.stop_media_log_events();

create function public.stamps_log_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.log_admin_event('stamp_created', jsonb_build_object('name', new.name));
  return null;
end;
$$;

create trigger stamps_log_events after insert on public.stamps
  for each row execute function public.stamps_log_events();

create function public.partners_log_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.log_admin_event('partner_created', jsonb_build_object('name', new.name));
  return null;
end;
$$;

create trigger partners_log_events after insert on public.partners
  for each row execute function public.partners_log_events();

create function public.offers_log_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.active and (tg_op = 'INSERT' or not old.active) then
    perform public.log_admin_event('offer_activated', jsonb_build_object(
      'partner', (select p.name from public.partners p where p.id = new.partner_id),
      'title', new.title
    ));
  end if;
  return null;
end;
$$;

create trigger offers_log_events after insert or update of active on public.offers
  for each row execute function public.offers_log_events();

create function public.app_settings_log_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.log_admin_event('settings_updated', '{}'::jsonb);
  return null;
end;
$$;

create trigger app_settings_log_events after update on public.app_settings
  for each row execute function public.app_settings_log_events();

-- ---------------------------------------------------------------------------
-- Utilisateurs (lecture seule + suppression RGPD)
-- ---------------------------------------------------------------------------

-- Comptes visiteurs (rôle user) avec leur progression ; l'e-mail vient de auth.users.
create function public.admin_list_users()
returns table (
  id uuid,
  first_name text,
  email text,
  created_at timestamptz,
  lines jsonb,
  points bigint,
  stamps bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return query
  select
    u.id,
    p.first_name,
    u.email::text,
    u.created_at,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', l.code,
        'status', lp.status,
        'done', (select count(*) from public.stop_completions sc join public.stops s on s.id = sc.stop_id
                 where sc.user_id = u.id and s.line_id = l.id),
        'total', (select count(*) from public.stops s where s.line_id = l.id)
      ) order by lp.started_at)
      from public.line_progress lp join public.lines l on l.id = lp.line_id
      where lp.user_id = u.id
    ), '[]'::jsonb),
    coalesce((select sum(sc.points_awarded) from public.stop_completions sc where sc.user_id = u.id), 0)::bigint,
    (select count(*) from public.user_stamps us where us.user_id = u.id)
  from auth.users u
  join public.profiles p on p.id = u.id
  where p.role = 'user'
  order by u.created_at desc;
end;
$$;

-- Suppression définitive d'un compte visiteur (progression, points et cachets en cascade).
create function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  if not exists (select 1 from public.profiles where id = p_user_id and role = 'user') then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
  delete from auth.users where id = p_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Droits
-- ---------------------------------------------------------------------------

alter table public.admin_events enable row level security;
revoke all on public.admin_events from anon, authenticated;
grant select on public.admin_events to authenticated;
grant all on public.admin_events to service_role;
create policy "admin_events: lecture admin" on public.admin_events
  for select to authenticated using ((select public.is_admin()));

revoke all on public.line_overview, public.media_usages from anon, authenticated;
grant select on public.line_overview to anon, authenticated;
grant select on public.media_usages to authenticated;
grant all on public.line_overview, public.media_usages to service_role;

-- Les fonctions d'administration ne sont pas exposées aux visiteurs anonymes.
revoke execute on function
  public.publish_line(uuid), public.set_line_track(uuid, jsonb, text), public.add_stop(uuid, double precision, double precision),
  public.move_stop(uuid, double precision, double precision), public.reorder_stops(uuid, uuid[]),
  public.delete_stop(uuid), public.reorder_lines(uuid[]), public.admin_list_users(), public.admin_delete_user(uuid),
  public.line_publication_issues(uuid), public.admin_incomplete_stops(), public.log_admin_event(text, jsonb)
from public, anon;
grant execute on function
  public.publish_line(uuid), public.set_line_track(uuid, jsonb, text), public.add_stop(uuid, double precision, double precision),
  public.move_stop(uuid, double precision, double precision), public.reorder_stops(uuid, uuid[]),
  public.delete_stop(uuid), public.reorder_lines(uuid[]), public.admin_list_users(), public.admin_delete_user(uuid),
  public.line_publication_issues(uuid), public.admin_incomplete_stops()
to authenticated;
