'use client';

import {
  appSettingsSchema,
  i18nTextSchema,
  langSchema,
  lineOverviewSchema,
  mediaSchema,
  offerSchema,
  partnerSchema,
  progressStatusSchema,
  stampSchema,
  stopMediaKindSchema,
  stopMediaSchema,
  stopOverviewSchema,
  type Media,
} from '@llds/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { unwrap } from '@/lib/errors';
import { getSupabase } from '@/lib/supabase/client';

// Jeu de données d'un PoC : chaque table est chargée entièrement une fois, puis filtrée en mémoire.

export const queryKeys = {
  lines: ['lines'],
  stops: ['stops'],
  stopMedia: ['stop-media'],
  media: ['media'],
  mediaUsages: ['media-usages'],
  stamps: ['stamps'],
  partners: ['partners'],
  offers: ['offers'],
  settings: ['settings'],
  users: ['users'],
  incompleteStops: ['incomplete-stops'],
  events: ['events'],
  me: ['me'],
  issues: (lineId: string) => ['issues', lineId],
  signedUrl: (path: string) => ['signed-url', path],
} as const;

/** Tout ce qui dépend du contenu d'une ligne (à invalider après une modification). */
export const contentKeys = [
  queryKeys.lines,
  queryKeys.stops,
  queryKeys.stopMedia,
  queryKeys.incompleteStops,
  queryKeys.mediaUsages,
  queryKeys.events,
  ['issues'],
] as const;

export function useInvalidate() {
  const client = useQueryClient();
  return (...keys: readonly (readonly unknown[])[]) =>
    Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
}

const parseAll = <T extends z.ZodType>(schema: T, rows: unknown) => z.array(schema).parse(rows);

export function useLines() {
  return useQuery({
    queryKey: queryKeys.lines,
    queryFn: async () =>
      parseAll(lineOverviewSchema, unwrap(await getSupabase().from('line_overview').select('*').order('sort_order'))),
  });
}

export function useStops() {
  return useQuery({
    queryKey: queryKeys.stops,
    queryFn: async () =>
      parseAll(stopOverviewSchema, unwrap(await getSupabase().from('stop_overview').select('*').order('position'))),
  });
}

export function useStopMedia() {
  return useQuery({
    queryKey: queryKeys.stopMedia,
    queryFn: async () => parseAll(stopMediaSchema, unwrap(await getSupabase().from('stop_media').select('*'))),
  });
}

export function useMedia() {
  return useQuery({
    queryKey: queryKeys.media,
    queryFn: async () =>
      parseAll(mediaSchema, unwrap(await getSupabase().from('media').select('*').order('created_at', { ascending: false }))),
    select: (rows) => ({ list: rows, byId: new Map(rows.map((media) => [media.id, media])) }),
  });
}

const mediaUsageSchema = z.object({
  media_id: z.uuid(),
  usage: z.enum(['line_cover', 'stop_archive', 'stop_present', 'stop_narration', 'stamp_image', 'partner_photo', 'partner_logo']),
  line_id: z.uuid().nullable(),
  line_code: z.string().nullable(),
  stop_id: z.uuid().nullable(),
  stop_name: i18nTextSchema.nullable(),
  lang: langSchema.nullable(),
  kind: stopMediaKindSchema.nullable(),
  stamp_id: z.uuid().nullable(),
  stamp_name: i18nTextSchema.nullable(),
  partner_id: z.uuid().nullable(),
  partner_name: z.string().nullable(),
});
export type MediaUsage = z.infer<typeof mediaUsageSchema>;

export function useMediaUsages() {
  return useQuery({
    queryKey: queryKeys.mediaUsages,
    queryFn: async () => parseAll(mediaUsageSchema, unwrap(await getSupabase().from('media_usages').select('*'))),
  });
}

export function useStamps() {
  return useQuery({
    queryKey: queryKeys.stamps,
    queryFn: async () =>
      parseAll(stampSchema, unwrap(await getSupabase().from('stamps').select('*').order('sort_order').order('created_at'))),
  });
}

export function usePartners() {
  return useQuery({
    queryKey: queryKeys.partners,
    queryFn: async () => parseAll(partnerSchema, unwrap(await getSupabase().from('partners').select('*').order('name'))),
  });
}

export function useOffers() {
  return useQuery({
    queryKey: queryKeys.offers,
    queryFn: async () =>
      parseAll(offerSchema, unwrap(await getSupabase().from('offers').select('*').order('created_at'))),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => appSettingsSchema.parse(unwrap(await getSupabase().from('app_settings').select('*').single())),
  });
}

const userRowSchema = z.object({
  id: z.uuid(),
  first_name: z.string().nullable(),
  email: z.string(),
  created_at: z.string(),
  lines: z.array(
    z.object({ code: z.string(), status: progressStatusSchema, done: z.number(), total: z.number() }),
  ),
  points: z.number(),
  stamps: z.number(),
});
export type AdminUser = z.infer<typeof userRowSchema>;

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => parseAll(userRowSchema, unwrap(await getSupabase().rpc('admin_list_users'))),
  });
}

const missingItemSchema = z.enum(['name_fr', 'archive', 'narration_fr', 'name_nl', 'name_en']);
export type MissingItem = z.infer<typeof missingItemSchema>;

const incompleteStopSchema = z.object({
  line_id: z.uuid(),
  line_code: z.string(),
  stop_id: z.uuid(),
  stop_position: z.number(),
  stop_name: i18nTextSchema,
  missing: z.array(missingItemSchema),
});

export function useIncompleteStops() {
  return useQuery({
    queryKey: queryKeys.incompleteStops,
    queryFn: async () => parseAll(incompleteStopSchema, unwrap(await getSupabase().rpc('admin_incomplete_stops'))),
  });
}

const issueSchema = z.object({
  code: z.enum(['no_track', 'no_stops', 'stop_incomplete', 'translations_partial']),
  blocking: z.boolean(),
  stop_id: z.uuid().nullable(),
  missing: z.array(missingItemSchema),
});
export type PublicationIssue = z.infer<typeof issueSchema>;

/** Contrôle avant publication, calculé par la base (source unique des règles). */
export function useLineIssues(lineId: string) {
  return useQuery({
    queryKey: queryKeys.issues(lineId),
    queryFn: async () =>
      parseAll(issueSchema, unwrap(await getSupabase().rpc('line_publication_issues', { p_line_id: lineId }))),
  });
}

const eventSchema = z.object({
  id: z.number(),
  kind: z.string(),
  payload: z.record(z.string(), z.unknown()),
  created_at: z.string(),
});
export type AdminEvent = z.infer<typeof eventSchema>;

export function useEvents(limit: number) {
  return useQuery({
    queryKey: [...queryKeys.events, limit],
    queryFn: async () =>
      parseAll(
        eventSchema,
        unwrap(await getSupabase().from('admin_events').select('*').order('id', { ascending: false }).limit(limit)),
      ),
  });
}

/** Admin connecté : prénom (profil) et e-mail (session). */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;
      const profile = unwrap(await supabase.from('profiles').select('first_name').eq('id', user.id).single());
      return { id: user.id, email: user.email ?? '', firstName: profile.first_name ?? '' };
    },
    staleTime: Infinity,
  });
}

const SIGNED_URL_TTL_S = 3600;

/** URL d'affichage d'un média : publique (bucket media-public) ou signée (bucket media). */
export function useMediaUrl(media: Media | null | undefined): string | null {
  const isPrivate = media?.bucket === 'media';
  const signed = useQuery({
    queryKey: queryKeys.signedUrl(media?.path ?? ''),
    enabled: Boolean(media) && isPrivate,
    staleTime: (SIGNED_URL_TTL_S - 300) * 1000,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .storage.from('media')
        .createSignedUrl(media?.path ?? '', SIGNED_URL_TTL_S);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  if (!media) return null;
  if (!isPrivate) return getSupabase().storage.from('media-public').getPublicUrl(media.path).data.publicUrl;
  return signed.data ?? null;
}
