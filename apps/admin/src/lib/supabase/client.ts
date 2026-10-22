import type { Database } from '@llds/shared';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import { publicEnv } from '@/lib/env';

export type AdminSupabase = SupabaseClient<Database>;

let client: AdminSupabase | null = null;

/** Client Supabase du navigateur (session dans les cookies, partagée avec le proxy). Créé à la demande. */
export function getSupabase(): AdminSupabase {
  client ??= createBrowserClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return client;
}
