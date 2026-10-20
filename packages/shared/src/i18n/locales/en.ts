import type { TranslationResources } from '../types';

export const en: TranslationResources = {
  common: {
    appName: 'Les lignes du souvenir',
    lang: {
      fr: 'Français',
      nl: 'Nederlands',
      en: 'English',
    },
    lineStatus: {
      draft: 'Draft',
      published: 'Published',
      coming_soon: 'Coming soon',
    },
    units: {
      km: '{{value}} km',
    },
  },
  mobile: {
    dev: {
      title: 'Developer menu',
      backend: 'Server',
      backendOk: 'Connected · {{url}}',
      backendError: 'Connection failed: {{message}}',
      loading: 'Loading…',
      lines: 'Lines',
      lineStops_one: '{{count}} stop',
      lineStops_other: '{{count}} stops',
      noTrack: 'Track not imported',
    },
  },
  admin: {
    meta: {
      title: 'Administration · Les lignes du souvenir',
    },
    brand: 'Administration',
    socle: {
      title: 'Technical foundation',
      subtitle: 'Lines visible in the app, read from Supabase.',
      error: 'Could not reach Supabase: {{message}}',
      loading: 'Loading…',
      noValue: '—',
      empty: 'No visible line.',
      columns: {
        line: 'LINE',
        status: 'STATUS',
        stops: 'STOPS',
        length: 'LENGTH',
      },
    },
  },
};
