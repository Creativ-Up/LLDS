'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { queryKeys, useInvalidate, useLines } from '@/lib/data';
import { errorMessage, unwrap } from '@/lib/errors';
import { t } from '@/lib/i18n';
import { ROUTES } from '@/lib/routes';
import { getSupabase } from '@/lib/supabase/client';

/** « Nouvelle ligne » : crée un brouillon (code provisoire unique) et ouvre son éditeur. */
export function useCreateLine() {
  const router = useRouter();
  const notify = useToast();
  const invalidate = useInvalidate();
  const { data: lines = [] } = useLines();
  const [pending, setPending] = useState(false);

  async function createLine() {
    if (pending) return;
    setPending(true);
    try {
      const codes = new Set(lines.map((line) => line.code));
      const base = t('lines.newLineCode');
      let code = base;
      for (let n = 2; codes.has(code); n += 1) code = `${base}-${n}`;
      const sortOrder = lines.reduce((max, line) => Math.max(max, line.sort_order), 0) + 1;
      const created = unwrap(
        await getSupabase().from('lines').insert({ code, name: {}, sort_order: sortOrder }).select('id').single(),
      );
      await invalidate(queryKeys.lines, queryKeys.events);
      notify(t('lines.created'));
      router.push(ROUTES.line(created.id));
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return { createLine, pending };
}
