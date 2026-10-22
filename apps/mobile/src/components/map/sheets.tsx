import PlayIcon from '@llds/assets/icons/play.svg';
import CafeIcon from '@llds/assets/icons/service-cafe.svg';
import GareIcon from '@llds/assets/icons/service-gare-sncb.svg';
import InfoIcon from '@llds/assets/icons/service-info.svg';
import ParkingIcon from '@llds/assets/icons/service-parking.svg';
import PatrimoineIcon from '@llds/assets/icons/service-patrimoine.svg';
import RemiseIcon from '@llds/assets/icons/service-remise.svg';
import RestaurantIcon from '@llds/assets/icons/service-restaurant.svg';
import { STOP_SERVICES, type Media, type StopService } from '@llds/shared';
import { letterSpacingPt } from '@llds/shared/tokens';
import type { FC, ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { SvgProps } from 'react-native-svg';

import { StampMark } from '@/components/stamp-mark';
import { colors, interFamily, stroke } from '@/theme';
import { sheetUp } from '@/theme/motion';

/** Pictogrammes des 7 services, toujours dans le même ordre (SCREENS.md § 08). */
const SERVICE_ICONS: Record<StopService, { Icon: FC<SvgProps>; width: number; height: number }> = {
  cafe: { Icon: CafeIcon, width: 19.67, height: 22.92 },
  parking: { Icon: ParkingIcon, width: 22.634, height: 22.634 },
  info: { Icon: InfoIcon, width: 10, height: 22 },
  restaurant: { Icon: RestaurantIcon, width: 21.691, height: 21.691 },
  gare: { Icon: GareIcon, width: 33.75, height: 22.815 },
  patrimoine: { Icon: PatrimoineIcon, width: 26, height: 23 },
  remise: { Icon: RemiseIcon, width: 23, height: 23 },
};

/** Voile derrière une feuille du bas ; un appui ferme la feuille. */
function Scrim({ onClose, color }: { onClose: () => void; color: string }) {
  const { t } = useTranslation();
  return (
    <Animated.View entering={FadeIn.duration(220)} style={StyleSheet.absoluteFill}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('a11y.close')}
        onPress={onClose}
        style={[StyleSheet.absoluteFill, { backgroundColor: color }]}
      />
    </Animated.View>
  );
}

export type PoiAction = { kind: 'play'; label: 'live' | 'relive' | 'preview'; guestNote: boolean } | { kind: 'onSite' };

interface PoiSheetProps {
  name: string;
  /** « à 150 m », « Arrêt 1 · visité »… */
  status: string;
  services: readonly StopService[];
  description: string;
  action: PoiAction;
  voucher: boolean;
  bottomInset: number;
  onPlay: () => void;
  onVoucher: () => void;
  onSignup: () => void;
  onClose: () => void;
}

/** 08 Fiche du point d'intérêt (feuille du bas, 374 pt). */
export function PoiSheet({
  name,
  status,
  services,
  description,
  action,
  voucher,
  bottomInset,
  onPlay,
  onVoucher,
  onSignup,
  onClose,
}: PoiSheetProps) {
  const { t } = useTranslation();
  const present = new Set(services);
  const label = action.kind === 'play' ? t(`poi.${action.label}`) : t('poi.live');
  return (
    <>
      <Scrim onClose={onClose} color={colors.scrim} />
      <Animated.View entering={sheetUp} style={[styles.poi, { height: 374 + bottomInset, paddingBottom: 20 + bottomInset }]}>
        <View style={styles.handle} />
        <View style={styles.poiTop}>
          <Text style={styles.poiStatus}>{status}</Text>
          {voucher && (
            <Pressable accessibilityRole="button" onPress={onVoucher} style={({ pressed }) => [styles.voucher, pressed && styles.voucherPressed]}>
              <Text style={styles.voucherText}>{t('poi.voucher')}</Text>
            </Pressable>
          )}
        </View>
        <Text accessibilityRole="header" numberOfLines={2} style={styles.poiName}>
          {name}
        </Text>
        <View
          accessible
          accessibilityLabel={t('a11y.servicesList', {
            list: STOP_SERVICES.filter((service) => present.has(service))
              .map((service) => t(`a11y.services.${service}`))
              .join(', '),
          })}
          style={styles.services}
        >
          {STOP_SERVICES.map((service) => {
            const { Icon, width, height } = SERVICE_ICONS[service];
            return <Icon key={service} width={width} height={height} opacity={present.has(service) ? 1 : 0.2} />;
          })}
        </View>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.poiActions}>
          {action.kind === 'play' && (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={onPlay}
                style={({ pressed }) => [styles.cta, { backgroundColor: pressed ? colors.oliveDark : colors.olive }]}
              >
                <PlayIcon width={16} height={16} />
                <Text style={styles.ctaText}>{label}</Text>
              </Pressable>
              {action.guestNote && (
                <Text style={styles.note}>
                  <Trans
                    t={t}
                    i18nKey="poi.guestNote"
                    components={{ link: <Text accessibilityRole="link" onPress={onSignup} style={styles.noteLink} /> }}
                  />
                </Text>
              )}
            </>
          )}
          {action.kind === 'onSite' && (
            <>
              <View accessibilityState={{ disabled: true }} style={[styles.cta, styles.ctaPassive]}>
                <View style={styles.passiveIcon}>
                  <PlayIcon width={16} height={16} />
                </View>
                <Text style={[styles.ctaText, styles.ctaPassiveText]}>{label}</Text>
              </View>
              <Text style={[styles.note, styles.notePassive]}>{t('poi.onSite')}</Text>
            </>
          )}
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={14}>
            <Text style={styles.later}>{t('poi.later')}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
}

interface LineSheetProps {
  code: string;
  name: string;
  rows: { label: string; value: string }[];
  stamps: { id: string; image: Media | null | undefined; earned: boolean }[];
  top: number;
  bottomInset: number;
  onClose: () => void;
}

/** Fiche de ligne (depuis la carte de progression) : statistiques et rangée de cachets 54 pt. */
export function LineSheet({ code, name, rows, stamps, top, bottomInset, onClose }: LineSheetProps) {
  const { t } = useTranslation();
  return (
    <>
      <Scrim onClose={onClose} color={colors.scrimLine} />
      <Animated.View entering={sheetUp} style={[styles.line, { top, bottom: 14 + bottomInset }]}>
        <View style={[styles.handle, styles.lineHandle]} />
        <View style={styles.lineTitle}>
          <Text style={styles.lineCode}>{code}</Text>
          <Text style={styles.lineName}>{name}</Text>
        </View>
        <View style={styles.stats}>
          {rows.map((row, i) => (
            <View key={row.label} style={[styles.statRow, i < rows.length - 1 && styles.statBorder]}>
              <Text style={styles.statLabel}>{row.label}</Text>
              <Text style={styles.statValue}>{row.value}</Text>
            </View>
          ))}
          {stamps.length > 0 && (
            <View style={styles.stampRow}>
              {stamps.map((stamp) => (
                <StampSlot key={stamp.id} earned={stamp.earned}>
                  <StampMark image={stamp.image} size={46} />
                </StampSlot>
              ))}
            </View>
          )}
        </View>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.lineClose}>
          <Text style={styles.lineCloseText}>{t('map.lineSheet.close')}</Text>
        </Pressable>
      </Animated.View>
    </>
  );
}

function StampSlot({ earned, children }: { earned: boolean; children: ReactNode }) {
  return <View style={[styles.stampSlot, !earned && styles.stampSlotEmpty]}>{earned ? children : null}</View>;
}

const styles = StyleSheet.create({
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 10,
    backgroundColor: colors.olive,
  },
  poi: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 19,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderWidth: stroke.control,
    borderColor: colors.tilleul,
    backgroundColor: colors.cream,
  },
  poiTop: {
    marginTop: 12,
    marginLeft: 31,
    marginRight: 27,
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  poiStatus: {
    fontFamily: interFamily(400),
    fontSize: 14,
    color: colors.ink,
  },
  voucher: {
    height: 26,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: colors.red,
    justifyContent: 'center',
  },
  voucherPressed: {
    backgroundColor: colors.redDeep,
  },
  voucherText: {
    fontFamily: interFamily(600),
    fontSize: 10.5,
    letterSpacing: letterSpacingPt(0.06, 10.5),
    color: colors.white,
  },
  poiName: {
    marginTop: 4,
    marginHorizontal: 29,
    fontFamily: interFamily(500),
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
  },
  services: {
    marginTop: 12,
    marginHorizontal: 29,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 17,
  },
  description: {
    flex: 1,
    marginTop: 14,
    marginHorizontal: 29,
    overflow: 'hidden',
    fontFamily: interFamily(400),
    fontSize: 12.5,
    lineHeight: 12.5 * 1.38,
    color: colors.ink,
  },
  poiActions: {
    marginTop: 12,
    marginHorizontal: 30,
    gap: 10,
  },
  cta: {
    height: 71,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  ctaText: {
    fontFamily: interFamily(400),
    fontSize: 20,
    color: colors.cream,
  },
  ctaPassive: {
    backgroundColor: colors.passiveBg,
    borderWidth: stroke.control,
    borderColor: colors.passiveBorder,
  },
  ctaPassiveText: {
    color: colors.passiveText,
  },
  passiveIcon: {
    opacity: 0.55,
  },
  note: {
    textAlign: 'center',
    fontFamily: interFamily(400),
    fontSize: 11.5,
    lineHeight: 11.5 * 1.2,
    color: colors.olive,
  },
  notePassive: {
    color: colors.passiveText,
  },
  noteLink: {
    color: colors.red,
    textDecorationLine: 'underline',
  },
  later: {
    textAlign: 'center',
    fontFamily: interFamily(400),
    fontSize: 12,
    lineHeight: 12 * 1.2,
    color: colors.olive,
    textDecorationLine: 'underline',
  },
  line: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 26,
    borderWidth: stroke.control,
    borderColor: colors.olive,
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  lineHandle: {
    marginTop: 16,
  },
  lineTitle: {
    marginTop: 35,
    marginHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 12,
  },
  lineCode: {
    fontFamily: interFamily(400),
    fontSize: 46,
    letterSpacing: letterSpacingPt(-0.03, 46),
    color: colors.ink,
  },
  lineName: {
    fontFamily: interFamily(600, true),
    fontSize: 24,
    color: colors.ink,
  },
  stats: {
    marginTop: 32,
    marginHorizontal: 28,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderRadius: 14,
    borderWidth: stroke.control,
    borderColor: colors.olive,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  statBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.tilleul,
  },
  statLabel: {
    fontFamily: interFamily(500),
    fontSize: 15,
    letterSpacing: letterSpacingPt(0.04, 15),
    color: colors.olive,
  },
  statValue: {
    fontFamily: interFamily(500),
    fontSize: 17,
    color: colors.ink,
  },
  stampRow: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  stampSlot: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.4,
    borderColor: colors.stampRing,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampSlotEmpty: {
    borderColor: colors.stampRingEmpty,
    opacity: 0.35,
  },
  lineClose: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    height: 44,
    justifyContent: 'center',
  },
  lineCloseText: {
    textAlign: 'center',
    fontFamily: interFamily(400),
    fontSize: 16,
    color: colors.olive,
  },
});

