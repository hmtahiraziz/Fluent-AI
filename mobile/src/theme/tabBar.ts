import { Platform } from 'react-native';
import type { Breakpoint } from './breakpoints';
import { radii } from './tokens';

export type TabRouteName = 'Practice' | 'Vocabulary' | 'Settings';

export const TAB_ITEMS: Record<
  TabRouteName,
  { label: string; shortLabel: string }
> = {
  Practice: { label: 'Home', shortLabel: 'Home' },
  Vocabulary: { label: 'Words', shortLabel: 'Words' },
  Settings: { label: 'Profile', shortLabel: 'Profile' },
};

/** Interactive row height (icons + labels), excluding safe-area padding. */
export function tabBarContentHeight(breakpoint: Breakpoint): number {
  switch (breakpoint) {
    case 'wide':
      return 60;
    case 'tablet':
      return 58;
    case 'compact':
      return 52;
    default:
      return 54;
  }
}

/** Space above the tab icons inside the chrome. */
export function tabBarTopPad(breakpoint: Breakpoint): number {
  return breakpoint === 'compact' ? 6 : 8;
}

/** Horizontal inset for the tab row on larger screens. */
export function tabBarSideInset(breakpoint: Breakpoint): number {
  switch (breakpoint) {
    case 'wide':
      return 28;
    case 'tablet':
      return 20;
    case 'compact':
      return 4;
    default:
      return 8;
  }
}

/** Top corner radius — docked bar, not a floating capsule. */
export const TAB_BAR_RADIUS = radii.card;

/**
 * Extra space between screen content and the tab bar so the last items
 * are not flush against the chrome.
 */
export function tabBarContentGap(breakpoint: Breakpoint): number {
  return breakpoint === 'compact' ? 8 : 10;
}

/**
 * Bottom padding inside the tab chrome.
 * - If the system reports a bottom inset (gesture home indicator / edge-to-edge),
 *   use it so icons/labels never sit under the system nav.
 * - If inset is 0 (typical when decorFitsSystemWindows already clears the nav),
 *   use a small internal pad only — no empty floating gap above the system bar.
 */
export function resolveTabBarBottomInset(systemBottomInset: number): number {
  if (systemBottomInset > 0) {
    return systemBottomInset;
  }
  return Platform.OS === 'android' ? 8 : 6;
}

/** Total height occupied by the absolute tab bar (for scene bottom padding). */
export function tabBarOccupiedHeight(
  breakpoint: Breakpoint,
  systemBottomInset: number,
): number {
  return (
    tabBarTopPad(breakpoint) +
    tabBarContentHeight(breakpoint) +
    resolveTabBarBottomInset(systemBottomInset)
  );
}

export function tabBarMaxWidth(breakpoint: Breakpoint): number | undefined {
  if (breakpoint === 'wide') return 560;
  if (breakpoint === 'tablet') return 480;
  return undefined;
}

export function tabBarIconSize(breakpoint: Breakpoint): number {
  switch (breakpoint) {
    case 'wide':
    case 'tablet':
      return 24;
    case 'compact':
      return 20;
    default:
      return 22;
  }
}
