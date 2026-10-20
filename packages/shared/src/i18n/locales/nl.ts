import type { TranslationResources } from '../types';

export const nl: TranslationResources = {
  common: {
    appName: 'Les lignes du souvenir',
    lang: {
      fr: 'Français',
      nl: 'Nederlands',
      en: 'English',
    },
    lineStatus: {
      draft: 'Concept',
      published: 'Gepubliceerd',
      coming_soon: 'Binnenkort beschikbaar',
    },
    units: {
      km: '{{value}} km',
    },
  },
  mobile: {
    dev: {
      title: 'Ontwikkelaarsmenu',
      backend: 'Server',
      backendOk: 'Verbonden · {{url}}',
      backendError: 'Verbinding mislukt: {{message}}',
      loading: 'Laden…',
      lines: 'Lijnen',
      lineStops_one: '{{count}} halte',
      lineStops_other: '{{count}} haltes',
      noTrack: 'Tracé niet geïmporteerd',
    },
  },
  admin: {
    meta: {
      title: 'Beheer · Les lignes du souvenir',
    },
    brand: 'Beheer',
    socle: {
      title: 'Technische basis',
      subtitle: 'Lijnen zichtbaar in de app, gelezen uit Supabase.',
      error: 'Verbinding met Supabase mislukt: {{message}}',
      loading: 'Laden…',
      noValue: '—',
      empty: 'Geen zichtbare lijn.',
      columns: {
        line: 'LIJN',
        status: 'STATUS',
        stops: 'HALTES',
        length: 'LENGTE',
      },
    },
  },
};
