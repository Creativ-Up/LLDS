'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ComponentType, SVGProps } from 'react';

import logo from '@llds/assets/brand/logo-llds-positif.png';

import {
  DashboardIcon,
  LinesIcon,
  LogoutIcon,
  MediaIcon,
  PartnersIcon,
  SettingsIcon,
  StampsIcon,
  UsersIcon,
} from '@/components/ui/icons';
import { useMe } from '@/lib/data';
import { initials } from '@/lib/format';
import { t } from '@/lib/i18n';
import { ROUTES } from '@/lib/routes';
import { getSupabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV: NavItem[] = [
  { href: ROUTES.dashboard, label: t('nav.dashboard'), Icon: DashboardIcon },
  { href: ROUTES.lines, label: t('nav.lines'), Icon: LinesIcon },
  { href: ROUTES.stamps, label: t('nav.stamps'), Icon: StampsIcon },
  { href: ROUTES.partners, label: t('nav.partners'), Icon: PartnersIcon },
  { href: ROUTES.media, label: t('nav.media'), Icon: MediaIcon },
  { href: ROUTES.users, label: t('nav.users'), Icon: UsersIcon },
  { href: ROUTES.settings, label: t('nav.settings'), Icon: SettingsIcon },
];

function isActive(pathname: string, href: string): boolean {
  return href === ROUTES.dashboard ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Navigation latérale 236 px, fixe (docs/ADMIN.md § Navigation latérale). */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useMe();
  const displayName = me?.firstName || me?.email || '';

  async function logout() {
    await getSupabase().auth.signOut();
    router.replace(ROUTES.login);
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-screen w-[236px] flex-none flex-col gap-6 self-start border-r border-admin-border bg-cream px-3.5 pt-[22px] pb-[18px]">
      <div className="flex flex-col gap-2 px-2">
        <Image src={logo} alt={t('logoAlt')} width={168} priority className="block h-auto w-[168px]" />
        <span className="text-[11px] font-medium leading-none tracking-[0.12em] text-olive">{t('brandShort')}</span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center gap-3 rounded-[8px] px-3 text-[14px] font-medium leading-none no-underline transition-colors',
                active ? 'bg-tilleul-light text-ink hover:text-ink' : 'text-admin-nav-text hover:bg-admin-nav-hover hover:text-admin-nav-text',
              )}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 border-t border-admin-divider-strong px-2.5 pt-3.5">
        <div className="grid size-[34px] flex-none place-items-center rounded-full bg-tilleul-light text-[13px] font-semibold leading-none text-olive-text">
          {initials(displayName)}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="text-[13px] font-medium leading-[1.2] text-ink">{me?.firstName}</span>
          <span className="truncate text-[12px] leading-[1.2] text-grey">{me?.email}</span>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label={t('nav.logout')}
          title={t('nav.logout')}
          className="grid size-8 flex-none place-items-center rounded-[8px] text-olive hover:bg-admin-nav-hover"
        >
          <LogoutIcon />
        </button>
      </div>
    </aside>
  );
}
