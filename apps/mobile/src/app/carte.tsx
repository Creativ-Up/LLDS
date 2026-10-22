import { pickText } from '@llds/shared';
import { letterSpacingPt } from '@llds/shared/tokens';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { TextLink } from '@/components/buttons';
import { Screen } from '@/components/screen';
import { useLine } from '@/features/content/queries';
import { usePreferences } from '@/features/preferences/preferences';
import { colors, interFamily } from '@/theme';
import { useFrame } from '@/theme/layout';

/** 07 Carte du parcours — provisoire : la carte MapLibre arrive au jalon M3. */
export default function MapScreen() {
  const router = useRouter();
  const frame = useFrame();
  const { t } = useTranslation();
  const { preferences, lang } = usePreferences();
  const line = useLine(preferences.lineId);

  return (
    <Screen>
      <View style={[styles.content, { paddingTop: frame.top(140) }]}>
        {line && (
          <View style={styles.titleRow}>
            <Text style={styles.code}>{line.code}</Text>
            <Text style={styles.name}>{pickText(line.name, lang)}</Text>
          </View>
        )}
        <Text style={styles.text}>{t('map.placeholder')}</Text>
        <TextLink onPress={() => router.push('/lignes')} color={colors.red}>
          {t('lines.title')}
        </TextLink>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 32,
    gap: 16,
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  code: {
    fontFamily: interFamily(700),
    fontSize: 34,
    letterSpacing: letterSpacingPt(-0.025, 34),
    color: colors.ink,
  },
  name: {
    fontFamily: interFamily(500, true),
    fontSize: 20,
    color: colors.ink,
  },
  text: {
    fontFamily: interFamily(400),
    fontSize: 16,
    lineHeight: 16 * 1.4,
    color: colors.olive,
  },
});
