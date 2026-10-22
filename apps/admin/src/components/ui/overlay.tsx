'use client';

import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface OverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Titre accessible (affiché par l'appelant ou masqué). */
  title: string;
  children: ReactNode;
  className?: string;
}

/** Modale centrée (rayon 14, padding 26, voile 32 %). */
export function Modal({ open, onOpenChange, title, children, className }: OverlayProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 grid animate-adm-fade place-items-center overflow-y-auto bg-admin-scrim-modal p-5">
          <Dialog.Content
            aria-describedby={undefined}
            className={cn(
              'flex w-full max-w-[520px] animate-adm-in flex-col gap-4 rounded-[14px] bg-cream p-[26px] shadow-[0_24px_60px_var(--color-admin-shadow-modal)] outline-none',
              className,
            )}
          >
            <Dialog.Title className="m-0 text-[20px] font-semibold leading-[1.2]">{title}</Dialog.Title>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface DrawerProps extends OverlayProps {
  /** Largeur maximale (940 arrêt, 820 avantage). */
  width: number;
}

/** Panneau latéral droit : largeur min(width, 100vw), entrée glissée 0,3 s, voile 28 %. */
export function Drawer({ open, onOpenChange, title, width, children, className }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 animate-adm-fade bg-admin-scrim" />
        <Dialog.Content
          aria-describedby={undefined}
          // Pas de focus automatique sur la première action (ex. « Supprimer ») : le panneau lui-même reçoit le focus.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
          }}
          tabIndex={-1}
          style={{ width: `min(${width}px, 100vw)` }}
          className={cn(
            'fixed inset-y-0 right-0 z-21 flex animate-adm-drawer flex-col bg-cream shadow-[-20px_0_50px_var(--color-admin-shadow-drawer)] outline-none',
            className,
          )}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
