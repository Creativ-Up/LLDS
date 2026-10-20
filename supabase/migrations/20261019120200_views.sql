-- Vues de lecture : valeurs calculées, jamais stockées en dur.
-- `security_invoker` : les règles RLS des tables sous-jacentes s'appliquent à l'appelant.

-- Cachets d'une ligne : cachets attachés à ses arrêts + cachets propres à la ligne
-- (ligne terminée, seuil de points limité à la ligne).
create view public.line_stamps
with (security_invoker = true)
as
  select s.line_id, s.stamp_id
  from public.stops s
  where s.stamp_id is not null
  union
  select st.line_id, st.id as stamp_id
  from public.stamps st
  where st.line_id is not null;

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

create view public.stop_overview
with (security_invoker = true)
as
  select
    st.id,
    st.line_id,
    st.position,
    st.name,
    st.year,
    extensions.st_y(st.location::extensions.geometry) as lat,
    extensions.st_x(st.location::extensions.geometry) as lng,
    st.geofence_radius_m,
    st.description,
    st.services,
    st.points,
    st.requires_on_site,
    st.archive_media_id,
    st.present_media_id,
    st.stamp_id,
    st.guest_preview_s,
    st.created_at,
    st.updated_at
  from public.stops st;
