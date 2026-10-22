'use client';

import { LANGS, pickText, type I18nText, type Lang, type Offer } from '@llds/shared';
import { useState } from 'react';

import { MediaThumb } from '@/components/media-thumb';
import { StampBadge } from '@/components/stamp-badge';
import { Button } from '@/components/ui/button';
import { Field, inputClass, labelClass } from '@/components/ui/field';
import { Drawer } from '@/components/ui/overlay';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { queryKeys, useInvalidate, useLines, useMedia, usePartners, useStamps, useStops } from '@/lib/data';
import { errorMessage } from '@/lib/errors';
import { ADMIN_LANG, t } from '@/lib/i18n';
import { getSupabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const LANG_OPTIONS = LANGS.map((lang) => ({ value: lang, label: lang.toUpperCase() }));

interface Draft {
  partnerId: string | null;
  title: I18nText;
  description: I18nText;
  conditions: I18nText;
  stampId: string | null;
  stopId: string | null;
  from: string;
  until: string;
  active: boolean;
}

/** A6b Éditeur d'avantage (panneau 820 px) avec aperçu du bon. */
export function OfferDrawer({ offer, onClose }: { offer: Offer | null; onClose: () => void }) {
  const notify = useToast();
  const invalidate = useInvalidate();
  const { data: partners = [] } = usePartners();
  const { data: stamps = [] } = useStamps();
  const { data: stops = [] } = useStops();
  const { data: lines = [] } = useLines();
  const { data: media } = useMedia();

  const [lang, setLang] = useState<Lang>(ADMIN_LANG);
  const [draft, setDraft] = useState<Draft>({
    partnerId: offer?.partner_id ?? null,
    title: offer?.title ?? {},
    description: offer?.description ?? {},
    conditions: offer?.conditions ?? {},
    stampId: offer?.required_stamp_id ?? null,
    stopId: offer?.visible_from_stop_id ?? null,
    from: offer?.valid_from ?? '',
    until: offer?.valid_until ?? '',
    active: offer?.active ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const partner = partners.find((item) => item.id === draft.partnerId);
  const stamp = stamps.find((item) => item.id === draft.stampId);
  const mediaOf = (id: string | null | undefined) => (id ? media?.byId.get(id) : null);
  const stopOptions = stops.map((stop) => ({
    value: stop.id,
    label: t('partners.offerDrawer.stopOption', {
      line: lines.find((line) => line.id === stop.line_id)?.code ?? '',
      stop: pickText(stop.name, ADMIN_LANG) || t('unnamedStop'),
    }),
  }));

  async function save() {
    if (!draft.partnerId) return setError(t('partners.offerDrawer.validation.partner'));
    if (!draft.title.fr?.trim()) return setError(t('partners.offerDrawer.validation.title'));
    if (draft.from && draft.until && draft.until < draft.from) return setError(t('partners.offerDrawer.validation.dates'));
    setError(null);
    setBusy(true);
    const row = {
      partner_id: draft.partnerId,
      title: draft.title,
      description: draft.description,
      conditions: draft.conditions,
      required_stamp_id: draft.stampId,
      visible_from_stop_id: draft.stopId,
      valid_from: draft.from || null,
      valid_until: draft.until || null,
      active: draft.active,
    };
    const supabase = getSupabase();
    const { error: saveError } = offer
      ? await supabase.from('offers').update(row).eq('id', offer.id)
      : await supabase.from('offers').insert(row);
    setBusy(false);
    if (saveError) return notify(errorMessage(saveError));
    await invalidate(queryKeys.offers, queryKeys.events);
    notify(t('partners.toasts.offerSaved'));
    onClose();
  }

  async function remove() {
    if (!offer) return;
    const { error: deleteError } = await getSupabase().from('offers').delete().eq('id', offer.id);
    if (deleteError) return notify(errorMessage(deleteError));
    await invalidate(queryKeys.offers);
    notify(t('partners.toasts.offerDeleted'));
    onClose();
  }

  const title = partner ? t('partners.offerDrawer.title', { partner: partner.name }) : t('partners.offerDrawer.newTitle');

  return (
    <Drawer open onOpenChange={(open) => !open && onClose()} title={title} width={820}>
      <div className="flex items-center justify-between gap-4 border-b border-admin-divider-strong px-[26px] py-5">
        <h2 className="m-0 truncate text-[22px] font-semibold leading-[1.2] tracking-[-0.015em]">{title}</h2>
        <div className="flex items-center gap-2">
          {offer && (
            <Button variant="dangerLink" onClick={remove}>
              {t('delete')}
            </Button>
          )}
          <Button size="drawer" onClick={save} disabled={busy}>
            {t('save')}
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-[26px] pt-[22px] pb-10">
          <Field label={t('partners.offerDrawer.partner')} htmlFor="offer-partner">
            <Select
              id="offer-partner"
              value={draft.partnerId}
              onChange={(partnerId) => update({ partnerId })}
              placeholder={t('partners.offerDrawer.partnerPlaceholder')}
              options={partners.map((item) => ({ value: item.id, label: item.name }))}
              invalid={error === t('partners.offerDrawer.validation.partner')}
            />
          </Field>
          <div className="flex items-center justify-end">
            <Segmented variant="lang" label={t('stop.infos.contentLang')} options={LANG_OPTIONS} value={lang} onChange={setLang} />
          </div>
          <Field label={t('partners.offerDrawer.offerTitle', { lang: lang.toUpperCase() })} htmlFor="offer-title">
            <input
              id="offer-title"
              value={draft.title[lang] ?? ''}
              placeholder={lang === ADMIN_LANG ? '' : (draft.title.fr ?? '')}
              onChange={(event) => update({ title: { ...draft.title, [lang]: event.target.value } })}
              className={inputClass}
            />
          </Field>
          <Field label={t('partners.offerDrawer.description', { lang: lang.toUpperCase() })} htmlFor="offer-description">
            <textarea
              id="offer-description"
              rows={3}
              value={draft.description[lang] ?? ''}
              onChange={(event) => update({ description: { ...draft.description, [lang]: event.target.value } })}
              className={cn(inputClass, 'h-auto resize-y py-[11px] leading-[1.5]')}
            />
          </Field>
          <Field label={t('partners.offerDrawer.conditions', { lang: lang.toUpperCase() })} htmlFor="offer-conditions">
            <textarea
              id="offer-conditions"
              rows={3}
              value={draft.conditions[lang] ?? ''}
              onChange={(event) => update({ conditions: { ...draft.conditions, [lang]: event.target.value } })}
              className={cn(inputClass, 'h-auto resize-y py-[11px] leading-[1.5]')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('partners.offerDrawer.stamp')} htmlFor="offer-stamp">
              <Select
                id="offer-stamp"
                value={draft.stampId}
                onChange={(stampId) => update({ stampId })}
                placeholder={t('partners.offerDrawer.stampNone')}
                emptyLabel={t('partners.offerDrawer.stampNone')}
                options={stamps.map((item) => ({ value: item.id, label: pickText(item.name, ADMIN_LANG) }))}
              />
            </Field>
            <Field label={t('partners.offerDrawer.stop')} htmlFor="offer-stop">
              <Select
                id="offer-stop"
                value={draft.stopId}
                onChange={(stopId) => update({ stopId })}
                placeholder={t('partners.offerDrawer.stopNone')}
                emptyLabel={t('partners.offerDrawer.stopNone')}
                options={stopOptions}
              />
            </Field>
            <Field label={t('partners.offerDrawer.from')} htmlFor="offer-from">
              <input
                id="offer-from"
                type="date"
                value={draft.from}
                onChange={(event) => update({ from: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label={t('partners.offerDrawer.to')} htmlFor="offer-to">
              <input
                id="offer-to"
                type="date"
                value={draft.until}
                onChange={(event) => update({ until: event.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <Switch checked={draft.active} onCheckedChange={(active) => update({ active })} label={t('partners.offerDrawer.active')} />
            <span className="text-[13.5px] leading-[1.35]">{t('partners.offerDrawer.active')}</span>
          </label>
          {error && (
            <p role="alert" className="m-0 text-[13px] text-red-deep">
              {error}
            </p>
          )}
        </div>

        <div className="flex w-[300px] flex-none flex-col gap-3 border-l border-admin-divider-strong bg-admin-page px-6 py-[22px]">
          <span className={labelClass}>{t('partners.offerDrawer.preview')}</span>
          <div className="relative h-[420px] w-[252px] overflow-hidden rounded-[18px] bg-cream shadow-[inset_0_0_0_2px_var(--color-olive),0_10px_30px_var(--color-admin-shadow-card)]">
            <MediaThumb media={mediaOf(partner?.photo_media_id)} className="h-[140px] w-full bg-tilleul-light" />
            <div className="flex flex-col gap-2 px-[18px] pt-3.5">
              <span className="text-[14px] font-bold italic leading-[1.2]">{partner?.name}</span>
              <span className="text-[9.5px] leading-[1.4]">
                <i className="font-semibold">{partner?.address}</i>
                <br />
                {partner ? pickText(partner.opening_hours, lang) : ''}
              </span>
              <span className="text-[9.5px] leading-[1.4]">{pickText(draft.description, lang)}</span>
              {pickText(draft.conditions, lang) && (
                <span className="text-[8.5px] leading-[1.45] text-grey">
                  {t('partners.offerDrawer.conditionsPrefix', { text: pickText(draft.conditions, lang) })}
                </span>
              )}
            </div>
            {stamp && (
              <div className="absolute bottom-3.5 left-4 opacity-[0.28]">
                <StampBadge stamp={stamp} image={mediaOf(stamp.image_media_id)} size={50} />
              </div>
            )}
            <MediaThumb
              media={mediaOf(partner?.logo_media_id)}
              fit="contain"
              className="absolute right-3.5 bottom-3 h-[54px] w-[72px] bg-right"
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}
