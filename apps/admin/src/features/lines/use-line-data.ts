'use client';

import type { Lang, LineOverview, Media, StopMediaKind, StopOverview } from '@llds/shared';
import { useMemo } from 'react';

import {
  useLineIssues,
  useLines,
  useMedia,
  useOffers,
  useStamps,
  useStopMedia,
  useStops,
  type MissingItem,
  type PublicationIssue,
} from '@/lib/data';

/** Médias de narration d'un arrêt : langue → type → média. */
export type NarrationMap = Partial<Record<Lang, Partial<Record<StopMediaKind, Media>>>>;

export interface LineData {
  line: LineOverview | undefined;
  loading: boolean;
  /** Arrêts de la ligne, dans l'ordre (position). */
  stops: StopOverview[];
  narration: Map<string, NarrationMap>;
  mediaById: Map<string, Media>;
  issues: PublicationIssue[];
  missingByStop: Map<string, MissingItem[]>;
}

/** Données de l'éditeur de ligne, dérivées des requêtes partagées. */
export function useLineData(lineId: string): LineData {
  const lines = useLines();
  const stopsQuery = useStops();
  const stopMedia = useStopMedia();
  const media = useMedia();
  const issuesQuery = useLineIssues(lineId);
  useStamps();
  useOffers();

  return useMemo(() => {
    const mediaById = media.data?.byId ?? new Map<string, Media>();
    const stops = (stopsQuery.data ?? []).filter((stop) => stop.line_id === lineId);
    const stopIds = new Set(stops.map((stop) => stop.id));
    const narration = new Map<string, NarrationMap>();
    for (const row of stopMedia.data ?? []) {
      if (!stopIds.has(row.stop_id)) continue;
      const file = mediaById.get(row.media_id);
      if (!file) continue;
      const entry = narration.get(row.stop_id) ?? {};
      entry[row.lang] = { ...entry[row.lang], [row.kind]: file };
      narration.set(row.stop_id, entry);
    }
    const issues = issuesQuery.data ?? [];
    const missingByStop = new Map<string, MissingItem[]>();
    for (const issue of issues) {
      if (issue.code === 'stop_incomplete' && issue.stop_id) missingByStop.set(issue.stop_id, issue.missing);
    }
    return {
      line: lines.data?.find((line) => line.id === lineId),
      loading: lines.isPending || stopsQuery.isPending,
      stops,
      narration,
      mediaById,
      issues,
      missingByStop,
    };
  }, [lineId, lines.data, lines.isPending, stopsQuery.data, stopsQuery.isPending, stopMedia.data, media.data, issuesQuery.data]);
}
