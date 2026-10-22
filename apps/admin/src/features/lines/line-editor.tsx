'use client';

import { downloadSizeBytes, LANGS, pickText, type I18nText, type Lang, type LineOverview, type LineStatus } from '@llds/shared';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { FilePicker } from '@/components/file-picker';
import { MediaThumb } from '@/components/media-thumb';
import { Button } from '@/components/ui/button';
import { Card, SectionTitle } from '@/components/ui/card';
import { Field, inputClass } from '@/components/ui/field';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CrossIcon, PlusIcon, TrackIcon } from '@/components/ui/icons';
import { Modal } from '@/components/ui/overlay';
import { Segmented } from '@/components/ui/segmented';
import { StatusPill } from '@/components/ui/status-pill';
import { useToast } from '@/components/ui/toast';
import { contentKeys, useInvalidate } from '@/lib/data';
import { errorMessage, isUniqueViolation } from '@/lib/errors';
import { formatKm, formatSize } from '@/lib/format';
import { ADMIN_LANG, t } from '@/lib/i18n';
import { ROUTES } from '@/lib/routes';
import { getSupabase } from '@/lib/supabase/client';
import { ACCEPT_ATTR } from '@/lib/upload';
import { useUpload } from '@/lib/use-upload';
import { cn } from '@/lib/utils';

import { lineEditorHref, missingText, STOP_TABS, type StopTab } from './line-links';
import type { MapStop } from './line-map';
import { StopDrawer } from './stop-drawer';
import { parseTrackFile, TRACK_ACCEPT } from './track-file';
import { useLineData, type LineData } from './use-line-data';

const LineMap = dynamic(() => import('./line-map').then((module) => module.LineMap), {
  ssr: false,
  loading: () => <div className="aspect-[640/420] w-full bg-admin-map-bg" />,
});

const LANG_OPTIONS = LANGS.map((lang) => ({ value: lang, label: lang.toUpperCase() }));
const STATUS_OPTIONS: { value: LineStatus; label: string }[] = [
  { value: 'draft', label: t('line.info.statusOptions.draft') },
  { value: 'coming_soon', label: t('line.info.statusOptions.coming_soon') },
  { value: 'published', label: t('line.info.statusOptions.published') },
];

/** A3 Éditeur de ligne (le panneau d'arrêt A4 s'ouvre par ?arret=…&onglet=…). */
export function LineEditor() {
  const { id } = useParams<{ id: string }>();
  const data = useLineData(id);

  if (!data.line) {
    return (
      <p className="text-[14px] text-grey">{data.loading ? t('loading') : t('line.notFound')}</p>
    );
  }
  return <LineEditorView key={data.line.id} line={data.line} data={data} />;
}

function versionText(line: LineOverview): string {
  if (line.status === 'published') return t('line.versionOnline', { version: line.content_version });
  if (line.content_version > 0) return t('line.versionOffline', { version: line.content_version });
  return t('line.neverPublished');
}

function LineEditorView({ line, data }: { line: LineOverview; data: LineData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notify = useToast();
  const invalidate = useInvalidate();
  const { upload } = useUpload();
  const supabase = getSupabase();

  const [lang, setLang] = useState<Lang>(ADMIN_LANG);
  const [code, setCode] = useState(line.code);
  const [name, setName] = useState<I18nText>(line.name);
  const [tagline, setTagline] = useState<I18nText>(line.tagline);
  const [addMode, setAddMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const { stops, missingByStop, issues, narration, mediaById } = data;
  const selectedId = searchParams.get('arret');
  const tabParam = searchParams.get('onglet');
  const tab: StopTab = STOP_TABS.find((value) => value === tabParam) ?? 'infos';
  const selectedStop = stops.find((stop) => stop.id === selectedId) ?? null;
  const blocking = issues.some((issue) => issue.blocking);
  const refresh = () => invalidate(...contentKeys);

  const openStop = (stopId: string, nextTab?: StopTab) =>
    router.replace(lineEditorHref(line.id, stopId, nextTab), { scroll: false });
  const closeStop = () => router.replace(ROUTES.line(line.id), { scroll: false });

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    run(async () => {
      if (!code.trim()) {
        notify(t('line.toasts.codeRequired'));
        return;
      }
      const { error } = await supabase.from('lines').update({ code: code.trim(), name, tagline }).eq('id', line.id);
      if (isUniqueViolation(error)) {
        notify(t('line.toasts.codeTaken', { code: code.trim() }));
        return;
      }
      if (error) throw error;
      await refresh();
      notify(t('line.toasts.saved'));
    });

  const publish = () =>
    run(async () => {
      if (blocking) {
        notify(t('line.toasts.cantPublish'));
        return;
      }
      const { data: version, error } = await supabase.rpc('publish_line', { p_line_id: line.id });
      if (error) throw error;
      await refresh();
      notify(t('line.toasts.published', { code: line.code, version }));
    });

  const changeStatus = (status: LineStatus) => {
    if (status === line.status) return;
    if (status === 'published') {
      publish();
      return;
    }
    run(async () => {
      const { error } = await supabase.from('lines').update({ status }).eq('id', line.id);
      if (error) throw error;
      await refresh();
      notify(t('line.toasts.statusSaved'));
    });
  };

  const importTrack = (file: File) =>
    run(async () => {
      const track = await parseTrackFile(file);
      if (!track) {
        notify(t('line.track.invalid'));
        return;
      }
      const { data: length, error } = await supabase.rpc('set_line_track', {
        p_line_id: line.id,
        p_geojson: track,
        p_source_name: file.name,
      });
      if (error) throw error;
      await refresh();
      notify(t('line.track.imported', { length: formatKm(length) }));
    });

  const replaceCover = (file: File) =>
    run(async () => {
      const media = await upload(file, 'media-public');
      if (!media) return;
      const { error } = await supabase.from('lines').update({ cover_media_id: media.id }).eq('id', line.id);
      if (error) throw error;
      await refresh();
      notify(t('line.toasts.saved'));
    });

  const addStop = (lng: number, lat: number) =>
    run(async () => {
      const { data: stopId, error } = await supabase.rpc('add_stop', { p_line_id: line.id, p_lng: lng, p_lat: lat });
      if (error) throw error;
      setAddMode(false);
      await refresh();
      openStop(stopId, 'infos');
    });

  const moveStop = (stopId: string, lng: number, lat: number) =>
    run(async () => {
      const { error } = await supabase.rpc('move_stop', { p_stop_id: stopId, p_lng: lng, p_lat: lat });
      if (error) throw error;
      await refresh();
    });

  const reorder = (index: number, delta: -1 | 1) =>
    run(async () => {
      const ids = stops.map((stop) => stop.id);
      const target = index + delta;
      const current = ids[index];
      const other = ids[target];
      if (current === undefined || other === undefined) return;
      ids[index] = other;
      ids[target] = current;
      const { error } = await supabase.rpc('reorder_stops', { p_line_id: line.id, p_stop_ids: ids });
      if (error) throw error;
      await refresh();
    });

  const deleteLine = () =>
    run(async () => {
      const { error } = await supabase.from('lines').delete().eq('id', line.id);
      if (error) throw error;
      notify(t('line.toasts.lineDeleted', { code: line.code }));
      router.push(ROUTES.lines);
      await refresh();
    });

  const mapStops: MapStop[] = stops.map((stop, index) => ({
    id: stop.id,
    n: index + 1,
    name: pickText(stop.name, ADMIN_LANG) || t('unnamedStop'),
    lng: stop.lng,
    lat: stop.lat,
    radius: stop.geofence_radius_m,
    warn: missingByStop.has(stop.id),
  }));

  const cover = line.cover_media_id ? mediaById.get(line.cover_media_id) : null;
  const sizes = stops.map((stop) => {
    const fr = narration.get(stop.id)?.fr ?? {};
    const size = (mediaId: string | null) => (mediaId ? (mediaById.get(mediaId)?.size_bytes ?? 0) : 0);
    return {
      archiveBytes: size(stop.archive_media_id),
      presentBytes: size(stop.present_media_id),
      narration: { video: fr.video?.size_bytes, audio: fr.audio?.size_bytes, subtitles: fr.subtitles?.size_bytes },
    };
  });
  const coverBytes = cover?.size_bytes ?? 0;

  return (
    <div className="flex max-w-[1320px] animate-adm-in flex-col gap-5">
      <div className="flex items-center gap-2 text-[13px] leading-none text-grey">
        <Link href={ROUTES.lines} className="text-olive underline underline-offset-[3px]">
          {t('line.breadcrumb')}
        </Link>
        <span>/</span>
        <span>{line.code}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-3.5">
          <h1 className="m-0 text-[28px] font-bold leading-[1.1] tracking-[-0.02em]">{line.code}</h1>
          <span className="text-[22px] font-medium italic leading-[1.1]">{pickText(line.name, ADMIN_LANG)}</span>
          <StatusPill status={line.status} />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] leading-none text-grey">{versionText(line)}</span>
          <Button variant="secondary" onClick={save} disabled={busy}>
            {t('line.save')}
          </Button>
          <Button onClick={publish} aria-disabled={blocking || undefined} disabled={busy}>
            {t('line.publish')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-5">
        {/* Colonne formulaire */}
        <div className="flex max-w-[460px] min-w-0 flex-[1_1_360px] flex-col gap-4">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle>{t('line.info.title')}</SectionTitle>
              <Segmented variant="lang" label={t('stop.infos.contentLang')} options={LANG_OPTIONS} value={lang} onChange={setLang} />
            </div>
            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
              <Field label={t('line.info.code')} htmlFor="line-code">
                <input
                  id="line-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className={cn(inputClass, 'font-semibold')}
                />
              </Field>
              <Field label={t('line.info.name', { lang: lang.toUpperCase() })} htmlFor="line-name">
                <input
                  id="line-name"
                  value={name[lang] ?? ''}
                  placeholder={lang === ADMIN_LANG ? '' : (name.fr ?? '')}
                  onChange={(event) => setName({ ...name, [lang]: event.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label={t('line.info.tagline', { lang: lang.toUpperCase() })} htmlFor="line-tagline">
              <input
                id="line-tagline"
                value={tagline[lang] ?? ''}
                placeholder={t('line.info.taglinePlaceholder')}
                onChange={(event) => setTagline({ ...tagline, [lang]: event.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="flex items-center gap-3.5">
              <MediaThumb
                media={cover}
                archive
                className="h-[62px] w-24 flex-none rounded-[4px] border-[1.5px] border-tilleul bg-tilleul-light"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[13px] font-medium leading-[1.2]">{t('line.info.cover')}</span>
                <span className="text-[12px] leading-[1.3] text-grey">{t('line.info.coverHelp')}</span>
              </div>
              <FilePicker
                accept={ACCEPT_ATTR.image}
                onFile={replaceCover}
                disabled={busy}
                className="text-[13px] font-medium leading-none text-olive underline underline-offset-[3px]"
              >
                {cover ? t('replace') : t('upload')}
              </FilePicker>
            </div>
            <div className="flex flex-col gap-[7px]">
              <span className="text-[12px] font-medium leading-none tracking-[0.07em] text-olive">{t('line.info.status')}</span>
              <Segmented variant="status" label={t('line.info.status')} options={STATUS_OPTIONS} value={line.status} onChange={changeStatus} />
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <SectionTitle>{t('line.track.title')}</SectionTitle>
            <div className="flex items-center gap-3 rounded-[8px] bg-admin-surface-alt px-3.5 py-3">
              <TrackIcon className="flex-none text-olive" />
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="truncate text-[13px] font-medium leading-[1.2]">
                  {line.track_geojson ? (line.track_source_name ?? t('line.track.file')) : t('line.track.none')}
                </span>
                <span className="text-[12px] leading-[1.2] text-grey">
                  {line.length_m !== null
                    ? t('line.track.computed', { length: formatKm(line.length_m) })
                    : t('line.track.noneHelp')}
                </span>
              </div>
              <FilePicker
                accept={TRACK_ACCEPT}
                onFile={importTrack}
                disabled={busy}
                className="text-[13px] font-medium leading-none text-olive underline underline-offset-[3px]"
              >
                {line.track_geojson ? t('replace') : t('line.track.import')}
              </FilePicker>
            </div>
            <span className="text-[12px] leading-[1.4] text-grey">{t('line.track.formats')}</span>
          </Card>

          <StopsPanel
            data={data}
            selectedId={selectedId}
            addMode={addMode}
            busy={busy}
            onToggleAdd={() => setAddMode((value) => !value)}
            onOpen={(stopId) => openStop(stopId)}
            onMove={reorder}
          />

          <Button variant="dangerLink" className="self-start" onClick={() => setConfirmDelete(true)}>
            {t('line.deleteLine')}
          </Button>
        </div>

        {/* Colonne carte */}
        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-4">
          <Card className="relative overflow-hidden">
            <LineMap
              lineId={line.id}
              track={line.track_geojson}
              stops={mapStops}
              selectedId={selectedId}
              addMode={addMode}
              onAdd={addStop}
              onSelect={(stopId) => {
                setAddMode(false);
                openStop(stopId, 'infos');
              }}
              onMove={moveStop}
            />
          </Card>
          <div className="flex flex-wrap items-start gap-4">
            <PublicationChecks line={line} data={data} />
            <Card className="flex min-w-0 flex-[1_1_240px] flex-col gap-3 px-5 py-[18px]">
              <SectionTitle>{t('line.download.title')}</SectionTitle>
              <div className="flex items-baseline justify-between gap-2.5 border-b border-admin-divider pb-2.5">
                <span className="text-[13.5px] leading-[1.3]">{t('line.download.full')}</span>
                <span className="text-[15px] font-semibold leading-none">
                  {formatSize(downloadSizeBytes(coverBytes, sizes, 'complete'))}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2.5">
                <span className="text-[13.5px] leading-[1.3]">{t('line.download.audio')}</span>
                <span className="text-[15px] font-semibold leading-none">
                  {formatSize(downloadSizeBytes(coverBytes, sizes, 'audio'))}
                </span>
              </div>
              <span className="text-[12px] leading-[1.4] text-grey">{t('line.download.help')}</span>
            </Card>
          </div>
        </div>
      </div>

      {selectedStop && (
        <StopDrawer
          key={selectedStop.id}
          stop={selectedStop}
          index={stops.indexOf(selectedStop)}
          data={data}
          tab={tab}
          onTab={(next) => openStop(selectedStop.id, next)}
          onClose={closeStop}
        />
      )}

      <Modal open={confirmDelete} onOpenChange={setConfirmDelete} title={t('line.deleteModal.title', { code: line.code })} className="max-w-[440px]">
        <p className="m-0 text-[14px] leading-[1.5] text-grey">{t('line.deleteModal.body')}</p>
        <div className="mt-1.5 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={deleteLine} disabled={busy}>
            {t('line.deleteModal.confirm')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

interface StopsPanelProps {
  data: LineData;
  selectedId: string | null;
  addMode: boolean;
  busy: boolean;
  onToggleAdd: () => void;
  onOpen: (stopId: string) => void;
  onMove: (index: number, delta: -1 | 1) => void;
}

function StopsPanel({ data, selectedId, addMode, busy, onToggleAdd, onOpen, onMove }: StopsPanelProps) {
  const { stops, missingByStop } = data;
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-admin-divider-strong px-5 py-4">
        <SectionTitle>
          {t('line.stops.title')} <span className="font-normal text-grey">· {stops.length}</span>
        </SectionTitle>
        <button
          type="button"
          onClick={onToggleAdd}
          aria-pressed={addMode}
          className={cn(
            'flex h-8 items-center gap-[7px] rounded-[8px] px-3 text-[13px] font-medium leading-none shadow-[inset_0_0_0_1.5px_var(--color-olive)]',
            addMode ? 'bg-olive text-cream' : 'text-olive',
          )}
        >
          <PlusIcon className="size-3" strokeWidth={2.2} />
          {addMode ? t('line.stops.cancelAdd') : t('line.stops.add')}
        </button>
      </div>
      {stops.map((stop, index) => {
        const missing = missingByStop.get(stop.id) ?? [];
        const selected = stop.id === selectedId;
        const state = missing.length
          ? t('line.stops.missing', { items: missingText(missing) })
          : t('line.stops.complete', { count: stop.services.length }) + (stop.stamp_id ? t('line.stops.withStamp') : '');
        return (
          <div
            key={stop.id}
            className={cn('flex items-center gap-3 border-b border-admin-divider py-2.5 pr-3.5 pl-4', selected && 'bg-admin-surface-alt')}
          >
            <span
              className={cn(
                'grid size-[26px] flex-none place-items-center rounded-full text-[12px] font-semibold leading-none text-cream',
                selected ? 'bg-red' : 'bg-ink',
              )}
            >
              {index + 1}
            </span>
            <button type="button" onClick={() => onOpen(stop.id)} className="flex min-w-0 flex-1 flex-col gap-[3px] text-left">
              <span className="truncate text-[14px] font-medium leading-[1.25] text-ink">
                {pickText(stop.name, ADMIN_LANG) || t('unnamedStop')}
              </span>
              <span className={cn('text-[12px] leading-[1.25]', missing.length ? 'text-red' : 'text-grey')}>{state}</span>
            </button>
            <div className="flex flex-none gap-0.5">
              <button
                type="button"
                aria-label={t('line.stops.up')}
                disabled={busy || index === 0}
                onClick={() => onMove(index, -1)}
                className="grid size-7 place-items-center rounded-[6px] text-olive hover:bg-tilleul-light disabled:opacity-25"
              >
                <ChevronUpIcon />
              </button>
              <button
                type="button"
                aria-label={t('line.stops.down')}
                disabled={busy || index === stops.length - 1}
                onClick={() => onMove(index, 1)}
                className="grid size-7 place-items-center rounded-[6px] text-olive hover:bg-tilleul-light disabled:opacity-25"
              >
                <ChevronDownIcon />
              </button>
            </div>
          </div>
        );
      })}
      {stops.length === 0 && <p className="m-0 px-5 py-4 text-[13px] leading-[1.4] text-grey">{t('line.stops.empty')}</p>}
    </Card>
  );
}

interface Check {
  label: string;
  detail: string;
  ok: boolean;
  warnOnly?: boolean;
}

function PublicationChecks({ line, data }: { line: LineOverview; data: LineData }) {
  const { stops, issues } = data;
  const nameOf = (stopId: string | null) => {
    const stop = stops.find((item) => item.id === stopId);
    return (stop && pickText(stop.name, ADMIN_LANG)) || t('unnamedStop');
  };
  const incomplete = issues.filter((issue) => issue.code === 'stop_incomplete');
  const partial = issues.filter((issue) => issue.code === 'translations_partial');

  const checks: Check[] = [
    line.track_geojson && line.length_m !== null
      ? {
          label: t('line.checks.track'),
          detail: t('line.checks.trackDetail', {
            file: line.track_source_name ?? t('line.track.file'),
            length: formatKm(line.length_m),
          }),
          ok: true,
        }
      : { label: t('line.checks.noTrack'), detail: t('line.checks.noTrackDetail'), ok: false },
    { label: t('line.checks.stops', { count: stops.length }), detail: t('line.checks.stopsDetail'), ok: stops.length > 0 },
    incomplete.length
      ? {
          label: t('line.checks.incomplete', { count: incomplete.length }),
          detail: incomplete
            .map((issue) => t('line.checks.incompleteDetail', { stop: nameOf(issue.stop_id), items: missingText(issue.missing) }))
            .join(' · '),
          ok: false,
        }
      : { label: t('line.checks.allComplete'), detail: t('line.checks.allCompleteDetail'), ok: true },
    partial.length
      ? {
          label: t('line.checks.translationsPartial'),
          detail: t('line.checks.translationsPartialDetail', { count: partial.length }),
          ok: false,
          warnOnly: true,
        }
      : { label: t('line.checks.translationsComplete'), detail: t('line.checks.translationsCompleteDetail'), ok: true },
  ];

  return (
    <Card className="flex min-w-0 flex-[1_1_300px] flex-col gap-3 px-5 py-[18px]">
      <SectionTitle>{t('line.checks.title')}</SectionTitle>
      {checks.map((check) => (
        <div key={check.label} className="flex items-start gap-2.5">
          <span
            className={cn(
              'mt-px grid size-5 flex-none place-items-center rounded-full text-cream',
              check.ok ? 'bg-olive' : check.warnOnly ? 'bg-tilleul' : 'bg-red',
            )}
          >
            {check.ok ? <CheckIcon /> : <CrossIcon />}
          </span>
          <div className="flex min-w-0 flex-col gap-[3px]">
            <span className="text-[13.5px] font-medium leading-[1.35] text-ink">{check.label}</span>
            <span className="text-[12.5px] leading-[1.35] text-grey">{check.detail}</span>
          </div>
        </div>
      ))}
    </Card>
  );
}
