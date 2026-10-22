import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
  disabled?: boolean;
}

/** Interrupteur 40 × 24 (olive actif, bordure claire inactif). */
export function Switch({ checked, onCheckedChange, label, className, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative h-6 w-10 flex-none rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-olive' : 'bg-admin-border',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] block size-[18px] rounded-full bg-cream shadow-[0_1px_3px_var(--color-admin-shadow-strong)] transition-[left]',
          checked ? 'left-[19px]' : 'left-[3px]',
        )}
      />
    </button>
  );
}
