import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

// Éléments propres à l'écran de connexion (A0) : champs h 42, bouton h 44.

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="m-0 text-[24px] font-semibold leading-[1.2] tracking-[-0.02em]">{title}</h1>
      {subtitle && <p className="m-0 text-[14px] leading-[1.45] text-grey">{subtitle}</p>}
    </div>
  );
}

export function AuthField({ label, id, ...input }: ComponentProps<'input'> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-[7px]">
      <label htmlFor={id} className="text-[12px] font-medium leading-none tracking-[0.07em] text-olive">
        {label}
      </label>
      <input
        id={id}
        className="h-[42px] rounded-[8px] border-0 bg-cream px-3.5 text-[14px] leading-none text-ink outline-none shadow-[inset_0_0_0_1.5px_var(--color-tilleul)] focus:shadow-[inset_0_0_0_2px_var(--color-olive)] aria-invalid:shadow-[inset_0_0_0_2px_var(--color-red)]"
        {...input}
      />
    </div>
  );
}

export function AuthSubmit({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="submit"
      className={cn(
        'h-11 rounded-[8px] bg-olive text-center text-[15px] font-medium leading-[44px] text-cream transition-colors hover:bg-olive-dark disabled:bg-olive-dark',
        className,
      )}
      {...props}
    />
  );
}

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="m-0 rounded-[8px] bg-red-tint px-3.5 py-3 text-[14px] leading-[1.4] text-red-deep">
      {children}
    </p>
  );
}

export const authLinkClass =
  'self-center text-[13px] leading-none text-olive underline underline-offset-[3px] hover:text-olive-text';
