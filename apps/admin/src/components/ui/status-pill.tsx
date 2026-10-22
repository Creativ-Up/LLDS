import type { LineStatus } from '@llds/shared';

import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<LineStatus, string> = {
  published: 'bg-olive text-cream',
  draft: 'bg-tilleul-light text-olive-text',
  coming_soon: 'bg-cream text-olive shadow-[inset_0_0_0_1.5px_var(--color-olive)]',
};

/** Pastille de statut : Publiée, Brouillon, Bientôt disponible. */
export function StatusPill({ status, className }: { status: LineStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-[26px] whitespace-nowrap rounded-full px-[11px] text-[12px] font-medium leading-[26px]',
        STATUS_CLASSES[status],
        className,
      )}
    >
      {t(`common:lineStatus.${status}`)}
    </span>
  );
}
