import 'expo-sqlite/localStorage/install';

import type { Database } from '@llds/shared';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { supabaseAnonKey, supabaseUrl } from './env';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Rafraîchissement du jeton uniquement quand l'app est au premier plan.
AppState.addEventListener('change', (state) => {
  if (state === 'active') void supabase.auth.startAutoRefresh();
  else void supabase.auth.stopAutoRefresh();
});
