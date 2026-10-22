'use client';

import { pickText, type Media } from '@llds/shared';
import { useRef, useState, type DragEvent } from 'react';

import { MediaThumb } from '@/components/media-thumb';
import { cardClass } from '@/components/ui/card';
import { UploadIcon } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { Segmented } from '@/components/ui/segmented';
import { useToast } from '@/components/ui/toast';
import { useMedia, useMediaUsages, type MediaUsage } from '@/lib/data';
import { formatDuration, formatSize } from '@/lib/format';
import { ADMIN_LANG, t } from '@/lib/i18n';
import { ACCEPT_ATTR, familyOfMime, type MediaFamily } from '@/lib/upload';
import { useUpload } from '@/lib/use-upload';
import { cn } from '@/lib/utils';

type Filter = 'all' | MediaFamily;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: t('media.filters.all') },
  { value: 'image', label: t('media.filters.image') },
  { value: 'video', label: t('media.filters.video') },
  { value: 'audio', label: t('media.filters.audio') },
  { value: 'subtitles', label: t('media.filters.subtitles') },
];

const GRID = 'grid-cols-[56px_minmax(220px,2fr)_90px_90px_80px_minmax(160px,1.4fr)_minmax(140px,1fr)]';

function usageText(usage: MediaUsage): string {
  const stop = usage.stop_name ? pickText(usage.stop_name, ADMIN_LANG) || t('unnamedStop') : t('unnamedStop');
  switch (usage.usage) {
    case 'line_cover':
      return t('media.usage.line_cover', { line: usage.line_code ?? '' });
    case 'stop_archive':
      return t('media.usage.stop_archive', { stop });
    case 'stop_present':
      return t('media.usage.stop_present', { stop });
    case 'stop_narration':
      return t('media.usage.stop_narration', { stop, lang: (usage.lang ?? '').toUpperCase() });
    case 'stamp_image':
      return t('media.usage.stamp_image', { name: usage.stamp_name ? pickText(usage.stamp_name, ADMIN_LANG) : '' });
    case 'partner_photo':
      return t('media.usage.partner_photo', { name: usage.partner_name ?? '' });
    case 'partner_logo':
      return t('media.usage.partner_logo', { name: usage.partner_name ?? '' });
  }
}

const extension = (media: Media) => (media.original_name ?? media.path).split('.').pop()?.toUpperCase() ?? '';

/** A7 Médiathèque : tous les fichiers téléversés, leurs usages et leurs crédits. */
export function MediaLibrary() {
  const notify = useToast();
  const { data: media } = useMedia();
  const { data: usages = [] } = useMediaUsages();
  const { upload, progress } = useUpload();
  const [filter, setFilter] = useState<Filter>('all');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const all = media?.list ?? [];
  const rows = all.filter((item) => filter === 'all' || familyOfMime(item.mime) === filter);
  const totalBytes = all.reduce((sum, item) => sum + item.size_bytes, 0);
  const usagesOf = (id: string) => usages.filter((usage) => usage.media_id === id);

  async function uploadFiles(files: FileList | null) {
    for (const file of Array.from(files ?? [])) {
      const uploaded = await upload(file, 'media');
      if (uploaded) notify(t('media.uploaded', { name: file.name }));
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(event.dataTransfer.files);
  }

  return (
    <div className="flex max-w-[1180px] animate-adm-in flex-col gap-5">
      <PageHeader
        title={t('media.title')}
        subtitle={t('media.summary', { count: all.length, size: formatSize(totalBytes) })}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center gap-2 rounded-[10px] border-[1.5px] border-dashed border-tilleul bg-cream p-[26px] text-center hover:bg-admin-surface-alt',
          dragging && 'bg-admin-surface-alt',
        )}
      >
        <UploadIcon className="text-olive" />
        <span className="text-[14px] font-medium leading-[1.3]">
          {t('media.drop')}
          <u>{t('media.browse')}</u>
        </span>
        <span className="text-[12.5px] leading-[1.4] text-grey">{t('media.formats')}</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept={ACCEPT_ATTR.any}
          onChange={(event) => {
            void uploadFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {progress && (
        <div className={cn(cardClass, 'flex animate-adm-in flex-col gap-[9px] px-[18px] py-3.5')}>
          <div className="flex justify-between gap-2.5 text-[13px] font-medium leading-none">
            <span>{progress.name}</span>
            <span className="text-grey">{progress.pct} %</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-tilleul-light">
            <div className="h-full rounded-full bg-olive transition-[width] duration-150 ease-linear" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>
      )}

      <Segmented variant="filter" label={t('media.title')} options={FILTERS} value={filter} onChange={setFilter} className="self-start" />

      <div className={cn(cardClass, 'overflow-x-auto')}>
        <div className="min-w-[820px]">
          <div
            className={cn(
              'grid items-center gap-3.5 border-b border-admin-divider-strong px-[18px] py-[11px] text-[12px] font-medium leading-none tracking-[0.07em] text-olive',
              GRID,
            )}
          >
            <span />
            <span>{t('media.columns.file')}</span>
            <span>{t('media.columns.type')}</span>
            <span>{t('media.columns.size')}</span>
            <span>{t('media.columns.duration')}</span>
            <span>{t('media.columns.used')}</span>
            <span>{t('media.columns.credit')}</span>
          </div>
          {rows.map((item) => {
            const family = familyOfMime(item.mime);
            const itemUsages = usagesOf(item.id);
            const isArchive = itemUsages.some((usage) => usage.usage === 'stop_archive');
            const creditMissing = isArchive && !item.credit;
            return (
              <div key={item.id} className={cn('grid items-center gap-3.5 border-b border-admin-divider px-[18px] py-2.5', GRID)}>
                {family === 'image' ? (
                  <MediaThumb media={item} className="h-10 w-14 rounded-[5px] bg-tilleul-light" />
                ) : (
                  <div className="grid h-10 w-14 place-items-center rounded-[5px] bg-tilleul-light text-[10px] font-bold leading-none tracking-[0.06em] text-olive-text">
                    {extension(item)}
                  </div>
                )}
                <span className="truncate text-[13.5px] font-medium leading-[1.3]">{item.original_name ?? item.path}</span>
                <span className="text-[13px] leading-none text-grey">{t(`media.kinds.${family}`)}</span>
                <span className="text-[13px] leading-none">{formatSize(item.size_bytes)}</span>
                <span className="text-[13px] leading-none text-grey">
                  {item.duration_s === null ? t('noValue') : formatDuration(item.duration_s)}
                </span>
                <span className="text-[13px] leading-[1.3]">
                  {itemUsages.length ? itemUsages.map(usageText).join(' · ') : t('media.usage.unused')}
                </span>
                <span className={cn('text-[12.5px] leading-[1.3]', creditMissing ? 'text-red' : 'text-grey')}>
                  {creditMissing ? t('media.creditMissing') : (item.credit ?? t('noValue'))}
                </span>
              </div>
            );
          })}
          {rows.length === 0 && <p className="m-0 px-[18px] py-5 text-[14px] text-grey">{t('media.empty')}</p>}
        </div>
      </div>
    </div>
  );
}
