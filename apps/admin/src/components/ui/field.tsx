import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

// Libellés et champs du dashboard : libellé 500 12 px capitales olive ; champ h 40, rayon 8,
// contour intérieur 1,5 px tilleul, focus 2 px olive ; lecture seule sur fond secondaire.

export const labelClass = 'text-[12px] font-medium leading-none tracking-[0.07em] text-olive';

export const inputClass =
  'h-10 w-full rounded-[8px] border-0 bg-cream px-3 text-[14px] leading-none text-ink outline-none shadow-[inset_0_0_0_1.5px_var(--color-tilleul)] placeholder:text-passive-text focus:shadow-[inset_0_0_0_2px_var(--color-olive)] aria-invalid:shadow-[inset_0_0_0_2px_var(--color-red)]';

export const readonlyInputClass =
  'h-10 w-full rounded-[8px] border-0 bg-admin-surface-alt px-3 text-[14px] leading-none text-grey outline-none shadow-[inset_0_0_0_1.5px_var(--color-admin-border)]';

export function FieldLabel({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn(labelClass, className)} {...props} />;
}

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(inputClass, 'h-auto resize-y py-[11px] leading-[1.5]', className)} {...props} />;
}

interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  help?: ReactNode;
  error?: string | null;
  className?: string;
  children: ReactNode;
}

/** Libellé + champ (+ aide ou erreur), écart 7 px comme dans la maquette. */
export function Field({ label, htmlFor, help, error, className, children }: FieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-[7px]', className)}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {error ? (
        <span role="alert" className="text-[12px] leading-[1.4] text-red-deep">
          {error}
        </span>
      ) : help ? (
        <span className="text-[12px] leading-[1.4] text-grey">{help}</span>
      ) : null}
    </div>
  );
}
