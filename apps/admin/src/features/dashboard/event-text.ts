import { i18nTextSchema, langSchema, pickText, pickTextFrom, stopMediaKindSchema } from '@llds/shared';
import { z } from 'zod';

import type { AdminEvent } from '@/lib/data';
import { formatDate, formatTime, isToday } from '@/lib/format';
import { ADMIN_LANG, t } from '@/lib/i18n';

const codePayload = z.object({ code: z.string() });
const versionPayload = z.object({ code: z.string(), version: z.number() });
const mediaPayload = z.object({
  stop_id: z.uuid().optional(),
  stop_name: i18nTextSchema.nullable(),
  lang: langSchema,
  kind: stopMediaKindSchema,
});
const namedPayload = z.object({ name: z.unknown() });
const offerPayload = z.object({ partner: z.string() });

/** Nom actuel d'un arrêt (le nom enregistré dans l'événement sert de repli). */
export type StopNameLookup = (stopId: string) => string | undefined;

/** Phrase du journal « Dernières modifications » ; null si l'événement est inconnu. */
export function eventText(event: AdminEvent, currentStopName: StopNameLookup): string | null {
  const { kind, payload } = event;
  switch (kind) {
    case 'line_created': {
      const parsed = codePayload.safeParse(payload);
      return parsed.success ? t('dashboard.activity.line_created', parsed.data) : null;
    }
    case 'line_published': {
      const parsed = versionPayload.safeParse(payload);
      return parsed.success ? t('dashboard.activity.line_published', parsed.data) : null;
    }
    case 'track_imported': {
      const parsed = codePayload.safeParse(payload);
      return parsed.success ? t('dashboard.activity.track_imported', parsed.data) : null;
    }
    case 'stop_media_added': {
      const parsed = mediaPayload.safeParse(payload);
      if (!parsed.success) return null;
      const current = parsed.data.stop_id ? currentStopName(parsed.data.stop_id) : undefined;
      const stop = current || (parsed.data.stop_name ? pickText(parsed.data.stop_name, ADMIN_LANG) : '');
      const values = { lang: parsed.data.lang.toUpperCase(), stop: stop || t('unnamedStop') };
      return t(`dashboard.activity.stop_media_added_${parsed.data.kind}`, values);
    }
    case 'stamp_created':
    case 'partner_created': {
      const parsed = namedPayload.safeParse(payload);
      if (!parsed.success) return null;
      const name = typeof parsed.data.name === 'string' ? parsed.data.name : pickTextFrom(parsed.data.name, ADMIN_LANG);
      return t(`dashboard.activity.${kind}`, { name });
    }
    case 'offer_activated': {
      const parsed = offerPayload.safeParse(payload);
      return parsed.success ? t('dashboard.activity.offer_activated', parsed.data) : null;
    }
    case 'settings_updated':
      return t('dashboard.activity.settings_updated');
    default:
      return null;
  }
}

export function eventWhen(iso: string): string {
  return isToday(iso) ? t('dashboard.activity.today', { time: formatTime(iso) }) : formatDate(iso);
}
