'use client';

import { LANGS, pickText, STAMP_RULES, type I18nText, type Lang, type Media, type Stamp, type StampRule } from '@llds/shared';
import { useState } from 'react';

import { FilePicker } from '@/components/file-picker';
import { MediaThumb } from '@/components/media-thumb';
import { StampBadge } from '@/components/stamp-badge';
import { Button } from '@/components/ui/button';
import { cardClass } from '@/components/ui/card';
import { Field, inputClass, labelClass } from '@/components/ui/field';
import { PlusIcon } from '@/components/ui/icons';
import { Modal } from '@/components/ui/overlay';
import { PageHeader } from '@/components/ui/page-header';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { contentKeys, queryKeys, useInvalidate, useLines, useMedia, useOffers, useStamps, useStops } from '@/lib/data';
import { errorMessage } from '@/lib/errors';
import { ADMIN_LANG, t } from '@/lib/i18n';
import { getSupabase } from '@/lib/supabase/client';
import { useUpload } from '@/lib/use-upload';
import { cn } from '@/lib/utils';

const LANG_OPTIONS = LANGS.map((lang) => ({ value: lang, label: lang.toUpperCase() }));
const BADGE_SIZE = 96;

type Editing = { mode: 'create' } | { mode: 'edit'; stamp: Stamp };

/** A5 Cachets : grille, règle d'attribution et usage par les avantages. */
export function StampsPage() {
  const { data: stamps = [] } = useStamps();
  const { data: media } = useMedia();
  const { data: stops = [] } = useStops();
  const { data: lines = [] } = useLines();
  const { data: offers = [] } = useOffers();
  const [editing, setEditing] = useState<Editing | null>(null);

  function ruleText(stamp: Stamp): string {
    switch (stamp.rule) {
      case 'stop_completed': {
        const names = stops
          .filter((stop) => stop.stamp_id === stamp.id)
          .map((stop) => pickText(stop.name, ADMIN_LANG) || t('unnamedStop'));
        return names.length ? t('stamps.rule.stop_completed', { stops: names.join(', ') }) : t('stamps.rule.stopUnassigned');
      }
      case 'line_completed':
        return t('stamps.rule.line_completed', { line: lines.find((line) => line.id === stamp.line_id)?.code ?? '' });
      case 'points_threshold':
        return t('stamps.rule.points_threshold', { points: stamp.points_threshold ?? 0 });
    }
  }

  return (
    <div className="flex max-w-[1180px] animate-adm-in flex-col gap-[22px]">
      <PageHeader
        title={t('stamps.title')}
        subtitle={t('stamps.subtitle')}
        actions={
          <Button onClick={() => setEditing({ mode: 'create' })}>
            <PlusIcon />
            {t('stamps.new')}
          </Button>
        }
      />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3.5">
        {stamps.map((stamp) => {
          const image = stamp.image_media_id ? media?.byId.get(stamp.image_media_id) : null;
          const offerCount = offers.filter((offer) => offer.required_stamp_id === stamp.id).length;
          const tag = !image
            ? t('stamps.tag.noImage')
            : offerCount
              ? t('stamps.tag.offers', { count: offerCount })
              : t('stamps.tag.withImage');
          return (
            <button
              key={stamp.id}
              type="button"
              onClick={() => setEditing({ mode: 'edit', stamp })}
              className={cn(
                cardClass,
                'flex flex-col items-center gap-3 px-[18px] pt-[22px] pb-[18px] text-center transition-shadow hover:shadow-[inset_0_0_0_1.5px_var(--color-tilleul)]',
              )}
            >
              <StampBadge stamp={stamp} image={image} size={BADGE_SIZE} />
              <span className="text-[15px] font-semibold leading-[1.2] text-ink">{pickText(stamp.name, ADMIN_LANG)}</span>
              <span className="text-[12.5px] leading-[1.35] text-grey">{ruleText(stamp)}</span>
              <span
                className={cn(
                  'h-6 rounded-full px-2.5 text-[11.5px] font-medium leading-6',
                  image ? 'bg-tilleul-light text-olive-text' : 'bg-red-tint text-red-deep',
                )}
              >
                {tag}
              </span>
            </button>
          );
        })}
      </div>
      {stamps.length === 0 && <p className="text-[14px] text-grey">{t('stamps.empty')}</p>}
      {editing && (
        <StampModal
          key={editing.mode === 'edit' ? editing.stamp.id : 'new'}
          editing={editing}
          image={editing.mode === 'edit' && editing.stamp.image_media_id ? media?.byId.get(editing.stamp.image_media_id) : null}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

interface StampModalProps {
  editing: Editing;
  image: Media | null | undefined;
  onClose: () => void;
}

/** A5b Nouveau cachet (ou modification) : image optionnelle, nom en 3 langues, règle d'attribution. */
function StampModal({ editing, image, onClose }: StampModalProps) {
  const notify = useToast();
  const invalidate = useInvalidate();
  const { upload, progress } = useUpload();
  const { data: lines = [] } = useLines();
  const existing = editing.mode === 'edit' ? editing.stamp : null;

  const [lang, setLang] = useState<Lang>(ADMIN_LANG);
  const [name, setName] = useState<I18nText>(existing?.name ?? {});
  const [rule, setRule] = useState<StampRule>(existing?.rule ?? 'stop_completed');
  const [lineId, setLineId] = useState<string | null>(existing?.line_id ?? null);
  const [threshold, setThreshold] = useState(existing?.points_threshold ? String(existing.points_threshold) : '');
  const [imageMedia, setImageMedia] = useState<Media | null | undefined>(image);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pickImage(file: File) {
    const uploaded = await upload(file, 'media-public');
    if (uploaded) setImageMedia(uploaded);
  }

  async function save() {
    const points = Number.parseInt(threshold, 10);
    if (!name.fr?.trim()) return setError(t('stamps.validation.name'));
    if (rule === 'line_completed' && !lineId) return setError(t('stamps.validation.line'));
    if (rule === 'points_threshold' && !(points > 0)) return setError(t('stamps.validation.threshold'));
    setError(null);
    setBusy(true);
    const row = {
      name,
      rule,
      image_media_id: imageMedia?.id ?? null,
      line_id: rule === 'stop_completed' ? null : lineId,
      points_threshold: rule === 'points_threshold' ? points : null,
    };
    const supabase = getSupabase();
    const { error: saveError } = existing
      ? await supabase.from('stamps').update(row).eq('id', existing.id)
      : await supabase.from('stamps').insert(row);
    setBusy(false);
    if (saveError) return notify(errorMessage(saveError));
    await invalidate(queryKeys.stamps, ...contentKeys);
    notify(existing ? t('stamps.toasts.saved') : t('stamps.toasts.created'));
    onClose();
  }

  async function remove() {
    if (!existing) return;
    setBusy(true);
    const { error: deleteError } = await getSupabase().from('stamps').delete().eq('id', existing.id);
    setBusy(false);
    if (deleteError) return notify(errorMessage(deleteError));
    await invalidate(queryKeys.stamps, queryKeys.offers, ...contentKeys);
    notify(t('stamps.toasts.deleted'));
    onClose();
  }

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={existing ? t('stamps.modal.editTitle') : t('stamps.modal.createTitle')}
    >
      <div className="flex items-center gap-4">
        <FilePicker
          accept=".png,.webp"
          onFile={pickImage}
          label={t('stamps.modal.image')}
          className="grid size-24 flex-none place-items-center overflow-hidden rounded-full border-[1.5px] border-dashed border-tilleul p-2.5 text-center text-[11.5px] font-medium leading-[1.3] text-olive"
        >
          {progress ? (
            `${progress.pct} %`
          ) : imageMedia ? (
            <MediaThumb media={imageMedia} fit="contain" className="size-[72px]" />
          ) : (
            t('stamps.modal.image')
          )}
        </FilePicker>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="stamp-name" className={labelClass}>
              {t('stamps.modal.name', { lang: lang.toUpperCase() })}
            </label>
            <Segmented variant="lang" label={t('stamps.modal.name', { lang: '' })} options={LANG_OPTIONS} value={lang} onChange={setLang} />
          </div>
          <input
            id="stamp-name"
            value={name[lang] ?? ''}
            placeholder={lang === ADMIN_LANG ? t('stamps.modal.namePlaceholder') : (name.fr ?? '')}
            onChange={(event) => setName({ ...name, [lang]: event.target.value })}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className={labelClass}>{t('stamps.modal.rule')}</span>
        {STAMP_RULES.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rule === value}
            onClick={() => setRule(value)}
            className={cn(
              'flex items-center gap-3 rounded-[8px] px-3.5 py-[11px] text-left',
              rule === value
                ? 'bg-cream shadow-[inset_0_0_0_2px_var(--color-olive)]'
                : 'bg-admin-surface-alt shadow-[inset_0_0_0_1px_var(--color-admin-divider-strong)]',
            )}
          >
            <span
              className={cn(
                'size-[18px] flex-none rounded-full',
                rule === value ? 'border-[5px] border-olive' : 'border-[1.5px] border-tilleul',
              )}
            />
            <span className="text-[14px] leading-[1.3]">{t(`stamps.modal.rules.${value}`)}</span>
          </button>
        ))}
      </div>
      {rule === 'stop_completed' && <p className="m-0 text-[12.5px] leading-[1.4] text-grey">{t('stamps.modal.stopHint')}</p>}
      {rule === 'line_completed' && (
        <Field label={t('stamps.modal.line')} htmlFor="stamp-line">
          <Select
            id="stamp-line"
            value={lineId}
            onChange={setLineId}
            placeholder={t('stamps.modal.linePlaceholder')}
            options={lines.map((line) => ({ value: line.id, label: `${line.code} · ${pickText(line.name, ADMIN_LANG)}` }))}
          />
        </Field>
      )}
      {rule === 'points_threshold' && (
        <Field label={t('stamps.modal.threshold')} htmlFor="stamp-threshold">
          <div className="flex items-center gap-2">
            <input
              id="stamp-threshold"
              type="number"
              min={1}
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
              className={cn(inputClass, 'w-[120px] text-right')}
            />
            <span className="text-[13px] text-grey">{t('stamps.modal.thresholdUnit')}</span>
          </div>
        </Field>
      )}
      {error && (
        <p role="alert" className="m-0 text-[13px] text-red-deep">
          {error}
        </p>
      )}
      <div className="mt-1 flex items-center justify-between gap-2.5">
        {existing ? (
          <Button variant="dangerLink" onClick={remove} disabled={busy}>
            {t('delete')}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2.5">
          <Button variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={save} disabled={busy}>
            {existing ? t('save') : t('stamps.modal.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
