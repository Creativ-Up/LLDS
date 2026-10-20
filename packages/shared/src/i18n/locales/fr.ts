// Clés FR : textes exacts du prototype (prototype/source/…dc.html) quand l'écran y figure.
export const fr = {
  common: {
    appName: 'Les lignes du souvenir',
    lang: {
      fr: 'Français',
      nl: 'Nederlands',
      en: 'English',
    },
    lineStatus: {
      draft: 'Brouillon',
      published: 'Publiée',
      coming_soon: 'Bientôt disponible',
    },
    units: {
      km: '{{value}} km',
    },
  },
  mobile: {
    dev: {
      title: 'Menu développeur',
      backend: 'Serveur',
      backendOk: 'Connecté · {{url}}',
      backendError: 'Connexion impossible : {{message}}',
      loading: 'Chargement…',
      lines: 'Lignes',
      lineStops_one: '{{count}} arrêt',
      lineStops_other: '{{count}} arrêts',
      noTrack: 'Tracé non importé',
    },
  },
  admin: {
    meta: {
      title: 'Administration · Les lignes du souvenir',
    },
    brand: 'Administration',
    socle: {
      title: 'Socle technique',
      subtitle: 'Lignes visibles dans l’application, lues depuis Supabase.',
      error: 'Connexion à Supabase impossible : {{message}}',
      loading: 'Chargement…',
      noValue: '—',
      empty: 'Aucune ligne visible.',
      columns: {
        line: 'LIGNE',
        status: 'STATUT',
        stops: 'ARRÊTS',
        length: 'LONGUEUR',
      },
    },
  },
};
