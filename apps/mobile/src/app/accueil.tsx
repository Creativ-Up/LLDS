import logo from '@llds/assets/brand/logo-llds-positif.png';
import postcard from '@llds/assets/demo/accueil-carte-postale.jpg';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { ArchiveImage } from '@/components/archive-image';
import { OutlineButton, RedButton, TextLink } from '@/components/buttons';
import { Screen } from '@/components/screen';
import { usePreferences } from '@/features/preferences/preferences';
import { colors } from '@/theme';
import { DESIGN, useFrame } from '@/theme/layout';

// Cadrage de la carte postale sur le bâtiment (maquette : 1340 × 870 décalée de −903 pt),
// le recadrage exclut le bandeau de crédits du scan.
const POSTCARD = { width: 1340, height: 870, left: -903 } as const;
const LOGO = { left: -71, top: 63, width: 533, ratio: 2481 / 3508 } as const;

/** 01 Accueil */
export default function Welcome() {
  const router = useRouter();
  const frame = useFrame();
  const { t } = useTranslation();
  const { update } = usePreferences();
  const k = frame.height / DESIGN.height;

  return (
    <Screen>
      <ArchiveImage
        uri={Image.resolveAssetSource(postcard)?.uri ?? null}
        tone="grayscale"
        width={POSTCARD.width * k}
        height={POSTCARD.height * k}
        preserveAspectRatio="none"
        style={[styles.postcard, { left: POSTCARD.left * k }]}
      />
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="welcome-shade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.cream} stopOpacity={0.1} />
            <Stop offset="0.4" stopColor={colors.ink} stopOpacity={0} />
            <Stop offset="0.74" stopColor={colors.ink} stopOpacity={0.5} />
            <Stop offset="1" stopColor={colors.ink} stopOpacity={0.82} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#welcome-shade)" />
      </Svg>
      <Image
        source={logo}
        accessibilityLabel={t('appName', { ns: 'common' })}
        resizeMode="contain"
        style={[
          styles.logo,
          { left: LOGO.left * k, top: frame.top(LOGO.top), width: LOGO.width * k, height: LOGO.width * LOGO.ratio * k },
        ]}
      />
      <View style={[styles.actions, { bottom: frame.bottom(103) }]}>
        <RedButton label={t('welcome.login')} height={53} onPress={() => router.push('/connexion')} />
        <OutlineButton
          label={t('welcome.guest')}
          height={53}
          onPress={() => {
            update({ guest: true });
            router.push('/langue');
          }}
        />
      </View>
      <TextLink
        onPress={() => router.push('/inscription')}
        color={colors.white}
        size={16}
        weight={500}
        style={[styles.signup, { bottom: frame.bottom(57) }]}
      >
        {t('welcome.signup')}
      </TextLink>
    </Screen>
  );
}

const styles = StyleSheet.create({
  postcard: {
    position: 'absolute',
    top: 0,
  },
  logo: {
    position: 'absolute',
  },
  actions: {
    position: 'absolute',
    alignSelf: 'center',
    width: 257,
    gap: 19,
  },
  signup: {
    position: 'absolute',
    alignSelf: 'center',
    height: 44,
  },
});
