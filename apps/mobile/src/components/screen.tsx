import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors } from '@/theme';
import { screenIn } from '@/theme/motion';

import { Decor, type DecorVariant } from './decor';

/** Écran plein (fond crème) avec décor optionnel et animation d'entrée `in`. */
export function Screen({ children, decor }: { children: ReactNode; decor?: DecorVariant }) {
  return (
    <View style={styles.screen}>
      {decor && <Decor variant={decor} />}
      <Animated.View entering={screenIn} style={styles.content}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
  },
});
