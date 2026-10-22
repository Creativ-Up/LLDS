'use client';

import { Select as RadixSelect } from 'radix-ui';

import { cn } from '@/lib/utils';

import { ChevronDownIcon } from './icons';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: readonly SelectOption[];
  placeholder: string;
  /** Libellé de l'option « vide » (ex. « Aucun cachet ») ; absent = choix obligatoire. */
  emptyLabel?: string;
  invalid?: boolean;
}

const EMPTY = '__empty__';

/** Liste déroulante au style des champs (h 40, contour tilleul, chevron olive). */
export function Select({ id, value, onChange, options, placeholder, emptyLabel, invalid }: SelectProps) {
  return (
    <RadixSelect.Root
      value={value ?? (emptyLabel ? EMPTY : '')}
      onValueChange={(next) => onChange(next === EMPTY ? null : next)}
    >
      <RadixSelect.Trigger
        id={id}
        aria-invalid={invalid || undefined}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-[8px] bg-cream px-3 text-left text-[14px] leading-none text-ink outline-none shadow-[inset_0_0_0_1.5px_var(--color-tilleul)] focus:shadow-[inset_0_0_0_2px_var(--color-olive)] aria-invalid:shadow-[inset_0_0_0_2px_var(--color-red)] data-[placeholder]:text-grey"
      >
        <span className="min-w-0 truncate">
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        <RadixSelect.Icon className="text-olive">
          <ChevronDownIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-40 max-h-[320px] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[8px] bg-cream shadow-[inset_0_0_0_1px_var(--color-admin-border),0_12px_30px_var(--color-admin-shadow-card)]"
        >
          <RadixSelect.Viewport className="p-1">
            {emptyLabel && <SelectItem value={EMPTY} label={emptyLabel} />}
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} label={option.label} />
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

function SelectItem({ value, label }: SelectOption) {
  return (
    <RadixSelect.Item
      value={value}
      className={cn(
        'flex h-9 cursor-pointer items-center rounded-[6px] px-2.5 text-[14px] text-ink outline-none select-none',
        'data-[highlighted]:bg-admin-nav-hover data-[state=checked]:font-medium',
      )}
    >
      <RadixSelect.ItemText>{label}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}
