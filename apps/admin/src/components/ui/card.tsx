import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const cardClass = 'rounded-[10px] bg-admin-surface shadow-[inset_0_0_0_1px_var(--color-admin-border)]';

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn(cardClass, className)} {...props} />;
}

/** En-tête de carte : titre 600 16 px, séparateur fort. */
export function CardHeader({ title, aside, className }: { title: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-admin-divider-strong px-[22px] py-[18px]',
        className,
      )}
    >
      <h2 className="m-0 text-[16px] font-semibold leading-[1.2]">{title}</h2>
      {aside}
    </div>
  );
}

/** Titre de section dans une carte (600 15 px). */
export function SectionTitle({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 className={cn('m-0 text-[15px] font-semibold leading-[1.2]', className)} {...props} />;
}

/** En-têtes de colonnes d'un tableau (libellés capitales olive). */
export const tableHeadClass =
  'grid items-center gap-3.5 border-b border-admin-divider-strong text-[12px] font-medium leading-none tracking-[0.07em] text-olive';

export const tableRowClass = 'grid items-center gap-3.5 border-b border-admin-divider';
