import { z } from 'zod';

// Miroir des types énumérés Postgres (supabase/migrations). La cohérence avec les types
// générés est vérifiée à la compilation dans `../database-check.ts`.

export const LANGS = ['fr', 'nl', 'en'] as const;
export const DEFAULT_LANG = 'fr' satisfies Lang;

export const LINE_STATUSES = ['draft', 'published', 'coming_soon'] as const;

/** Toujours affichés dans cet ordre sur la fiche du point d'intérêt. */
export const STOP_SERVICES = ['cafe', 'parking', 'info', 'restaurant', 'gare', 'patrimoine', 'remise'] as const;

export const STOP_MEDIA_KINDS = ['video', 'audio', 'subtitles'] as const;
export const STAMP_RULES = ['stop_completed', 'line_completed', 'points_threshold'] as const;
export const MEDIA_BUCKETS = ['media', 'media-public'] as const;

export const USER_ROLES = ['user', 'admin'] as const;
export const TRANSPORT_MODES = ['pied', 'velo', 'voiture'] as const;
export const EXPERIENCE_TYPES = ['complete', 'audio'] as const;
export const TEXT_SIZES = ['normal', 'large', 'xlarge'] as const;
export const LINE_DIRECTIONS = ['forward', 'backward'] as const;
export const PROGRESS_STATUSES = ['in_progress', 'completed'] as const;

export const langSchema = z.enum(LANGS);
export const lineStatusSchema = z.enum(LINE_STATUSES);
export const stopServiceSchema = z.enum(STOP_SERVICES);
export const stopMediaKindSchema = z.enum(STOP_MEDIA_KINDS);
export const stampRuleSchema = z.enum(STAMP_RULES);
export const mediaBucketSchema = z.enum(MEDIA_BUCKETS);
export const userRoleSchema = z.enum(USER_ROLES);
export const transportModeSchema = z.enum(TRANSPORT_MODES);
export const experienceTypeSchema = z.enum(EXPERIENCE_TYPES);
export const textSizeSchema = z.enum(TEXT_SIZES);
export const lineDirectionSchema = z.enum(LINE_DIRECTIONS);
export const progressStatusSchema = z.enum(PROGRESS_STATUSES);

export type Lang = z.infer<typeof langSchema>;
export type LineStatus = z.infer<typeof lineStatusSchema>;
export type StopService = z.infer<typeof stopServiceSchema>;
export type StopMediaKind = z.infer<typeof stopMediaKindSchema>;
export type StampRule = z.infer<typeof stampRuleSchema>;
export type MediaBucket = z.infer<typeof mediaBucketSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type TransportMode = z.infer<typeof transportModeSchema>;
export type ExperienceType = z.infer<typeof experienceTypeSchema>;
export type TextSize = z.infer<typeof textSizeSchema>;
export type LineDirection = z.infer<typeof lineDirectionSchema>;
export type ProgressStatus = z.infer<typeof progressStatusSchema>;
