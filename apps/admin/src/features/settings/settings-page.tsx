'use client';

import type { AppSettings } from '@llds/shared';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { inputClass } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';
import { queryKeys, useInvalidate, useSettings } from '@/lib/data';
import { errorMessage } from '@/lib/errors';
import { t } from '@/lib/i18n';
import { getSupabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Key = keyof AppSettings;

const KEYS: readonly Key[] = ['default_geofence_radius_m', 'walk_kmh', 'bike_kmh', 'car_kmh', 'default_guest_preview_s'];
const INTEGER_KEYS = new Set<Key>(['default_geofence_radius_m', 'default_guest_preview_s']);

// Saisie à la française (virgule décimale).
const decimal = (value: number) => String(value).replace('.', ',');

const toValues = (settings: AppSettings): Record<Key, string> => ({
  default_geofence_radius_m: decimal(settings.default_geofence_radius_m),
  walk_kmh: decimal(settings.walk_kmh),
  bike_kmh: decimal(settings.bike_kmh),
  car_kmh: decimal(settings.car_kmh),
  default_guest_preview_s: decimal(settings.default_guest_preview_s),
});

/** A9 Réglages : valeurs par défaut des nouveaux arrêts et vitesses des durées estimées. */
export function SettingsPage() {
  const { data: settings } = useSettings();
  return (
    <div className="flex max-w-[760px] animate-adm-in flex-col gap-5">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      {settings ? <SettingsForm initial={toValues(settings)} /> : <p className="text-[14px] text-grey">{t('loading')}</p>}
    </div>
  );
}

function SettingsForm({ initial }: { initial: Record<Key, string> }) {
  const notify = useToast();
  const invalidate = useInvalidate();
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function save() {
    const parsed: Partial<AppSettings> = {};
    for (const key of KEYS) {
      const number = Number(values[key].replace(',', '.'));
      if (!Number.isFinite(number) || number <= 0 || (INTEGER_KEYS.has(key) && !Number.isInteger(number))) {
        notify(t('settings.invalid', { label: t(`settings.items.${key}.label`) }));
        return;
      }
      parsed[key] = number;
    }
    setBusy(true);
    const { error } = await getSupabase().from('app_settings').update(parsed).eq('id', true);
    setBusy(false);
    if (error) return notify(errorMessage(error));
    await invalidate(queryKeys.settings, queryKeys.events);
    notify(t('settings.saved'));
  }

  return (
    <>
      <Card>
        {KEYS.map((key) => (
          <div key={key} className="flex flex-wrap items-center justify-between gap-5 border-b border-admin-divider px-5 py-4 last:border-b-0">
            <div className="flex flex-[1_1_280px] flex-col gap-1">
              <label htmlFor={`setting-${key}`} className="text-[14px] font-medium leading-[1.3]">
                {t(`settings.items.${key}.label`)}
              </label>
              <span className="text-[12.5px] leading-[1.4] text-grey">{t(`settings.items.${key}.help`)}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id={`setting-${key}`}
                inputMode="decimal"
                value={values[key]}
                onChange={(event) => setValues({ ...values, [key]: event.target.value })}
                className={cn(inputClass, 'h-[38px] w-[90px] px-2.5 text-right font-medium')}
              />
              <span className="w-[46px] text-[13px] leading-none text-grey">{t(`settings.items.${key}.unit`)}</span>
            </div>
          </div>
        ))}
      </Card>
      <div className="flex justify-end">
        <Button onClick={save} disabled={busy}>
          {t('save')}
        </Button>
      </div>
    </>
  );
}
