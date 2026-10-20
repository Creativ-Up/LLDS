-- Storage : `media` (privé, URLs signées pour l'app) et `media-public` (couvertures, cachets, logos).
-- Formats acceptés : docs/ADMIN.md § Médiathèque.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'media', 'media', false, 524288000,
    array[
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4',
      'audio/mp4', 'audio/x-m4a', 'audio/mpeg',
      'text/vtt'
    ]
  ),
  (
    'media-public', 'media-public', true, 20971520,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

-- Objet Storage correspondant à un média utilisé par un contenu visible du public.
create function public.is_storage_object_public(p_bucket text, p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.media m
    where m.bucket::text = p_bucket
      and m.path = p_path
      and public.is_media_public(m.id)
  );
$$;

create policy "media: gestion admin" on storage.objects
  for all to authenticated
  using (bucket_id in ('media', 'media-public') and (select public.is_admin()))
  with check (bucket_id in ('media', 'media-public') and (select public.is_admin()));

-- Permet à l'app (anonyme ou connectée) de créer des URLs signées pour les médias publiés.
create policy "media: lecture des médias publiés" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'media' and public.is_storage_object_public(bucket_id, name));
