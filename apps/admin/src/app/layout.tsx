import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Providers } from '@/components/providers';
import { ADMIN_LANG, t } from '@/lib/i18n';

import './globals.css';

// Inter 400 à 700, italiques 500 et 600 (tokens : font.weights / font.italic).
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
      <body className="min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
