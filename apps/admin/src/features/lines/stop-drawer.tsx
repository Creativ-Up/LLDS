'use client';

import {
  LANGS,
  pickText,
  STOP_MEDIA_KINDS,
  STOP_SERVICES,
  type I18nText,
  type Lang,
  type Media,
  type StopMediaKind,
  type StopOverview,
  type StopService,
} from '@llds/shared';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';

import { FilePicker } from '@/components/file-picker';
import { MediaThumb } from '@/components/media-thumb';
import { SERVICE_ICONS } from '@/components/service-icons';
import { StampBadge } from '@/components/stamp-badge';
import { Button } from '@/components/ui/button';
import { Field, inputClass, labelClass, readonlyInputClass } from '@/components/ui/field';
import { PlayIcon } from '@/components/ui/icons';
import { Drawer } from '@/components/ui/overlay';
import { Segmented } from '@/components/ui/segmented';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { contentKeys, queryKeys, useInvalidate, useMedia, useOffers, useStamps, useStops } from '@/lib/data';
import { errorMessage } from '@/lib/errors';
import { formatDuration, formatSize } from '@/lib/format';
import { ADMIN_LANG, t } from '@/lib/i18n';
import { getSupabase } from '@/lib/supabase/client';
import { ACCEPT_ATTR } from '@/lib/upload';
import { useUpload } from '@/lib/use-upload';
import { cn } from '@/lib/utils';

import type { StopTab } from './line-links';
import type { LineData } from './use-line-data';

const LANG_OPTIONS = LANGS.map((lang) => ({ value: lang, label: lang.toUpperCase() }));
const RADIUS = { min: 30, max: 300, step: 10 } as const;
const PREVIEW_SCALE = 0.66;

interface Draft {
  name: I18nText;
  year: string;
  description: I18nText;
  radius: number;
  points: string;
  onSite: boolean;
  preview: string;
  services: StopService[];
  stampId: string | null;
  credit: string;
}

const toDraft = (stop: StopOverview, archive: Media | undefined): Draft => ({
  name: stop.name,
  year: stop.year === null ? '' : String(stop.year),
  description: stop.description,
  radius: stop.geofence_radius_m,
  points: String(stop.points),
  onSite: stop.requires_on_site,
  preview: String(stop.guest_preview_s),
  services: stop.services,
  stampId: stop.stamp_id,
  credit: archive?.credit ?? '',
});

const toInt = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

interface StopDrawerProps {
  stop: StopOverview;
  index: number;
  data: LineData;
  tab: StopTab;
  onTab: (tab: StopTab) => void;
  onClose: () => void;
}

/** A4 Éditeur d'arrêt (panneau latéral 940 px) avec aperçu de la fiche dans l'app. */
export function StopDrawer({ stop, index, data, tab, onTab, onClose }: StopDrawerProps) {
  const notify = useToast();
  const invalidate = useInvalidate();
  const supabase = getSupabase();
  const { upload, progress } = useUpload();
  const { data: stamps = [] } = useStamps();
  const { data: allStops = [] } = useStops();
  const { data: offers = [] } = useOffers();
  const { data: media } = useMedia();

  const archive = stop.archive_media_id ? data.mediaById.get(stop.archive_media_id) : undefined;
  const present = stop.present_media_id ? data.mediaById.get(stop.present_media_id) : undefined;
  const narration = data.narration.get(stop.id) ?? {};
  const [draft, setDraft] = useState<Draft>(() => toDraft(stop, archive));
  const [initial] = useState(draft);
  const [lang, setLang] = useState<Lang>(ADMIN_LANG);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  const refresh = () => invalidate(...contentKeys, queryKeys.media);
  const displayName = pickText(draft.name, ADMIN_LANG) || t('unnamedStop');
  const hasNarrationFr = Boolean(narration.fr?.video || narration.fr?.audio);
  const playable = Boolean(archive) && hasNarrationFr;
  const hasVoucher = offers.some((offer) => offer.active && offer.visible_from_stop_id === stop.id);

  async function persist(): Promise<boolean> {
    if (JSON.stringify(draft) === JSON.stringify(initial)) return true;
    const { error } = await supabase
      .from('stops')
      .update({
        name: draft.name,
        year: draft.year.trim() ? toInt(draft.year, stop.year ?? 0) : null,
        description: draft.description,
        geofence_radius_m: draft.radius,
        points: Math.max(0, toInt(draft.points, stop.points)),
        requires_on_site: draft.onSite,
        guest_preview_s: Math.max(1, toInt(draft.preview, stop.guest_preview_s)),
        services: STOP_SERVICES.filter((service) => draft.services.includes(service)),
        stamp_id: draft.stampId,
      })
      .eq('id', stop.id);
    if (error) {
      notify(errorMessage(error));
      return false;
    }
    if (archive && draft.credit !== initial.credit) {
      await supabase.from('media').update({ credit: draft.credit.trim() || null }).eq('id', archive.id);
    }
    await refresh();
    return true;
  }

  async function close() {
    if (await persist()) onClose();
  }

  async function deleteStop() {
    const { error } = await supabase.rpc('delete_stop', { p_stop_id: stop.id });
    if (error) {
      notify(errorMessage(error));
      return;
    }
    await refresh();
    notify(t('line.toasts.stopDeleted', { name: displayName }));
    onClose();
  }

  async function uploadImage(file: File, slot: 'archive' | 'present') {
    setUploadingSlot(slot);
    const uploaded = await upload(file, 'media', slot === 'archive' ? draft.credit : null);
    setUploadingSlot(null);
    if (!uploaded) return;
    const patch = slot === 'archive' ? { archive_media_id: uploaded.id } : { present_media_id: uploaded.id };
    const { error } = await supabase.from('stops').update(patch).eq('id', stop.id);
    if (error) notify(errorMessage(error));
    await refresh();
  }

  async function removePresent() {
    const { error } = await supabase.from('stops').update({ present_media_id: null }).eq('id', stop.id);
    if (error) notify(errorMessage(error));
    await refresh();
  }

  async function uploadNarration(file: File, mediaLang: Lang, kind: StopMediaKind) {
    setUploadingSlot(`${mediaLang}-${kind}`);
    const uploaded = await upload(file, 'media');
    setUploadingSlot(null);
    if (!uploaded) return;
    const { error } = await supabase
      .from('stop_media')
      .upsert({ stop_id: stop.id, lang: mediaLang, kind, media_id: uploaded.id }, { onConflict: 'stop_id,lang,kind' });
    if (error) notify(errorMessage(error));
    await refresh();
  }

  const tabs: { value: StopTab; label: string; warn: boolean }[] = [
    { value: 'infos', label: t('stop.tabs.infos'), warn: !draft.name.fr?.trim() },
    { value: 'media', label: t('stop.tabs.media'), warn: !archive || !hasNarrationFr },
    { value: 'services', label: t('stop.tabs.services'), warn: false },
    { value: 'reward', label: t('stop.tabs.reward'), warn: false },
  ];

  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open) void close();
      }}
      title={displayName}
      width={940}
    >
      <div className="flex flex-col gap-4 border-b border-admin-divider-strong px-[26px] pt-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-[30px] flex-none place-items-center rounded-full bg-red text-[13px] font-semibold leading-none text-cream">
              {index + 1}
            </span>
            <h2 className="m-0 truncate text-[22px] font-semibold leading-[1.2] tracking-[-0.015em]">{displayName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="dangerLink" onClick={deleteStop}>
              {t('stop.delete')}
            </Button>
            <Button size="drawer" onClick={() => void close()}>
              {t('stop.done')}
            </Button>
          </div>
        </div>
        <div role="tablist" className="flex gap-[22px]">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              onClick={() => onTab(item.value)}
              className={cn(
                'flex items-center gap-[7px] pt-1 pb-3 text-[14px] font-medium leading-none',
                tab === item.value ? 'text-ink shadow-[inset_0_-2px_0_var(--color-olive)]' : 'text-grey',
              )}
            >
              {item.label}
              {item.warn && <span className="block size-[7px] rounded-full bg-red" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto px-[26px] pt-[22px] pb-10">
          {tab === 'infos' && (
            <div className="flex animate-adm-in flex-col gap-[18px]">
              <div className="flex items-center justify-between gap-3">
                <span className={labelClass}>{t('stop.infos.contentLang')}</span>
                <Segmented variant="lang" label={t('stop.infos.contentLang')} options={LANG_OPTIONS} value={lang} onChange={setLang} />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
                <Field label={t('stop.infos.name', { lang: lang.toUpperCase() })} htmlFor="stop-name">
                  <input
                    id="stop-name"
                    value={draft.name[lang] ?? ''}
                    placeholder={lang === ADMIN_LANG ? t('stop.infos.namePlaceholder') : (draft.name.fr ?? '')}
                    onChange={(event) => update({ name: { ...draft.name, [lang]: event.target.value } })}
                    className={inputClass}
                  />
                </Field>
                <Field label={t('stop.infos.year')} htmlFor="stop-year">
                  <input
                    id="stop-year"
                    inputMode="numeric"
                    value={draft.year}
                    onChange={(event) => update({ year: event.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field
                label={t('stop.infos.description', { lang: lang.toUpperCase() })}
                htmlFor="stop-description"
                help={t('stop.infos.descriptionCount', { count: (draft.description[lang] ?? '').length })}
              >
                <textarea
                  id="stop-description"
                  rows={5}
                  value={draft.description[lang] ?? ''}
                  placeholder={t('stop.infos.descriptionPlaceholder')}
                  onChange={(event) => update({ description: { ...draft.description, [lang]: event.target.value } })}
                  className={cn(inputClass, 'h-auto resize-y py-[11px] leading-[1.5]')}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('stop.infos.lat')} htmlFor="stop-lat">
                  <input id="stop-lat" readOnly value={stop.lat.toFixed(5)} className={readonlyInputClass} />
                </Field>
                <Field label={t('stop.infos.lng')} htmlFor="stop-lng">
                  <input id="stop-lng" readOnly value={stop.lng.toFixed(5)} className={readonlyInputClass} />
                </Field>
              </div>
              <span className="-mt-2 text-[12px] leading-[1.4] text-grey">{t('stop.infos.positionHelp')}</span>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="stop-radius" className={labelClass}>
                    {t('stop.infos.radius')}
                  </label>
                  <span className="text-[14px] font-semibold leading-none">{t('units.meters', { value: draft.radius })}</span>
                </div>
                <input
                  id="stop-radius"
                  type="range"
                  min={RADIUS.min}
                  max={RADIUS.max}
                  step={RADIUS.step}
                  value={draft.radius}
                  onChange={(event) => update({ radius: Number(event.target.value) })}
                  className="w-full accent-olive"
                />
                <span className="text-[12px] leading-[1.4] text-grey">{t('stop.infos.radiusHelp')}</span>
              </div>
              <div className="grid grid-cols-[140px_minmax(0,1fr)] items-end gap-4">
                <Field label={t('stop.infos.points')} htmlFor="stop-points">
                  <input
                    id="stop-points"
                    type="number"
                    min={0}
                    value={draft.points}
                    onChange={(event) => update({ points: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <label className="flex min-h-10 cursor-pointer items-center gap-3">
                  <Switch checked={draft.onSite} onCheckedChange={(onSite) => update({ onSite })} label={t('stop.infos.onSite')} />
                  <span className="text-[13.5px] leading-[1.35]">{t('stop.infos.onSite')}</span>
                </label>
              </div>
            </div>
          )}

          {tab === 'media' && (
            <div className="flex animate-adm-in flex-col gap-5">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-2">
                  <span className={labelClass}>
                    {t('stop.media.archive')} <span className="text-red">*</span>
                  </span>
                  {archive ? (
                    <MediaThumb media={archive} archive className="aspect-[3/2] rounded-[8px] border-[1.5px] border-tilleul" />
                  ) : (
                    <UploadBox
                      accept={ACCEPT_ATTR.image}
                      onFile={(file) => uploadImage(file, 'archive')}
                      title={t('stop.media.archiveUpload')}
                      help={t('stop.media.archiveRequired')}
                      required
                      progress={uploadingSlot === 'archive' ? progress?.pct : undefined}
                    />
                  )}
                  <input
                    value={draft.credit}
                    disabled={!archive}
                    onChange={(event) => update({ credit: event.target.value })}
                    placeholder={t('stop.media.creditPlaceholder')}
                    className="h-9 w-full rounded-[8px] border-0 bg-cream px-2.5 text-[13px] leading-none text-ink outline-none shadow-[inset_0_0_0_1.5px_var(--color-admin-border)] focus:shadow-[inset_0_0_0_2px_var(--color-olive)] disabled:opacity-60"
                  />
                  {archive && (
                    <FilePicker accept={ACCEPT_ATTR.image} onFile={(file) => uploadImage(file, 'archive')} className={cn(linkClass, 'self-start')}>
                      {uploadingSlot === 'archive' && progress ? t('stop.media.uploading', { pct: progress.pct }) : t('replace')}
                    </FilePicker>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <span className={labelClass}>{t('stop.media.present')}</span>
                  {present ? (
                    <>
                      <MediaThumb media={present} className="aspect-[3/2] rounded-[8px] border-[1.5px] border-tilleul" />
                      <div className="flex gap-4">
                        <FilePicker accept={ACCEPT_ATTR.image} onFile={(file) => uploadImage(file, 'present')} className={linkClass}>
                          {uploadingSlot === 'present' && progress ? t('stop.media.uploading', { pct: progress.pct }) : t('replace')}
                        </FilePicker>
                        <button type="button" onClick={removePresent} className={cn(linkClass, 'text-red hover:text-red-deep')}>
                          {t('remove')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <UploadBox
                      accept={ACCEPT_ATTR.image}
                      onFile={(file) => uploadImage(file, 'present')}
                      title={t('stop.media.presentUpload')}
                      help={t('stop.media.presentHelp')}
                      progress={uploadingSlot === 'present' ? progress?.pct : undefined}
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <span className={labelClass}>{t('stop.media.narration')}</span>
                <span className="-mt-1 text-[12.5px] leading-[1.4] text-grey">{t('stop.media.narrationHelp')}</span>
                <div className="overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_var(--color-admin-border)]">
                  {LANGS.map((mediaLang) => (
                    <div key={mediaLang} className="grid grid-cols-[56px_repeat(3,minmax(0,1fr))] border-b border-admin-divider last:border-b-0">
                      <span className="grid place-items-center bg-admin-surface-alt text-[13px] font-bold leading-none text-ink">
                        {mediaLang.toUpperCase()}
                      </span>
                      {STOP_MEDIA_KINDS.map((kind) => {
                        const file = narration[mediaLang]?.[kind];
                        const required = mediaLang === 'fr' && kind !== 'subtitles' && !hasNarrationFr;
                        const slot = `${mediaLang}-${kind}`;
                        const uploading = uploadingSlot === slot && progress;
                        return (
                          <div key={kind} className="flex min-w-0 flex-col gap-[5px] border-l border-admin-divider px-3 py-[11px]">
                            <span className="text-[11.5px] font-medium leading-none tracking-[0.06em] text-olive">
                              {t(`stop.media.kinds.${kind}`)}
                            </span>
                            {uploading ? (
                              <span className="text-[12px] leading-none text-grey">{t('stop.media.uploading', { pct: progress.pct })}</span>
                            ) : file ? (
                              <>
                                <FilePicker
                                  accept={ACCEPT_ATTR[kind]}
                                  onFile={(next) => uploadNarration(next, mediaLang, kind)}
                                  className="truncate text-left text-[13px] font-medium leading-[1.25] hover:underline"
                                >
                                  {file.original_name ?? file.path}
                                </FilePicker>
                                <span className="text-[12px] leading-none text-grey">{narrationMeta(file, kind)}</span>
                              </>
                            ) : (
                              <FilePicker
                                accept={ACCEPT_ATTR[kind]}
                                onFile={(next) => uploadNarration(next, mediaLang, kind)}
                                className={cn(linkClass, 'self-start py-[3px]', required && 'text-red hover:text-red-deep')}
                              >
                                {required ? t('stop.media.uploadRequired') : t('stop.media.upload')}
                              </FilePicker>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-admin-surface-alt px-4 py-3.5">
                <div className="flex flex-col gap-1">
                  <span className="text-[13.5px] font-medium leading-[1.3]">{t('stop.media.preview')}</span>
                  <span className="text-[12.5px] leading-[1.35] text-grey">{t('stop.media.previewHelp')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    aria-label={t('stop.media.preview')}
                    value={draft.preview}
                    onChange={(event) => update({ preview: event.target.value })}
                    className={cn(inputClass, 'h-9 w-[70px] px-2.5 text-right font-medium')}
                  />
                  <span className="text-[13px] leading-none text-grey">{t('stop.media.seconds')}</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'services' && (
            <div className="flex animate-adm-in flex-col gap-3.5">
              <span className="text-[13.5px] leading-[1.45] text-grey">{t('stop.services.help')}</span>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
                {STOP_SERVICES.map((service) => {
                  const on = draft.services.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        update({ services: on ? draft.services.filter((value) => value !== service) : [...draft.services, service] })
                      }
                      className={cn(
                        'flex h-24 flex-col items-center justify-center gap-3 rounded-[10px] transition-[background,box-shadow]',
                        on
                          ? 'bg-cream shadow-[inset_0_0_0_2px_var(--color-olive)]'
                          : 'bg-admin-surface-alt shadow-[inset_0_0_0_1px_var(--color-admin-border)]',
                      )}
                    >
                      <Image src={SERVICE_ICONS[service]} alt="" className={cn('h-6 w-auto', on ? 'opacity-100' : 'opacity-25')} />
                      <span className={cn('text-[13px] font-medium leading-none', on ? 'text-ink' : 'text-grey')}>
                        {t(`stop.services.labels.${service}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'reward' && (
            <div className="flex animate-adm-in flex-col gap-3.5">
              <span className="text-[13.5px] leading-[1.45] text-grey">{t('stop.reward.help')}</span>
              <div className="flex flex-col gap-2">
                <StampChoice
                  selected={draft.stampId === null}
                  onPick={() => update({ stampId: null })}
                  visual={<div className="size-10 flex-none rounded-full shadow-[inset_0_0_0_2px_var(--color-admin-border)]" />}
                  name={t('stop.reward.none')}
                  note={t('stop.reward.noneNote')}
                />
                {stamps
                  .filter((stamp) => stamp.rule === 'stop_completed')
                  .map((stamp) => {
                    const usedBy = allStops.find((other) => other.stamp_id === stamp.id && other.id !== stop.id);
                    const image = stamp.image_media_id ? media?.byId.get(stamp.image_media_id) : null;
                    return (
                      <StampChoice
                        key={stamp.id}
                        selected={draft.stampId === stamp.id}
                        onPick={() => update({ stampId: stamp.id })}
                        visual={<StampBadge stamp={stamp} image={image} size={40} />}
                        name={pickText(stamp.name, ADMIN_LANG)}
                        note={
                          usedBy
                            ? t('stop.reward.usedBy', { stop: pickText(usedBy.name, ADMIN_LANG) || t('unnamedStop') })
                            : image
                              ? t('stop.reward.withImage')
                              : t('stop.reward.generic')
                        }
                      />
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        <StopPreview
          name={pickText(draft.name, lang) || displayName}
          description={pickText(draft.description, lang)}
          services={draft.services}
          playable={playable}
          onSite={draft.onSite}
          radius={draft.radius}
          hasVoucher={hasVoucher}
        />
      </div>
    </Drawer>
  );
}

const linkClass = 'text-[13px] font-medium leading-none text-olive underline underline-offset-[3px] hover:text-olive-text';

function narrationMeta(file: Media, kind: StopMediaKind): string {
  if (kind === 'subtitles') return t('stop.media.subtitlesMeta');
  const size = formatSize(file.size_bytes);
  return file.duration_s === null ? size : t('stop.media.fileMeta', { size, duration: formatDuration(file.duration_s) });
}

interface UploadBoxProps {
  accept: string;
  onFile: (file: File) => void;
  title: string;
  help: string;
  required?: boolean;
  progress?: number;
}

/** Zone de téléversement 3:2 (pointillés rouges si obligatoire, tilleul sinon). */
function UploadBox({ accept, onFile, title, help, required, progress }: UploadBoxProps) {
  return (
    <FilePicker
      accept={accept}
      onFile={onFile}
      className={cn(
        'flex aspect-[3/2] flex-col items-center justify-center gap-1.5 rounded-[8px] border-[1.5px] border-dashed p-2.5 text-center',
        required ? 'border-red bg-admin-missing-bg hover:bg-red-tint' : 'border-tilleul hover:bg-admin-surface-alt',
      )}
    >
      <span className={cn('text-[13px] font-medium leading-[1.3]', required ? 'text-red-deep' : 'text-olive')}>
        {progress === undefined ? title : t('stop.media.uploading', { pct: progress })}
      </span>
      <span className="text-[12px] leading-[1.3] text-grey">{help}</span>
    </FilePicker>
  );
}

interface StampChoiceProps {
  selected: boolean;
  onPick: () => void;
  visual: ReactNode;
  name: string;
  note: string;
}

function StampChoice({ selected, onPick, visual, name, note }: StampChoiceProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onPick}
      className={cn(
        'flex items-center gap-3.5 rounded-[10px] px-3.5 py-2.5 text-left',
        selected
          ? 'bg-cream shadow-[inset_0_0_0_2px_var(--color-olive)]'
          : 'bg-admin-surface-alt shadow-[inset_0_0_0_1px_var(--color-admin-divider-strong)]',
      )}
    >
      <span
        className={cn(
          'size-[18px] flex-none rounded-full',
          selected ? 'border-[5px] border-olive' : 'border-[1.5px] border-tilleul',
        )}
      />
      {visual}
      <span className="flex min-w-0 flex-col gap-[3px]">
        <span className="text-[14px] font-medium leading-[1.2]">{name}</span>
        <span className="text-[12.5px] leading-[1.2] text-grey">{note}</span>
      </span>
    </button>
  );
}

interface StopPreviewProps {
  name: string;
  description: string;
  services: StopService[];
  playable: boolean;
  onSite: boolean;
  radius: number;
  hasVoucher: boolean;
}

/** Fiche du point telle qu'affichée dans l'app (échelle 65 %), mise à jour en direct. */
function StopPreview({ name, description, services, playable, onSite, radius, hasVoucher }: StopPreviewProps) {
  const note = playable ? (onSite ? t('stop.preview.activeWithin', { radius }) : t('stop.preview.everywhere')) : t('stop.preview.incomplete');
  return (
    <div className="flex w-[300px] flex-none flex-col gap-3 overflow-x-hidden overflow-y-auto border-l border-admin-divider-strong bg-admin-page px-6 py-[22px]">
      <span className={labelClass}>{t('stop.preview.title')}</span>
      <div className="relative h-[300px] w-[252px] overflow-hidden rounded-[24px_24px_30px_30px] bg-cream shadow-[inset_0_0_0_2px_var(--color-tilleul),0_10px_30px_var(--color-admin-shadow-card)]">
        <div className="absolute top-2.5 left-[104px] h-1 w-11 rounded-[10px] bg-olive" />
        <div className="absolute top-[26px] right-[18px] left-5 flex items-center justify-between gap-2">
          <span className="text-[10px] leading-none text-ink">{t('stop.preview.distance')}</span>
          {hasVoucher && (
            <span className="h-[18px] rounded-full bg-red px-2 text-[7.5px] font-semibold leading-[18px] tracking-[0.06em] text-white">
              {t('stop.preview.voucher')}
            </span>
          )}
        </div>
        <div className="absolute top-[42px] right-[18px] left-5 truncate text-[19px] font-medium leading-[1.2] text-ink">{name}</div>
        <div className="absolute top-[76px] right-[18px] left-5 flex h-4 items-center gap-2.5">
          {STOP_SERVICES.map((service) => (
            <Image
              key={service}
              src={SERVICE_ICONS[service]}
              alt=""
              width={Math.round(SERVICE_ICONS[service].width * PREVIEW_SCALE)}
              className={cn('h-[15px] w-auto flex-none', services.includes(service) ? 'opacity-100' : 'opacity-20')}
            />
          ))}
        </div>
        <p className="absolute top-[104px] right-[18px] bottom-[100px] left-5 m-0 overflow-hidden text-[9px] leading-[1.4] text-ink">
          {description || t('stop.preview.noDescription')}
        </p>
        <div
          className={cn(
            'absolute right-5 bottom-10 left-5 flex h-[46px] items-center justify-center gap-2 rounded-[5px]',
            playable ? 'bg-olive text-cream' : 'bg-passive-bg text-passive-text shadow-[inset_0_0_0_1.5px_var(--color-passive-border)]',
          )}
        >
          <PlayIcon />
          <span className="text-[13px] leading-none">{t('stop.preview.cta')}</span>
        </div>
        <div className={cn('absolute inset-x-0 bottom-[22px] text-center text-[8.5px] leading-none', playable ? 'text-olive' : 'text-red')}>
          {note}
        </div>
      </div>
      <span className="text-[12px] leading-[1.45] text-grey">{t('stop.preview.caption')}</span>
    </div>
  );
}
