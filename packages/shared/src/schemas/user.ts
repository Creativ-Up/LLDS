import { z } from 'zod';

import {
  experienceTypeSchema,
  langSchema,
  lineDirectionSchema,
  progressStatusSchema,
  textSizeSchema,
  transportModeSchema,
  userRoleSchema,
} from './enums';

export const profileSchema = z.object({
  id: z.uuid(),
  first_name: z.string().nullable(),
  lang: langSchema,
  transport: transportModeSchema.nullable(),
  experience: experienceTypeSchema.nullable(),
  text_size: textSizeSchema,
  role: userRoleSchema,
});
export type Profile = z.infer<typeof profileSchema>;

/** Préférences modifiables par l'utilisateur (le rôle ne l'est jamais). */
export const profilePreferencesSchema = profileSchema
  .pick({ first_name: true, lang: true, transport: true, experience: true, text_size: true })
  .partial();
export type ProfilePreferences = z.infer<typeof profilePreferencesSchema>;

export const lineProgressSchema = z.object({
  user_id: z.uuid(),
  line_id: z.uuid(),
  direction: lineDirectionSchema,
  status: progressStatusSchema,
  started_at: z.string(),
  completed_at: z.string().nullable(),
});
export type LineProgress = z.infer<typeof lineProgressSchema>;

export const stopCompletionSchema = z.object({
  user_id: z.uuid(),
  stop_id: z.uuid(),
  completed_at: z.string(),
  points_awarded: z.number().int().nonnegative(),
});
export type StopCompletion = z.infer<typeof stopCompletionSchema>;
