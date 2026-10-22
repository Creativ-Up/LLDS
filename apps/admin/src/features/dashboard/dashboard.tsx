'use client';

import { pickText } from '@llds/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { PlusIcon } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { useCreateLine } from '@/features/lines/use-create-line';
import { useEvents, useIncompleteStops, useLines, useMe, useStamps, useStops, useUsers } from '@/lib/data';
import { ADMIN_LANG, t } from '@/lib/i18n';
import { ROUTES } from '@/lib/routes';
import { lineEditorHref, missingText } from '@/features/lines/line-links';

import { eventText, eventWhen } from './event-text';

const ACTIVITY_COUNT = 4;

/** A1 Tableau de bord. */
export function Dashboard() {
  const router = useRouter();
  const { createLine, pending } = useCreateLine();
  const { data: me } = useMe();
  const { data: lines = [] } = useLines();
  const { data: stops = [] } = useStops();
  const { data: stamps = [] } = useStamps();
  const { data: users = [] } = useUsers();
  const { data: incomplete = [] } = useIncompleteStops();
  const { data: events = [] } = useEvents(ACTIVITY_COUNT * 3);

  const stampsWithoutImage = stamps.filter((stamp) => !stamp.image_media_id).length;
  const stopName = (stopId: string) => {
    const stop = stops.find((item) => item.id === stopId);
    return stop ? pickText(stop.name, ADMIN_LANG) : undefined;
  };
  const activity = events
    .map((event) => ({ id: event.id, text: eventText(event, stopName), when: eventWhen(event.created_at) }))
    .filter((item): item is { id: number; text: string; when: string } => item.text !== null)
    .slice(0, ACTIVITY_COUNT);
  const todoCount = incomplete.length + (stampsWithoutImage > 0 ? 1 : 0);

  const stats = [
    {
      label: t('dashboard.stats.publishedLines'),
      value: lines.filter((line) => line.status === 'published').length,
      sub: t('dashboard.stats.publishedLinesSub', { count: lines.length }),
      href: ROUTES.lines,
    },
    {
      label: t('dashboard.stats.stops'),
      value: stops.length,
      sub: t('dashboard.stats.stopsSub', { count: incomplete.length }),
      href: ROUTES.lines,
    },
    {
      label: t('dashboard.stats.stamps'),
      value: stamps.length,
      sub: t('dashboard.stats.stampsSub', { count: stampsWithoutImage }),
      href: ROUTES.stamps,
    },
    {
      label: t('dashboard.stats.users'),
      value: users.length,
      sub: t('dashboard.stats.usersSub'),
      href: ROUTES.users,
    },
  ];

  return (
    <div className="flex max-w-[1180px] animate-adm-in flex-col gap-7">
      <PageHeader
        title={t('dashboard.greeting', { name: me?.firstName ?? '' })}
        subtitle={t('dashboard.subtitle')}
        actions={
          <Button onClick={createLine} disabled={pending}>
            <PlusIcon />
            {t('dashboard.newLine')}
          </Button>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex flex-col gap-2.5 rounded-[10px] bg-admin-surface px-[22px] py-5 no-underline shadow-[inset_0_0_0_1px_var(--color-admin-border)] transition-shadow hover:shadow-[inset_0_0_0_1.5px_var(--color-tilleul)]"
          >
            <span className="text-[12px] font-medium leading-none tracking-[0.07em] text-olive">{stat.label}</span>
            <span className="text-[34px] font-semibold leading-none tracking-[-0.02em] text-ink">{stat.value}</span>
            <span className="text-[13px] leading-[1.3] text-grey">{stat.sub}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <Card className="min-w-0 flex-[2_1_520px]">
          <CardHeader
            title={t('dashboard.todo.title')}
            aside={
              <span className="h-6 rounded-full bg-red-tint px-2.5 text-[12px] font-medium leading-6 text-red-deep">
                {todoCount}
              </span>
            }
          />
          {incomplete.map((item) => (
            <TodoRow
              key={item.stop_id}
              title={t('dashboard.todo.item', {
                line: item.line_code,
                stop: pickText(item.stop_name, ADMIN_LANG) || t('unnamedStop'),
              })}
              detail={t('dashboard.todo.missing', { items: missingText(item.missing) })}
              onComplete={() => router.push(lineEditorHref(item.line_id, item.stop_id, 'media'))}
            />
          ))}
          {stampsWithoutImage > 0 && (
            <TodoRow
              title={t('dashboard.todo.stampsTitle')}
              detail={t('dashboard.todo.stampsDetail', { count: stampsWithoutImage })}
              onComplete={() => router.push(ROUTES.stamps)}
            />
          )}
          {todoCount === 0 && <div className="px-[22px] py-[26px] text-[14px] leading-[1.4] text-grey">{t('dashboard.todo.none')}</div>}
        </Card>

        <Card className="min-w-0 flex-[1_1_300px]">
          <CardHeader title={t('dashboard.activity.title')} />
          {activity.map((item) => (
            <div key={item.id} className="flex flex-col gap-1 border-b border-admin-divider px-[22px] py-[13px]">
              <span className="text-[14px] leading-[1.35] text-ink">{item.text}</span>
              <span className="text-[12px] leading-none text-grey">{item.when}</span>
            </div>
          ))}
          {activity.length === 0 && (
            <div className="px-[22px] py-[26px] text-[14px] leading-[1.4] text-grey">{t('dashboard.activity.empty')}</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function TodoRow({ title, detail, onComplete }: { title: string; detail: string; onComplete: () => void }) {
  return (
    <div className="flex items-center gap-3.5 border-b border-admin-divider px-[22px] py-3.5">
      <span className="block size-2 flex-none rounded-full bg-red" />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-[14px] font-medium leading-[1.3] text-ink">{title}</span>
        <span className="text-[13px] leading-[1.3] text-grey">{detail}</span>
      </div>
      <Button variant="secondary" size="sm" onClick={onComplete}>
        {t('dashboard.todo.action')}
      </Button>
    </div>
  );
}
