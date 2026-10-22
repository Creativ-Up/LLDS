import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** lang : onglets FR / NL / EN · filter : filtres de la médiathèque · status : statut de ligne */
  variant: 'lang' | 'filter' | 'status';
  label: string;
  className?: string;
}

const containerClass = {
  lang: 'flex gap-0.5 p-[3px]',
  filter: 'flex gap-1 bg-cream p-[3px]',
  status: 'grid grid-cols-3 gap-1 p-[3px]',
} as const;

const itemClass = {
  lang: 'h-[26px] rounded-[6px] px-[11px] text-[12px] font-semibold',
  filter: 'h-[30px] rounded-[6px] px-[13px] text-[12.5px] font-medium',
  status: 'h-[30px] rounded-[6px] text-[12.5px] font-medium',
} as const;

const activeClass = {
  lang: 'bg-olive text-cream',
  filter: 'bg-olive text-cream',
  status: 'bg-tilleul-light text-ink',
} as const;

const idleClass = {
  lang: 'text-olive',
  filter: 'text-olive',
  status: 'text-grey',
} as const;

/** Contrôle segmenté (groupe de boutons radio) au style de la maquette. */
export function Segmented<T extends string>({ options, value, onChange, variant, label, className }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('rounded-[8px] shadow-[inset_0_0_0_1.5px_var(--color-admin-border)]', containerClass[variant], className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'leading-none transition-colors',
              itemClass[variant],
              active ? activeClass[variant] : idleClass[variant],
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
