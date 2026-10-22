import { z } from 'zod';

// Variables publiques (exposées au navigateur) : URL du projet, clé anonyme et style du fond de carte.
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Fond de carte de l'éditeur de ligne (tuiles vectorielles OpenFreeMap, sans clé). Vide : fond uni.
  NEXT_PUBLIC_MAP_STYLE_URL: z.union([z.url(), z.literal('')]).default('https://tiles.openfreemap.org/styles/positron'),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL,
});
