import { Suspense } from 'react';

import { Sidebar } from '@/components/shell/sidebar';

export default function AdminLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-screen bg-admin-page">
      {/* La navigation lit l'URL courante : elle est rendue côté client, derrière une limite Suspense. */}
      <Suspense fallback={<div className="w-[236px] flex-none border-r border-admin-border bg-cream" />}>
        <Sidebar />
      </Suspense>
      <main className="min-w-0 flex-1 px-10 pt-[30px] pb-[60px]">{children}</main>
    </div>
  );
}
