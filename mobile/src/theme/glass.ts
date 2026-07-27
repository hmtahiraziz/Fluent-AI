import { Platform, type ViewStyle } from 'react-native';
import { colors, radii } from './tokens';

export const glass = {
  canvas: colors.lavenderSoft,
  surface: colors.surface,
  selected: colors.lavenderMuted,
  navbar: colors.navDark,
} as const;

export function softShadow(elevation = 8): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
    },
    android: { elevation },
    default: {},
  }) as ViewStyle;
}

export function buttonShadow(): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 14,
    },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle;
}

export function navbarShadow(): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
    android: { elevation: 16 },
    default: {},
  }) as ViewStyle;
}

export const cardStyle: ViewStyle = {
  borderRadius: radii.card,
  backgroundColor: colors.surface,
  ...softShadow(4),
};

export const rowStyle: ViewStyle = {
  borderRadius: radii.card,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
};

export const selectedRowStyle: ViewStyle = {
  borderRadius: radii.card,
  backgroundColor: colors.lavenderMuted,
  borderWidth: 1.5,
  borderColor: colors.lavender,
};
