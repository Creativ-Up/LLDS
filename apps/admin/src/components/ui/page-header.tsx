import type { ReactNode } from 'react';

/** Titre de page (600 28 px, −0,02 em) + sous-titre, actions à droite. */
export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="m-0 text-[14px] leading-[1.4] text-grey">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2.5">{actions}</div>}
    </div>
  );
}
