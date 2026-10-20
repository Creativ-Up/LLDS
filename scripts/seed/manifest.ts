import { mediaBucketSchema } from '@llds/shared';
import { z } from 'zod';

/** Fichiers du seed à téléverser dans Storage (écrit par build-seed, lu par upload-seed). */
export const mediaManifestSchema = z.object({
  files: z.array(
    z.object({
      bucket: mediaBucketSchema,
      path: z.string().min(1),
      /** Relatif à la racine du dépôt. */
      file: z.string().min(1),
      mime: z.string().min(1),
    }),
  ),
});

export type MediaManifest = z.infer<typeof mediaManifestSchema>;
