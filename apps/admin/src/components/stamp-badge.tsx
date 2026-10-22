'use client';

import { pickText, type Media, type Stamp } from '@llds/shared';

import { MediaThumb } from '@/components/media-thumb';
import { ADMIN_LANG } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const GENERIC_LABEL_LENGTH = 8;

/**
 * Cachet : image fournie (PNG transparent) ou cachet générique sépia
 * (cercle + cercle intérieur en pointillés, nom en capitales).
 */
export function StampBadge({ stamp, image, size }: { stamp: Stamp; image: Media | null | undefined; size: number }) {
  if (image) {
    return <MediaThumb media={image} fit="contain" className="flex-none" style={{ width: size, height: size }} />;
  }
  const inner = Math.round(size * 0.75);
  const label = pickText(stamp.name, ADMIN_LANG).toUpperCase().slice(0, GENERIC_LABEL_LENGTH);
  return (
    <div
      className="grid flex-none place-items-center rounded-full shadow-[inset_0_0_0_2.5px_var(--color-sepia)]"
      style={{ width: size, height: size }}
    >
      <div
        className={cn(
          'grid place-items-center rounded-full border-[1.6px] border-dashed border-sepia text-center font-semibold leading-[1.2] tracking-[0.08em] text-sepia',
          size < 60 ? 'text-[6px]' : 'text-[10px]',
        )}
        style={{ width: inner, height: inner }}
      >
        {size >= 40 ? label : null}
      </div>
    </div>
  );
}
