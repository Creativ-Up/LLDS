import type { Database } from '@llds/shared';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { publicEnv } from '@/lib/env';
import { ROUTES } from '@/lib/routes';

/** Retour des liens envoyés par e-mail (réinitialisation) : échange du code contre une session. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next');
  // Redirection interne uniquement.
  const target = next?.startsWith('/') && !next.startsWith('//') ? next : ROUTES.dashboard;
  const response = NextResponse.redirect(new URL(target, request.url));

  if (code) {
    const supabase = createServerClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          },
        },
      },
    );
    await supabase.auth.exchangeCodeForSession(code);
  }
  return response;
}
