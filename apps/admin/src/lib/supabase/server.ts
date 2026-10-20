import 'server-only';

import type { Database } from '@llds/shared';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { publicEnv } from '@/lib/env';

/** Client Supabase côté serveur, lié à la session (cookies) de l'admin connecté. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Appelé depuis un Server Component : le rafraîchissement de session est géré par le proxy (M1).
        }
      },
    },
  });
}
