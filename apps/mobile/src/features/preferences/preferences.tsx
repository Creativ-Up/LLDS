import 'expo-sqlite/localStorage/install';

import {
  experienceTypeSchema,
  langSchema,
  lineDirectionSchema,
  transportModeSchema,
  type ExperienceType,
  type Lang,
  type LineDirection,
  type TransportMode,
} from '@llds/shared';
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { z } from 'zod';

import i18n, { deviceLang } from '@/lib/i18n';

// Choix de l'onboarding, conservés sur l'appareil (aussi pour les invités) ;
// recopiés dans le profil Supabase quand l'utilisateur est connecté.
const preferencesSchema = z.object({
  lang: langSchema.optional(),
  transport: transportModeSchema.optional(),
  experience: experienceTypeSchema.optional(),
  lineId: z.string().optional(),
  direction: lineDirectionSchema.optional(),
  guest: z.boolean().optional(),
  onboarded: z.boolean().optional(),
});

export type Preferences = z.infer<typeof preferencesSchema>;

const STORAGE_KEY = 'llds.preferences';

function readPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = preferencesSchema.safeParse(raw ? JSON.parse(raw) : {});
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

interface PreferencesContextValue {
  preferences: Preferences;
  lang: Lang;
  transport: TransportMode;
  experience: ExperienceType;
  direction: LineDirection;
  update: (patch: Partial<Preferences>) => void;
  /** Efface les choix enregistrés sur l'appareil (menu développeur). */
  reset: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const stored = readPreferences();
    if (stored.lang && stored.lang !== i18n.language) void i18n.changeLanguage(stored.lang);
    return stored;
  });

  const update = useCallback((patch: Partial<Preferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (patch.lang && patch.lang !== i18n.language) void i18n.changeLanguage(patch.lang);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    void i18n.changeLanguage(deviceLang());
    setPreferences({});
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      lang: preferences.lang ?? deviceLang(),
      transport: preferences.transport ?? 'pied',
      experience: preferences.experience ?? 'complete',
      direction: preferences.direction ?? 'forward',
      update,
      reset,
    }),
    [preferences, update, reset],
  );

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences(): PreferencesContextValue {
  const value = use(PreferencesContext);
  if (!value) throw new Error('usePreferences doit être utilisé dans PreferencesProvider');
  return value;
}
