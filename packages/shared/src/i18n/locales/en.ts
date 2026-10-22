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
};
