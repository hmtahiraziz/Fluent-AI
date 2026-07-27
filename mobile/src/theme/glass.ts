import { Platform, type ViewStyle } from 'react-native';
import { colors, radii } from './tokens';

export const glass = {
  canvas: colors.lavenderSoft,
  surface: colors.surface,
  selected: colors.surfaceContainer,
  navbar: colors.navDark,
} as const;

export function softShadow(elevation = 8): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: '#222222',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 20,
    },
    android: { elevation },
    default: {},
  }) as ViewStyle;
}

export function buttonShadow(): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: '#222222',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle;
}

export function navbarShadow(): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: '#222222',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 30,
    },
    android: { elevation: 12 },
    default: {},
  }) as ViewStyle;
}

export const cardStyle: ViewStyle = {
  borderRadius: radii.card,
  backgroundColor: colors.surface,
  ...softShadow(3),
};

export const rowStyle: ViewStyle = {
  borderRadius: radii.card,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: 'transparent',
  ...softShadow(2),
};

export const selectedRowStyle: ViewStyle = {
  borderRadius: radii.card,
  backgroundColor: colors.surfaceContainer,
  borderWidth: 1.5,
  borderColor: colors.primaryContainer,
  ...softShadow(2),
};
