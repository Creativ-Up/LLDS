'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { pickText, type LineOverview, type Media } from '@llds/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { MediaThumb } from '@/components/media-thumb';
import { Button } from '@/components/ui/button';
import { cardClass } from '@/components/ui/card';
import { DragHandleIcon, PlusIcon } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { StatusPill } from '@/components/ui/status-pill';
import { useToast } from '@/components/ui/toast';
import { queryKeys, useLines, useMedia } from '@/lib/data';
import { errorMessage } from '@/lib/errors';
import { formatDate, formatKm } from '@/lib/format';
import { ADMIN_LANG, t } from '@/lib/i18n';
import { ROUTES } from '@/lib/routes';
import { getSupabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

import { useCreateLine } from './use-create-line';

const GRID = 'grid-cols-[40px_84px_minmax(220px,2fr)_150px_90px_100px_150px]';

/** A2 Lignes : l'ordre est celui de l'écran « Votre ligne ? » de l'app (glisser pour réordonner). */
export function LinesTable() {
  const { createLine, pending } = useCreateLine();
  const { data: lines = [] } = useLines();
  const { data: media } = useMedia();
  const queryClient = useQueryClient();
  const notify = useToast();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = lines.findIndex((line) => line.id === active.id);
    const to = lines.findIndex((line) => line.id === over.id);
    const reordered = arrayMove(lines, from, to);
    queryClient.setQueryData(queryKeys.lines, reordered.map((line, index) => ({ ...line, sort_order: index + 1 })));
    const { error } = await getSupabase().rpc('reorder_lines', { p_line_ids: reordered.map((line) => line.id) });
    if (error) notify(errorMessage(error));
    else notify(t('lines.reordered'));
    await queryClient.invalidateQueries({ queryKey: queryKeys.lines });
  }

  return (
    <div className="flex max-w-[1180px] animate-adm-in flex-col gap-[22px]">
      <PageHeader
        title={t('lines.title')}
        subtitle={t('lines.subtitle')}
        actions={
          <Button onClick={createLine} disabled={pending}>
            <PlusIcon />
            {t('lines.newLine')}
          </Button>
        }
      />
      <div className={cn(cardClass, 'overflow-x-auto')}>
        <div className="min-w-[820px]">
          <div
            className={cn(
              'grid items-center gap-3.5 border-b border-admin-divider-strong px-[18px] py-3 text-[12px] font-medium leading-none tracking-[0.07em] text-olive',
              GRID,
            )}
          >
            <span />
            <span />
            <span>{t('lines.columns.line')}</span>
            <span>{t('lines.columns.status')}</span>
            <span>{t('lines.columns.stops')}</span>
            <span>{t('lines.columns.length')}</span>
            <span>{t('lines.columns.publication')}</span>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={lines.map((line) => line.id)} strategy={verticalListSortingStrategy}>
              {lines.map((line) => (
                <LineRow key={line.id} line={line} cover={line.cover_media_id ? media?.byId.get(line.cover_media_id) : null} />
              ))}
            </SortableContext>
          </DndContext>
          {lines.length === 0 && <div className="px-[18px] py-6 text-[14px] text-grey">{t('lines.empty')}</div>}
        </div>
      </div>
    </div>
  );
}

function publicationText(line: LineOverview): string {
  if (line.published_at) return t('lines.publication', { version: line.content_version, date: formatDate(line.published_at) });
  return line.status === 'coming_soon' ? t('lines.announced') : t('lines.neverPublished');
}

function LineRow({ line, cover }: { line: LineOverview; cover: Media | null | undefined }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: line.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      role="link"
      tabIndex={0}
      onClick={() => router.push(ROUTES.line(line.id))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') router.push(ROUTES.line(line.id));
      }}
      className={cn(
        'relative grid cursor-pointer items-center gap-3.5 border-b border-admin-divider bg-admin-surface px-[18px] py-3 transition-colors hover:bg-admin-surface-alt',
        GRID,
        isDragging && 'z-10 shadow-[0_8px_24px_var(--color-admin-shadow-card)]',
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={t('lines.dragHandle', { code: line.code })}
        onClick={(event) => event.stopPropagation()}
        className="grid h-10 w-8 cursor-grab touch-none place-items-center text-tilleul active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <DragHandleIcon />
      </button>
      <MediaThumb
        media={cover}
        archive
        className="h-[54px] w-[84px] rounded-[4px] border-[1.5px] border-tilleul bg-tilleul-light"
      />
      <div className="flex min-w-0 items-baseline gap-2.5">
        <span className="text-[16px] font-bold leading-none text-ink">{line.code}</span>
        <span className="truncate text-[14px] font-medium italic leading-[1.2] text-ink">{pickText(line.name, ADMIN_LANG)}</span>
      </div>
      <StatusPill status={line.status} className="justify-self-start" />
      <span className="text-[14px] leading-none text-ink">{line.stop_count}</span>
      <span className="text-[14px] leading-none text-ink">
        {line.length_m === null ? t('noValue') : formatKm(line.length_m)}
      </span>
      <span className="text-[13px] leading-[1.3] text-grey">{publicationText(line)}</span>
    </div>
  );
}
