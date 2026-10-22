'use client';

import type { Media, MediaBucket } from '@llds/shared';
import { useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { queryKeys, useInvalidate } from '@/lib/data';
import { t } from '@/lib/i18n';
import { acceptedFormat, uploadMedia, VIDEO_WARNING_BYTES } from '@/lib/upload';

export interface UploadProgress {
  name: string;
  pct: number;
}

/** Téléversement avec progression, avertissement > 200 Mo et messages d'erreur. */
export function useUpload() {
  const notify = useToast();
  const invalidate = useInvalidate();
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  async function upload(file: File, bucket: MediaBucket, credit?: string | null): Promise<Media | null> {
    const format = acceptedFormat(file);
    if (!format) {
      notify(t('media.unsupported', { name: file.name }));
      return null;
    }
    if (format.family === 'video' && file.size > VIDEO_WARNING_BYTES) notify(t('media.tooLarge', { name: file.name }));
    setProgress({ name: file.name, pct: 0 });
    try {
      const media = await uploadMedia({
        file,
        bucket,
        credit,
        onProgress: (pct) => setProgress({ name: file.name, pct }),
      });
      await invalidate(queryKeys.media, queryKeys.mediaUsages);
      return media;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      notify(t('media.uploadFailed', { name: file.name, message }));
      return null;
    } finally {
      setProgress(null);
    }
  }

  return { upload, progress };
}
