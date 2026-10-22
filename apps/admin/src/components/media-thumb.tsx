'use client';

import type { Media } from '@llds/shared';
import type { CSSProperties, ReactNode } from 'react';

import { useMediaUrl } from '@/lib/data';
import { cn } from '@/lib/utils';

interface MediaThumbProps {
  media: Media | null | undefined;
  className?: string;
  /** Rendu « archive » : niveaux de gris + sépia 0,22, comme les cartes postales de l'app. */
  archive?: boolean;
  /** contain pour les cachets et logos (PNG transparents). */
  fit?: 'cover' | 'contain';
  style?: CSSProperties;
  children?: ReactNode;
}

/** Image d'un média en arrière-plan (URL publique ou signée selon le bucket). */
export function MediaThumb({ media, className, archive, fit = 'cover', style, children }: MediaThumbProps) {
  const url = useMediaUrl(media);
  const background: CSSProperties = url ? { backgroundImage: `url("${url}")` } : {};
  return (
    <div
      className={cn(
        'bg-center bg-no-repeat',
        fit === 'cover' ? 'bg-cover' : 'bg-contain',
        archive && 'grayscale-100 sepia-[0.22]',
        className,
      )}
      style={{ ...style, ...background }}
    >
      {children}
    </div>
  );
}
