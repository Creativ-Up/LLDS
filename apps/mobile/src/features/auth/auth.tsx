import { profileSchema, type Profile } from '@llds/shared';
import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import { usePreferences } from '@/features/preferences/preferences';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  /** La session initiale (stockée sur l'appareil) a été lue. */
  ready: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Jetons de session transmis par un lien de réinitialisation (fragment ou paramètres de l'URL). */
function recoveryTokens(url: string): { access_token: string; refresh_token: string } | null {
  const [, fragment = ''] = url.split('#');
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  const params = new URLSearchParams(fragment || query);
  const access = params.get('access_token');
  const refresh = params.get('refresh_token');
  return access && refresh ? { access_token: access, refresh_token: refresh } : null;
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  const parsed = profileSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** Session Supabase Auth et profil ; synchronise les préférences locales avec le profil. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { preferences, update } = usePreferences();
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState<{ userId: string; profile: Profile } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  // Lien de réinitialisation du mot de passe : la session est ouverte dès sa réception, ici à
  // la racine, car « Nouveau mot de passe » ne se monte qu'après l'événement qui l'a ouvert.
  useEffect(() => {
    const open = (url: string | null) => {
      const tokens = url ? recoveryTokens(url) : null;
      if (tokens) void supabase.auth.setSession(tokens);
    };
    void Linking.getInitialURL().then(open);
    const subscription = Linking.addEventListener('url', ({ url }) => open(url));
    return () => subscription.remove();
  }, []);

  const userId = session?.user.id;
  // Le profil n'est exposé que s'il appartient à l'utilisateur courant.
  const profile = loaded && loaded.userId === userId ? loaded.profile : null;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void loadProfile(userId).then((next) => {
      if (cancelled || !next) return;
      setLoaded({ userId, profile: next });
      // Les choix déjà faits sur l'appareil priment ; sinon on reprend ceux du profil.
      update({
        guest: false,
        transport: preferences.transport ?? next.transport ?? undefined,
        experience: preferences.experience ?? next.experience ?? undefined,
      });
    });
    return () => {
      cancelled = true;
    };
    // Rechargé seulement quand l'utilisateur change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Préférences recopiées dans le profil (langue, transport, expérience).
  const { lang, transport, experience } = preferences;
  useEffect(() => {
    if (!userId) return;
    const patch = {
      ...(lang && { lang }),
      ...(transport && { transport }),
      ...(experience && { experience }),
    };
    if (Object.keys(patch).length === 0) return;
    // Une requête supabase-js ne part qu'à son `then` : on l'attend explicitement.
    void (async () => {
      await supabase.from('profiles').update(patch).eq('id', userId);
    })();
  }, [userId, lang, transport, experience]);

  const value = useMemo(() => ({ session, profile, ready }), [session, profile, ready]);
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return value;
}
