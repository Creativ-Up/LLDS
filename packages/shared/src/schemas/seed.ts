import { z } from 'zod';

import { lineStatusSchema, stampRuleSchema, stopServiceSchema } from './enums';
import { i18nTextSchema, lineStringSchema } from './content';

// Format de `seed/demo-seed.json` (données fictives de développement).

const assetPath = z.string().min(1);
const key = z.string().regex(/^[a-z0-9_-]+$/);

export const seedStopSchema = z.object({
  key,
  name: i18nTextSchema,
  year: z.number().int().nullable().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  services: z.array(stopServiceSchema),
  points: z.number().int().nonnegative(),
  archive: assetPath.nullable(),
  stamp: key.nullable(),
  description: i18nTextSchema,
});

export const seedLineSchema = z.object({
  code: z.string().min(1),
  name: i18nTextSchema,
  tagline: i18nTextSchema.optional(),
  cover: assetPath.nullable(),
  status: lineStatusSchema,
  track: lineStringSchema.nullable(),
  stops: z.array(seedStopSchema),
});

export const seedStampSchema = z.object({
  key,
  name: i18nTextSchema,
  image: assetPath.nullable(),
  rule: stampRuleSchema,
  line: z.string().optional(),
  points_threshold: z.number().int().positive().optional(),
});

export const seedPartnerSchema = z.object({
  key,
  name: z.string().min(1),
  address: z.string(),
  opening_hours: i18nTextSchema,
  photo: assetPath.nullable(),
  logo: assetPath.nullable(),
});

export const seedOfferSchema = z.object({
  partner: key,
  title: i18nTextSchema,
  description: i18nTextSchema,
  conditions: i18nTextSchema,
  required_stamp: key.nullable(),
  visible_from_stop: key.nullable(),
});

export const seedFileSchema = z.object({
  admin: z.object({
    email: z.email(),
    password: z.string().min(8),
    first_name: z.string(),
  }),
  app_settings: z.object({
    default_geofence_radius_m: z.number().int().positive(),
    walk_kmh: z.number().positive(),
    bike_kmh: z.number().positive(),
    car_kmh: z.number().positive(),
    default_guest_preview_s: z.number().int().positive(),
  }),
  stamps: z.array(seedStampSchema),
  partners: z.array(seedPartnerSchema),
  offers: z.array(seedOfferSchema),
  lines: z.array(seedLineSchema),
});

export type SeedFile = z.infer<typeof seedFileSchema>;
export type SeedLine = z.infer<typeof seedLineSchema>;
export type SeedStop = z.infer<typeof seedStopSchema>;
