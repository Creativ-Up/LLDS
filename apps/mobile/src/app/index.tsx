import { DEFAULT_LANG, langSchema, lineOverviewSchema, pickText, type Lang, type LineOverview } from '@llds/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { supabaseUrl } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { colors, interFamily, layout, radius, stroke, textStyle } from '@/theme';

// Écran provisoire du jalon M0 : vérifie la chaîne app → Supabase (lignes visibles du public).
// Il sera remplacé par l'Accueil (M2) et deviendra le menu développeur (simulation de position, M3).

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; lines: LineOverview[] };

export default function SocleScreen() {
  const { t, i18n } = useTranslation(['mobile', 'common']);
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.from('line_overview').select('*').order('sort_order');
      if (cancelled) return;
      if (error) {
        setState({ kind: 'error', message: error.message });
        return;
      }
      const parsed = z.array(lineOverviewSchema).safeParse(data);
      setState(parsed.success ? { kind: 'ready', lines: parsed.data } : { kind: 'error', message: parsed.error.message });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lang = langSchema.catch(DEFAULT_LANG).parse(i18n.language);

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>{t('dev.title')}</Text>

      <Text style={styles.label}>{t('dev.backend')}</Text>
      {state.kind === 'loading' && <ActivityIndicator color={colors.olive} />}
      {state.kind === 'error' && <Text style={styles.error}>{t('dev.backendError', { message: state.message })}</Text>}
      {state.kind === 'ready' && <Text style={styles.body}>{t('dev.backendOk', { url: supabaseUrl })}</Text>}

      <Text style={styles.label}>{t('dev.lines')}</Text>
      {state.kind === 'ready' && (
        <FlatList
          data={state.lines}
          keyExtractor={(line) => line.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <LineRow line={item} lang={lang} />}
        />
      )}
    </SafeAreaView>
  );
}

function LineRow({ line, lang }: { line: LineOverview; lang: Lang }) {
  const { t } = useTranslation(['mobile', 'common']);
  const km = line.length_m === null ? null : new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(line.length_m / 1000);
  return (
    <View style={styles.row}>
      <Text style={styles.code}>
        {line.code} <Text style={styles.lineName}>{pickText(line.name, lang)}</Text>
      </Text>
      <Text style={styles.meta}>
        {t(`common:lineStatus.${line.status}`)} · {t('dev.lineStops', { count: line.stop_count })} ·{' '}
        {km === null ? t('dev.noTrack') : t('common:units.km', { value: km })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: layout.sideMargin,
    gap: 10,
  },
  title: {
    ...textStyle('screenTitle'),
    color: colors.ink,
    marginTop: 24,
    marginBottom: 12,
  },
  label: {
    ...textStyle('label'),
    color: colors.olive,
    marginTop: 12,
  },
  body: {
    ...textStyle('bodySmall'),
    color: colors.ink,
  },
  error: {
    ...textStyle('bodySmall'),
    color: colors.redDeep,
    backgroundColor: colors.redTint,
    borderRadius: radius.field,
    padding: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 32,
  },
  row: {
    borderWidth: stroke.control,
    borderColor: colors.ink,
    borderRadius: radius.ticket,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    minHeight: layout.minTouch,
  },
  code: {
    fontFamily: interFamily(700),
    fontSize: 20,
    color: colors.ink,
  },
  lineName: {
    fontFamily: interFamily(500, true),
    fontSize: 14,
  },
  meta: {
    fontFamily: interFamily(400),
    fontSize: 12.5,
    lineHeight: 15,
    color: colors.olive,
  },
});
