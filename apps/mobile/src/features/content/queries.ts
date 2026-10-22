import {
  appSettingsSchema,
  lineOverviewSchema,
  mediaSchema,
  stampSchema,
  stopMediaSchema,
  stopOverviewSchema,
  type LineOverview,
  type Media,
} from '@llds/shared';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { useAuth } from '@/features/auth/auth';
import { supabase } from '@/lib/supabase';

// Contenus publiés (lecture anonyme autorisée par la RLS) et progression de l'utilisateur connecté.

function unwrap<T>({ data, error }: { data: T; error: unknown }): NonNullable<T> {
  if (error) throw error;
  if (data == null) throw new Error('no_data');
  return data;
}

const parseAll = <T extends z.ZodType>(schema: T, rows: unknown) => z.array(schema).parse(rows);

export function useLines() {
  return useQuery({
    queryKey: ['lines'],
    queryFn: async () =>
      parseAll(lineOverviewSchema, unwrap(await supabase.from('line_overview').select('*').order('sort_order'))),
  });
}

export function useLine(lineId: string | undefined): LineOverview | undefined {
  const { data } = useLines();
  return data?.find((line) => line.id === lineId);
}

export function useLineStops(lineId: string | undefined) {
  return useQuery({
    queryKey: ['stops', lineId],
    enabled: Boolean(lineId),
    queryFn: async () =>
      parseAll(
        stopOverviewSchema,
        unwrap(await supabase.from('stop_overview').select('*').eq('line_id', lineId ?? '').order('position')),
      ),
  });
}

export function useStopMedia(stopIds: readonly string[]) {
  return useQuery({
    queryKey: ['stop-media', ...stopIds],
    enabled: stopIds.length > 0,
    queryFn: async () =>
      parseAll(stopMediaSchema, unwrap(await supabase.from('stop_media').select('*').in('stop_id', [...stopIds]))),
  });
}

/** Médias par identifiant (couvertures, cartes postales, cachets…). */
export function useMediaByIds(ids: readonly (string | null | undefined)[]) {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))].sort();
  return useQuery({
    queryKey: ['media', ...wanted],
    enabled: wanted.length > 0,
    queryFn: async () => {
      const rows = parseAll(mediaSchema, unwrap(await supabase.from('media').select('*').in('id', wanted)));
      return new Map(rows.map((media) => [media.id, media]));
    },
  });
}

/** Cachets d'une ligne (arrêts + règles propres à la ligne). */
export function useLineStamps(lineId: string | undefined) {
  return useQuery({
    queryKey: ['line-stamps', lineId],
    enabled: Boolean(lineId),
    queryFn: async () => {
      const links = unwrap(await supabase.from('line_stamps').select('stamp_id').eq('line_id', lineId ?? ''));
      const ids = links.map((link) => link.stamp_id).filter((id): id is string => Boolean(id));
      if (ids.length === 0) return [];
      return parseAll(stampSchema, unwrap(await supabase.from('stamps').select('*').in('id', ids).order('sort_order')));
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => appSettingsSchema.parse(unwrap(await supabase.from('app_settings').select('*').single())),
    staleTime: Infinity,
  });
}

const progressSchema = z.object({
  status: z.enum(['in_progress', 'completed']),
  direction: z.enum(['forward', 'backward']),
});

export interface LineProgressSummary {
  status: 'new' | 'in_progress' | 'completed';
  visitedStopIds: Set<string>;
  points: number;
  stampIds: Set<string>;
}

/** Progression de l'utilisateur connecté sur une ligne (les invités n'ont pas de progression conservée). */
export function useLineProgress(lineId: string | undefined) {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['progress', userId, lineId],
    enabled: Boolean(lineId && userId),
    queryFn: async (): Promise<LineProgressSummary> => {
      const [progress, completions, stamps] = await Promise.all([
        supabase.from('line_progress').select('status,direction').eq('line_id', lineId ?? '').maybeSingle(),
        supabase.from('stop_completions').select('stop_id,points_awarded,stops!inner(line_id)').eq('stops.line_id', lineId ?? ''),
        supabase.from('user_stamps').select('stamp_id'),
      ]);
      const parsed = progressSchema.safeParse(progress.data);
      const rows = completions.data ?? [];
      return {
        status: parsed.success ? parsed.data.status : 'new',
        visitedStopIds: new Set(rows.map((row) => row.stop_id)),
        points: rows.reduce((sum, row) => sum + row.points_awarded, 0),
        stampIds: new Set((stamps.data ?? []).map((row) => row.stamp_id)),
      };
    },
  });
}

/** URL d'affichage d'un média : publique, ou signée pour le bucket privé (médias publiés). */
export function useMediaUrl(media: Media | null | undefined): string | null {
  const isPrivate = media?.bucket === 'media';
  const signed = useQuery({
    queryKey: ['signed-url', media?.path],
    enabled: Boolean(media) && isPrivate,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('media').createSignedUrl(media?.path ?? '', 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  if (!media) return null;
  if (!isPrivate) return supabase.storage.from('media-public').getPublicUrl(media.path).data.publicUrl;
  return signed.data ?? null;
}
