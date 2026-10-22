'use client';

import { LANGS, type I18nText, type Lang, type Media, type Partner } from '@llds/shared';
import { useState } from 'react';

import { FilePicker } from '@/components/file-picker';
import { MediaThumb } from '@/components/media-thumb';
import { Button } from '@/components/ui/button';
import { Field, inputClass, labelClass } from '@/components/ui/field';
import { Drawer } from '@/components/ui/overlay';
import { Segmented } from '@/components/ui/segmented';
import { useToast } from '@/components/ui/toast';
import { queryKeys, useInvalidate, useMedia } from '@/lib/data';
import { errorMessage } from '@/lib/errors';
import { ADMIN_LANG, t } from '@/lib/i18n';
import { getSupabase } from '@/lib/supabase/client';
import { ACCEPT_ATTR } from '@/lib/upload';
import { useUpload } from '@/lib/use-upload';

const LANG_OPTIONS = LANGS.map((lang) => ({ value: lang, label: lang.toUpperCase() }));

/** Partenaire (pas de maquette : même style que l'éditeur d'avantage). */
export function PartnerDrawer({ partner, onClose }: { partner: Partner | null; onClose: () => void }) {
  const notify = useToast();
  const invalidate = useInvalidate();
  const { upload, progress } = useUpload();
  const { data: media } = useMedia();
  const initial = (id: string | null | undefined) => (id ? media?.byId.get(id) : null);

  const [lang, setLang] = useState<Lang>(ADMIN_LANG);
  const [name, setName] = useState(partner?.name ?? '');
  const [address, setAddress] = useState(partner?.address ?? '');
  const [city, setCity] = useState(partner?.city ?? '');
  const [hours, setHours] = useState<I18nText>(partner?.opening_hours ?? {});
  const [photo, setPhoto] = useState<Media | null | undefined>(initial(partner?.photo_media_id));
  const [logo, setLogo] = useState<Media | null | undefined>(initial(partner?.logo_media_id));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) return setError(t('partners.partnerDrawer.validation.name'));
    setError(null);
    setBusy(true);
    const row = {
      name: name.trim(),
      address: address.trim() || null,
      city: city.trim() || null,
      opening_hours: hours,
      photo_media_id: photo?.id ?? null,
      logo_media_id: logo?.id ?? null,
    };
    const supabase = getSupabase();
    const { error: saveError } = partner
      ? await supabase.from('partners').update(row).eq('id', partner.id)
      : await supabase.from('partners').insert(row);
    setBusy(false);
    if (saveError) return notify(errorMessage(saveError));
    await invalidate(queryKeys.partners, queryKeys.mediaUsages, queryKeys.events);
    notify(t('partners.toasts.partnerSaved'));
    onClose();
  }

  async function remove() {
    if (!partner) return;
    const { error: deleteError } = await getSupabase().from('partners').delete().eq('id', partner.id);
    if (deleteError) return notify(errorMessage(deleteError));
    await invalidate(queryKeys.partners, queryKeys.offers, queryKeys.mediaUsages);
    notify(t('partners.toasts.partnerDeleted'));
    onClose();
  }

  const title = partner ? t('partners.partnerDrawer.title', { name: partner.name }) : t('partners.partnerDrawer.newTitle');

  return (
    <Drawer open onOpenChange={(open) => !open && onClose()} title={title} width={820}>
      <div className="flex items-center justify-between gap-4 border-b border-admin-divider-strong px-[26px] py-5">
        <h2 className="m-0 truncate text-[22px] font-semibold leading-[1.2] tracking-[-0.015em]">{title}</h2>
        <div className="flex items-center gap-2">
          {partner && (
            <Button variant="dangerLink" onClick={remove}>
              {t('delete')}
            </Button>
          )}
          <Button size="drawer" onClick={save} disabled={busy}>
            {t('save')}
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-[26px] pt-[22px] pb-10">
        <Field label={t('partners.partnerDrawer.name')} htmlFor="partner-name" error={error}>
          <input
            id="partner-name"
            value={name}
            placeholder={t('partners.partnerDrawer.namePlaceholder')}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={error ? true : undefined}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
          <Field label={t('partners.partnerDrawer.address')} htmlFor="partner-address">
            <input
              id="partner-address"
              value={address}
              placeholder={t('partners.partnerDrawer.addressPlaceholder')}
              onChange={(event) => setAddress(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t('partners.partnerDrawer.city')} htmlFor="partner-city" help={t('partners.partnerDrawer.cityHelp')}>
            <input id="partner-city" value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="partner-hours" className={labelClass}>
              {t('partners.partnerDrawer.hours', { lang: lang.toUpperCase() })}
            </label>
            <Segmented variant="lang" label={t('stop.infos.contentLang')} options={LANG_OPTIONS} value={lang} onChange={setLang} />
          </div>
          <input
            id="partner-hours"
            value={hours[lang] ?? ''}
            placeholder={lang === ADMIN_LANG ? t('partners.partnerDrawer.hoursPlaceholder') : (hours.fr ?? '')}
            onChange={(event) => setHours({ ...hours, [lang]: event.target.value })}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <ImageSlot
            label={t('partners.partnerDrawer.photo')}
            uploadLabel={t('partners.partnerDrawer.photoUpload')}
            media={photo}
            progress={progress?.pct}
            onFile={async (file) => setPhoto((await upload(file, 'media-public')) ?? photo)}
          />
          <ImageSlot
            label={t('partners.partnerDrawer.logo')}
            uploadLabel={t('partners.partnerDrawer.logoUpload')}
            media={logo}
            fit="contain"
            progress={progress?.pct}
            onFile={async (file) => setLogo((await upload(file, 'media-public')) ?? logo)}
          />
        </div>
      </div>
    </Drawer>
  );
}

interface ImageSlotProps {
  label: string;
  uploadLabel: string;
  media: Media | null | undefined;
  fit?: 'cover' | 'contain';
  progress?: number;
  onFile: (file: File) => void;
}

function ImageSlot({ label, uploadLabel, media, fit, progress, onFile }: ImageSlotProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>{label}</span>
      <FilePicker
        accept={ACCEPT_ATTR.image}
        onFile={onFile}
        className="aspect-[3/2] overflow-hidden rounded-[8px] border-[1.5px] border-dashed border-tilleul hover:bg-admin-surface-alt"
      >
        {media ? (
          <MediaThumb media={media} fit={fit} className="size-full" />
        ) : (
          <span className="text-[13px] font-medium leading-[1.3] text-olive">
            {progress === undefined ? uploadLabel : `${progress} %`}
          </span>
        )}
      </FilePicker>
    </div>
  );
}
