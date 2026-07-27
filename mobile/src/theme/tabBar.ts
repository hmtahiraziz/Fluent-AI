import type { Breakpoint } from './breakpoints';

export type TabRouteName = 'Practice' | 'Vocabulary' | 'Settings';

export const TAB_ITEMS: Record<
  TabRouteName,
  { label: string; shortLabel: string }
> = {
  Practice: { label: 'Home', shortLabel: 'Home' },
  Vocabulary: { label: 'Words', shortLabel: 'Words' },
  Settings: { label: 'Profile', shortLabel: 'Profile' },
};

export function tabBarHeight(breakpoint: Breakpoint, bottomInset: number): number {
  const base = breakpoint === 'wide' || breakpoint === 'tablet' ? 72 : 64;
  return base + Math.max(bottomInset, 8);
}

export function tabBarMaxWidth(breakpoint: Breakpoint): number | undefined {
  if (breakpoint === 'wide') return 560;
  if (breakpoint === 'tablet') return 480;
  return undefined;
}
