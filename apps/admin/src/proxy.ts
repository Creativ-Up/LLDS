import type { Database } from '@llds/shared';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { publicEnv } from '@/lib/env';
import { ROUTES } from '@/lib/routes';

/** Pages accessibles sans session admin. */
const PUBLIC_PATHS: readonly string[] = [ROUTES.login, ROUTES.forgotPassword, ROUTES.resetPassword, ROUTES.authCallback];

/**
 * Contrôle d'accès « optimiste » : rafraîchit la session Supabase (cookies), redirige vers la connexion
 * sans session et refuse les comptes non administrateurs. L'autorité reste la RLS côté base.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = new URLSearchParams(params).toString();
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!user) return isPublic ? response : redirectTo(ROUTES.login);

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  if (!isAdmin && !isPublic) return redirectTo(ROUTES.login, { acces: 'refuse' });
  if (isAdmin && pathname === ROUTES.login) return redirectTo(ROUTES.dashboard);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|vendor/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
