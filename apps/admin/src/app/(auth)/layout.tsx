import Image from 'next/image';

import logo from '@llds/assets/brand/logo-llds-positif.png';

import { t } from '@/lib/i18n';

/** A0 — carte centrée sur le fond du dashboard. */
export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="grid min-h-screen place-items-center bg-admin-page px-5 py-10">
      <div className="relative flex w-full max-w-[420px] animate-adm-in flex-col gap-[22px] rounded-[14px] bg-cream px-10 pt-11 pb-10 shadow-[0_1px_0_var(--color-admin-border),0_18px_50px_var(--color-admin-shadow-soft)]">
        <Image src={logo} alt={t('logoAlt')} width={220} priority className="block h-auto w-[220px]" />
        {children}
      </div>
    </div>
  );
}
