import { pickTextFrom, type LineStatus } from '@llds/shared';
import { Suspense } from 'react';

import { ADMIN_LANG, formatNumber, t } from '@/lib/i18n';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Page provisoire du jalon M0 : vérifie la chaîne admin → Supabase. Remplacée par le tableau de bord (M1).
export default function SoclePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-8 py-12">
      <header className="flex flex-col gap-1">
        <span className="text-xs font-medium tracking-[0.07em] text-olive uppercase">{t('brand')}</span>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">{t('socle.title')}</h1>
        <p className="text-[13px] text-grey">{t('socle.subtitle')}</p>
      </header>
      <Suspense fallback={<p className="text-[13px] text-grey">{t('socle.loading')}</p>}>
        <LinesTable />
      </Suspense>
    </main>
  );
}

const STATUS_CLASSES: Record<LineStatus, string> = {
  published: 'bg-olive text-cream',
  draft: 'bg-tilleul-light text-olive-text',
  coming_soon: 'bg-cream text-olive shadow-[inset_0_0_0_1.5px_var(--llds-olive)]',
};

async function LinesTable() {
  const supabase = await createSupabaseServerClient();
  const { data: lines, error } = await supabase
    .from('line_overview')
    .select('id, code, name, status, stop_count, length_m')
    .order('sort_order');

  if (error) {
    return <p className="rounded-field bg-red-tint px-4 py-3 text-red-deep">{t('socle.error', { message: error.message })}</p>;
  }
  if (!lines?.length) return <p className="text-[13px] text-grey">{t('socle.empty')}</p>;

  return (
    <table className="w-full overflow-hidden rounded-[10px] bg-admin-surface shadow-[inset_0_0_0_1px_var(--llds-admin-border)]">
      <thead>
        <tr className="border-b border-admin-divider-strong text-left text-xs font-medium tracking-[0.07em] text-olive">
          <th className="px-4 py-3">{t('socle.columns.line')}</th>
          <th className="px-4 py-3">{t('socle.columns.status')}</th>
          <th className="px-4 py-3 text-right">{t('socle.columns.stops')}</th>
          <th className="px-4 py-3 text-right">{t('socle.columns.length')}</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id} className="border-b border-admin-divider last:border-0">
            <td className="px-4 py-3">
              <span className="font-bold">{line.code}</span>{' '}
              <span className="italic">{pickTextFrom(line.name, ADMIN_LANG)}</span>
            </td>
            <td className="px-4 py-3">
              {line.status && (
                <span className={`rounded-pill px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[line.status]}`}>
                  {t(`common:lineStatus.${line.status}`)}
                </span>
              )}
            </td>
            <td className="px-4 py-3 text-right tabular-nums">{line.stop_count ?? 0}</td>
            <td className="px-4 py-3 text-right tabular-nums">
              {line.length_m === null ? t('socle.noValue') : t('common:units.km', { value: formatNumber(line.length_m / 1000) })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
