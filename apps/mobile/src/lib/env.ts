import Constants from 'expo-constants';
import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Les variables EXPO_PUBLIC_* sont injectées à la compilation : accès statique obligatoire.
const env = envSchema.parse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost']);
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * En développement, un téléphone ou un émulateur ne joint pas le « localhost » de la machine :
 * on remplace l'hôte local par celui du serveur Metro (IP de la machine de dev).
 * En mode tunnel, Metro est joint par une URL publique : Supabase local reste alors injoignable.
 */
function resolveSupabaseUrl(raw: string): string {
  const url = new URL(raw);
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (__DEV__ && devHost && IPV4.test(devHost) && LOOPBACK_HOSTS.has(url.hostname)) url.hostname = devHost;
  return url.toString().replace(/\/$/, '');
}

export const supabaseUrl = resolveSupabaseUrl(env.EXPO_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
