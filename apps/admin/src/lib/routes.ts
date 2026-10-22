/** Chemins du back-office (en français, comme l'interface). */
export const ROUTES = {
  login: '/connexion',
  forgotPassword: '/mot-de-passe-oublie',
  resetPassword: '/nouveau-mot-de-passe',
  authCallback: '/auth/callback',
  dashboard: '/',
  lines: '/lignes',
  line: (id: string) => `/lignes/${id}`,
  stamps: '/cachets',
  partners: '/partenaires',
  media: '/mediatheque',
  users: '/utilisateurs',
  settings: '/reglages',
} as const;
