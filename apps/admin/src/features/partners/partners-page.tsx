'use client';

import { pickText, type Offer, type Partner } from '@llds/shared';
import { useState } from 'react';

import { MediaThumb } from '@/components/media-thumb';
import { Button } from '@/components/ui/button';
import { Card, cardClass, SectionTitle } from '@/components/ui/card';
import { PlusIcon } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { queryKeys, useInvalidate, useMedia, useOffers, usePartners, useStamps, useStops } from '@/lib/data';
import { errorMessage } from '@/lib/errors';
import { formatDayMonth, formatShortDate } from '@/lib/format';
import { ADMIN_LANG, t } from '@/lib/i18n';
import { getSupabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

import { OfferDrawer } from './offer-drawer';
import { PartnerDrawer } from './partner-drawer';

const OFFER_GRID = 'grid-cols-[minmax(240px,2fr)_150px_150px_150px_90px]';

type Panel = { kind: 'offer'; offer: Offer | null } | { kind: 'partner'; partner: Partner | null };

/** « 01/04 → 31/10/2026 » ; bornes ouvertes gérées. */
function validityText(offer: Offer): string {
  const { valid_from: from, valid_until: until } = offer;
  if (from && until) {
    const sameYear = from.slice(0, 4) === until.slice(0, 4);
    return t('partners.offers.validityRange', {
      from: sameYear ? formatDayMonth(from) : formatShortDate(from),
      to: formatShortDate(until),
    });
  }
  if (from) return t('partners.offers.validFrom', { date: formatShortDate(from) });
  if (until) return t('partners.offers.validUntil', { date: formatShortDate(until) });
  return t('partners.offers.always');
}

/** A6 Partenaires & avantages. */
export function PartnersPage() {
  const notify = useToast();
  const invalidate = useInvalidate();
  const { data: offers = [] } = useOffers();
  const { data: partners = [] } = usePartners();
  const { data: stamps = [] } = useStamps();
  const { data: stops = [] } = useStops();
  const { data: media } = useMedia();
  const [panel, setPanel] = useState<Panel | null>(null);

  const partnerOf = (offer: Offer) => partners.find((partner) => partner.id === offer.partner_id);
  const mediaOf = (id: string | null) => (id ? media?.byId.get(id) : null);

  async function toggle(offer: Offer, active: boolean) {
    const { error } = await getSupabase().from('offers').update({ active }).eq('id', offer.id);
    if (error) notify(errorMessage(error));
    await invalidate(queryKeys.offers, queryKeys.events);
  }

  return (
    <div className="flex max-w-[1180px] animate-adm-in flex-col gap-[22px]">
      <PageHeader
        title={t('partners.title')}
        subtitle={t('partners.subtitle')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setPanel({ kind: 'partner', partner: null })}>
              {t('partners.newPartner')}
            </Button>
            <Button onClick={() => setPanel({ kind: 'offer', offer: null })}>
              <PlusIcon />
              {t('partners.newOffer')}
            </Button>
          </>
        }
      />

      <Card className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="border-b border-admin-divider-strong px-5 py-4">
            <SectionTitle>{t('partners.offers.title')}</SectionTitle>
          </div>
          <div
            className={cn(
              'grid items-center gap-3.5 border-b border-admin-divider-strong px-5 py-[11px] text-[12px] font-medium leading-none tracking-[0.07em] text-olive',
              OFFER_GRID,
            )}
          >
            <span>{t('partners.offers.columns.offer')}</span>
            <span>{t('partners.offers.columns.stamp')}</span>
            <span>{t('partners.offers.columns.stop')}</span>
            <span>{t('partners.offers.columns.validity')}</span>
            <span>{t('partners.offers.columns.active')}</span>
          </div>
          {offers.map((offer) => {
            const partner = partnerOf(offer);
            const stamp = stamps.find((item) => item.id === offer.required_stamp_id);
            const stop = stops.find((item) => item.id === offer.visible_from_stop_id);
            return (
              <div key={offer.id} className={cn('grid items-center gap-3.5 border-b border-admin-divider px-5 py-3', OFFER_GRID)}>
                <button
                  type="button"
                  onClick={() => setPanel({ kind: 'offer', offer })}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <MediaThumb media={mediaOf(partner?.photo_media_id ?? null)} className="size-12 flex-none rounded-[6px] bg-tilleul-light" />
                  <span className="flex min-w-0 flex-col gap-[3px]">
                    <span className="text-[14px] font-medium leading-[1.25] text-ink">{partner?.name}</span>
                    <span className="truncate text-[13px] leading-[1.25] text-grey">{pickText(offer.title, ADMIN_LANG)}</span>
                  </span>
                </button>
                <span className="text-[13.5px] leading-[1.3]">{stamp ? pickText(stamp.name, ADMIN_LANG) : t('noValue')}</span>
                <span className="text-[13.5px] leading-[1.3]">
                  {stop ? pickText(stop.name, ADMIN_LANG) || t('unnamedStop') : t('noValue')}
                </span>
                <span className="text-[13px] leading-[1.3] text-grey">{validityText(offer)}</span>
                <Switch checked={offer.active} onCheckedChange={(active) => toggle(offer, active)} label={t('partners.offers.activeLabel')} />
              </div>
            );
          })}
          {offers.length === 0 && <p className="m-0 px-5 py-5 text-[14px] text-grey">{t('partners.offers.empty')}</p>}
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t('partners.list.title')}</SectionTitle>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
          {partners.map((partner) => {
            const count = offers.filter((offer) => offer.partner_id === partner.id).length;
            return (
              <button
                key={partner.id}
                type="button"
                onClick={() => setPanel({ kind: 'partner', partner })}
                className={cn(cardClass, 'flex gap-3.5 p-3.5 text-left transition-shadow hover:shadow-[inset_0_0_0_1.5px_var(--color-tilleul)]')}
              >
                <MediaThumb media={mediaOf(partner.photo_media_id)} className="size-[86px] flex-none rounded-[8px] bg-tilleul-light" />
                <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
                  <span className="text-[14.5px] font-semibold leading-[1.25]">{partner.name}</span>
                  {partner.address && <span className="text-[13px] leading-[1.35] text-grey">{partner.address}</span>}
                  <span className="text-[13px] leading-[1.35] text-grey">{pickText(partner.opening_hours, ADMIN_LANG)}</span>
                  <span className="mt-0.5 text-[12.5px] font-medium leading-none text-olive">
                    {t('partners.list.offers', { count })}
                  </span>
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setPanel({ kind: 'partner', partner: null })}
            className="grid min-h-[114px] place-items-center rounded-[10px] border-[1.5px] border-dashed border-tilleul text-[13.5px] font-medium leading-none text-olive hover:bg-admin-surface-alt"
          >
            {t('partners.list.add')}
          </button>
        </div>
      </section>

      {panel?.kind === 'offer' && (
        <OfferDrawer key={panel.offer?.id ?? 'new'} offer={panel.offer} onClose={() => setPanel(null)} />
      )}
      {panel?.kind === 'partner' && (
        <PartnerDrawer key={panel.partner?.id ?? 'new'} partner={panel.partner} onClose={() => setPanel(null)} />
      )}
    </div>
  );
}
