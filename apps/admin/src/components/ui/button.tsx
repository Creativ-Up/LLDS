import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

// Boutons du dashboard (docs/ADMIN.md § Système visuel) : principal olive, secondaire contour,
// destructif rouge, désactivé « passif ». Hauteurs 40 (pages), 36 (panneaux), 32 (lignes de liste).
export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[8px] font-medium leading-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-olive focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed aria-disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'bg-olive text-cream hover:bg-olive-dark disabled:bg-admin-border disabled:text-grey-disabled aria-disabled:bg-admin-border aria-disabled:text-grey-disabled',
        secondary: 'text-olive shadow-[inset_0_0_0_1.5px_var(--color-olive)] hover:bg-admin-nav-hover disabled:opacity-50',
        destructive: 'bg-red text-white hover:bg-red-deep disabled:opacity-50',
        dangerLink: 'text-[13px] text-red hover:text-red-deep',
        link: 'text-[13px] text-olive underline underline-offset-[3px] hover:text-olive-text',
      },
      size: {
        md: 'h-10 px-[18px] text-[14px]',
        drawer: 'h-9 px-4 text-[14px]',
        sm: 'h-8 px-3.5 text-[13px]',
        inline: 'h-auto px-0',
      },
    },
    compoundVariants: [
      { variant: 'secondary', size: 'md', className: 'px-4' },
      { variant: 'dangerLink', className: 'h-auto px-2 py-2.5' },
      { variant: 'link', className: 'h-auto px-0' },
    ],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, type = 'button', ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
