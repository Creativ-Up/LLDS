import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, interFamily, radius, stroke } from '@/theme';

import { AlertIcon, CheckMark, EyeIcon } from './icons';
import { Label } from './typography';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  invalid?: boolean;
  /** Ajoute le bouton œil (44 × 44) pour afficher le mot de passe. */
  password?: boolean;
}

/** Champ : libellé + champ h 52, rayon 8, contour 2 pt tilleul ; focus olive ; erreur rouge. */
export function TextField({ label, invalid, password, ...input }: TextFieldProps) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const borderColor = focused ? colors.olive : invalid ? colors.red : colors.tilleul;

  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <View>
        <TextInput
          {...input}
          accessibilityLabel={label}
          secureTextEntry={password && !visible}
          placeholderTextColor={colors.passiveText}
          onFocus={(event) => {
            setFocused(true);
            input.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            input.onBlur?.(event);
          }}
          style={[styles.input, { borderColor }, password && styles.inputWithToggle]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? t('a11y.hidePassword') : t('a11y.showPassword')}
            onPress={() => setVisible((value) => !value)}
            style={styles.eye}
          >
            <EyeIcon />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** Bandeau d'erreur : fond `redTint`, rayon 8, icône + texte 14 pt `redDeep`. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
      <AlertIcon />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

/** Case 24 × 24 rayon 6 (cochée : fond olive, coche crème) + texte. */
export function Checkbox({
  checked,
  invalid,
  onToggle,
  children,
}: {
  checked: boolean;
  invalid?: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const borderColor = checked ? colors.olive : invalid ? colors.red : colors.tilleul;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={styles.checkboxRow}
    >
      <View style={[styles.box, { borderColor, backgroundColor: checked ? colors.olive : colors.cream }]}>
        {checked && <CheckMark />}
      </View>
      {/* Android : un soulignement n'est redessiné qu'au montage du texte ; on remonte le paragraphe
          quand la case change d'état pour garder les liens soulignés. */}
      <Text key={`${checked}-${invalid}`} style={styles.checkboxText}>
        {children}
      </Text>
    </Pressable>
  );
}

/** Séparateur « ou » entre deux traits tilleul. */
export function OrDivider({ label }: { label: string }) {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  input: {
    height: 52,
    borderRadius: radius.field,
    borderWidth: stroke.control,
    backgroundColor: colors.cream,
    paddingHorizontal: 14,
    fontFamily: interFamily(400),
    fontSize: 16,
    color: colors.ink,
  },
  inputWithToggle: {
    paddingRight: 52,
  },
  eye: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.field,
    backgroundColor: colors.redTint,
  },
  errorText: {
    flex: 1,
    fontFamily: interFamily(400),
    fontSize: 14,
    lineHeight: 14 * 1.35,
    color: colors.redDeep,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
    minHeight: 44,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: stroke.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    flex: 1,
    fontFamily: interFamily(400),
    fontSize: 14,
    lineHeight: 14 * 1.4,
    color: colors.ink,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.tilleul,
  },
  dividerText: {
    fontFamily: interFamily(400),
    fontSize: 13,
    color: colors.olive,
  },
});
