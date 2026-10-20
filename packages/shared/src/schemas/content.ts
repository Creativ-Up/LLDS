import { z } from 'zod';

import {
  langSchema,
  lineStatusSchema,
  mediaBucketSchema,
  stampRuleSchema,
  stopMediaKindSchema,
  stopServiceSchema,
} from './enums';

/** Texte traduit `{ fr, nl, en }` ; chaque langue est optionnelle (repli sur le français). */
export const i18nTextSchema = z
  .object({ fr: z.string(), nl: z.string(), en: z.string() })
  .partial()
  .strict();
export type I18nText = z.infer<typeof i18nTextSchema>;

export const lngLatSchema = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
export type LngLat = z.infer<typeof lngLatSchema>;

export const lineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(lngLatSchema).min(2),
});
export type LineStringGeometry = z.infer<typeof lineStringSchema>;

const timestamp = z.string();

export const mediaSchema = z.object({
  id: z.uuid(),
  bucket: mediaBucketSchema,
  path: z.string().min(1),
  mime: z.string(),
  size_bytes: z.number().int().nonnegative(),
  duration_s: z.number().nonnegative().nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/).nullable(),
  credit: z.string().nullable(),
  original_name: z.string().nullable(),
});
export type Media = z.infer<typeof mediaSchema>;

/** Vue `line_overview` : ligne + valeurs calculées (arrêts, points max, cachets, tracé GeoJSON). */
export const lineOverviewSchema = z.object({
  id: z.uuid(),
  code: z.string().min(1),
  name: i18nTextSchema,
  tagline: i18nTextSchema,
  cover_media_id: z.uuid().nullable(),
  status: lineStatusSchema,
  content_version: z.number().int().nonnegative(),
  published_at: timestamp.nullable(),
  sort_order: z.number().int(),
  length_m: z.number().nonnegative().nullable(),
  track_geojson: lineStringSchema.nullable(),
  stop_count: z.number().int().nonnegative(),
  points_max: z.number().int().nonnegative(),
  stamp_count: z.number().int().nonnegative(),
});
export type LineOverview = z.infer<typeof lineOverviewSchema>;

/** Vue `stop_overview` : arrêt avec coordonnées décomposées. */
export const stopOverviewSchema = z.object({
  id: z.uuid(),
  line_id: z.uuid(),
  position: z.number().int().positive(),
  name: i18nTextSchema,
  year: z.number().int().nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  geofence_radius_m: z.number().int().positive(),
  description: i18nTextSchema,
  services: z.array(stopServiceSchema),
  points: z.number().int().nonnegative(),
  requires_on_site: z.boolean(),
  archive_media_id: z.uuid().nullable(),
  present_media_id: z.uuid().nullable(),
  stamp_id: z.uuid().nullable(),
  guest_preview_s: z.number().int().positive(),
});
export type StopOverview = z.infer<typeof stopOverviewSchema>;

export const stopMediaSchema = z.object({
  stop_id: z.uuid(),
  lang: langSchema,
  kind: stopMediaKindSchema,
  media_id: z.uuid(),
});
export type StopMedia = z.infer<typeof stopMediaSchema>;

export const stampSchema = z.object({
  id: z.uuid(),
  name: i18nTextSchema,
  image_media_id: z.uuid().nullable(),
  rule: stampRuleSchema,
  line_id: z.uuid().nullable(),
  points_threshold: z.number().int().positive().nullable(),
  sort_order: z.number().int(),
});
export type Stamp = z.infer<typeof stampSchema>;

export const partnerSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  address: z.string().nullable(),
  city: z.string().nullable(),
  opening_hours: i18nTextSchema,
  photo_media_id: z.uuid().nullable(),
  logo_media_id: z.uuid().nullable(),
});
export type Partner = z.infer<typeof partnerSchema>;

const isoDate = z.iso.date();

export const offerSchema = z.object({
  id: z.uuid(),
  partner_id: z.uuid(),
  title: i18nTextSchema,
  description: i18nTextSchema,
  conditions: i18nTextSchema,
  required_stamp_id: z.uuid().nullable(),
  visible_from_stop_id: z.uuid().nullable(),
  valid_from: isoDate.nullable(),
  valid_until: isoDate.nullable(),
  active: z.boolean(),
});
export type Offer = z.infer<typeof offerSchema>;

export const appSettingsSchema = z.object({
  default_geofence_radius_m: z.number().int().positive(),
  walk_kmh: z.number().positive(),
  bike_kmh: z.number().positive(),
  car_kmh: z.number().positive(),
  default_guest_preview_s: z.number().int().positive(),
});
export type AppSettings = z.infer<typeof appSettingsSchema>;
