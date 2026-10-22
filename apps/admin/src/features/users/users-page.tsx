'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cardClass } from '@/components/ui/card';
import { inputClass } from '@/components/ui/field';
import { SearchIcon } from '@/components/ui/icons';
import { Modal } from '@/components/ui/overlay';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';
import { queryKeys, useInvalidate, useUsers, type AdminUser } from '@/lib/data';
import { errorMessage } from '@/lib/errors';
import { formatShortDate, initials } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getSupabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const GRID = 'grid-cols-[minmax(220px,2fr)_120px_minmax(160px,1.4fr)_80px_80px_110px]';

const displayName = (user: AdminUser) => user.first_name?.trim() || t('users.noName');

function linesText(user: AdminUser): string {
  if (user.lines.length === 0) return t('noValue');
  return user.lines
    .map((line) =>
      line.status === 'completed'
        ? t('users.lineCompleted', { code: line.code })
        : t('users.lineInProgress', { code: line.code, done: line.done, total: line.total }),
    )
    .join(' · ');
}

/** A8 Utilisateurs : comptes inscrits (lecture seule) et suppression RGPD. */
export function UsersPage() {
  const notify = useToast();
  const invalidate = useInvalidate();
  const { data: users = [], isPending } = useUsers();
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);

  const needle = query.trim().toLowerCase();
  const rows = users.filter((user) => !needle || `${user.first_name ?? ''} ${user.email}`.toLowerCase().includes(needle));

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    const { error } = await getSupabase().rpc('admin_delete_user', { p_user_id: toDelete.id });
    setBusy(false);
    if (error) return notify(errorMessage(error));
    notify(t('users.deleted', { name: displayName(toDelete) }));
    setToDelete(null);
    await invalidate(queryKeys.users);
  }

  return (
    <div className="flex max-w-[1180px] animate-adm-in flex-col gap-5">
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        actions={
          <div className="relative w-[280px] max-w-full">
            <SearchIcon className="absolute top-[13px] left-3 text-olive" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('users.search')}
              aria-label={t('users.search')}
              className={cn(inputClass, 'pl-9')}
            />
          </div>
        }
      />
      <div className={cn(cardClass, 'overflow-x-auto')}>
        <div className="min-w-[860px]">
          <div
            className={cn(
              'grid items-center gap-3.5 border-b border-admin-divider-strong px-[18px] py-[11px] text-[12px] font-medium leading-none tracking-[0.07em] text-olive',
              GRID,
            )}
          >
            <span>{t('users.columns.user')}</span>
            <span>{t('users.columns.since')}</span>
            <span>{t('users.columns.lines')}</span>
            <span>{t('users.columns.points')}</span>
            <span>{t('users.columns.stamps')}</span>
            <span />
          </div>
          {rows.map((user) => (
            <div key={user.id} className={cn('grid items-center gap-3.5 border-b border-admin-divider px-[18px] py-[11px]', GRID)}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-[34px] flex-none place-items-center rounded-full bg-tilleul-light text-[12px] font-semibold leading-none text-olive-text">
                  {initials(displayName(user))}
                </div>
                <div className="flex min-w-0 flex-col gap-[3px]">
                  <span className="text-[14px] font-medium leading-[1.2]">{displayName(user)}</span>
                  <span className="truncate text-[12.5px] leading-[1.2] text-grey">{user.email}</span>
                </div>
              </div>
              <span className="text-[13px] leading-none text-grey">{formatShortDate(user.created_at)}</span>
              <span className="text-[13px] leading-[1.3]">{linesText(user)}</span>
              <span className="text-[13.5px] font-medium leading-none">{user.points}</span>
              <span className="text-[13.5px] font-medium leading-none">{user.stamps}</span>
              <Button variant="dangerLink" className="justify-self-end px-1" onClick={() => setToDelete(user)}>
                {t('users.delete')}
              </Button>
            </div>
          ))}
          {!isPending && rows.length === 0 && (
            <p className="m-0 px-[18px] py-6 text-[14px] leading-[1.4] text-grey">
              {needle ? t('users.noResults', { query }) : t('users.empty')}
            </p>
          )}
        </div>
      </div>

      <Modal
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t('users.deleteModal.title', { name: toDelete ? displayName(toDelete) : '' })}
        className="max-w-[440px] gap-3.5"
      >
        <p className="m-0 text-[14px] leading-[1.5] text-grey">{t('users.deleteModal.body')}</p>
        <div className="mt-1.5 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
            {t('users.deleteModal.confirm')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
