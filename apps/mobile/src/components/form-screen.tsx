import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { useFrame } from '@/theme/layout';

import { BackButton } from './chrome';
import type { DecorVariant } from './decor';
import { Screen } from './screen';

interface FormScreenProps {
  decor?: DecorVariant;
  onBack?: () => void;
  /** Bloc titre + champs, à partir de y = 140 de la maquette. */
  children: ReactNode;
  /** Bas d'écran (séparateur, bouton secondaire, pied), ancré au bas de la zone sûre. */
  footer?: ReactNode;
  /** Distance du pied au bas de l'écran dans la maquette. */
  footerBottom?: number;
}

/** Écrans de formulaire (connexion, inscription…) : défilants, évitent le clavier. */
export function FormScreen({ decor, onBack, children, footer, footerBottom = 67 }: FormScreenProps) {
  const frame = useFrame();
  return (
    <Screen decor={decor}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingTop: frame.top(140), paddingBottom: frame.bottom(footerBottom) },
          ]}
        >
          {children}
          <View style={styles.spacer} />
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
      <BackButton onPress={onBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 31,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
  },
});
