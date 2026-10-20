import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { ADMIN_LANG, t } from '@/lib/i18n';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: t('meta.title'),
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang={ADMIN_LANG} className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
