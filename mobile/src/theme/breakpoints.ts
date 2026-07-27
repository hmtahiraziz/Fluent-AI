export type Breakpoint = 'compact' | 'phone' | 'tablet' | 'wide';

export const BREAKPOINTS = {
  compact: 380,
  tablet: 600,
  wide: 900,
} as const;

export function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.compact) return 'compact';
  if (width < BREAKPOINTS.tablet) return 'phone';
  if (width < BREAKPOINTS.wide) return 'tablet';
  return 'wide';
}

export function contentMaxWidth(breakpoint: Breakpoint): number {
  switch (breakpoint) {
    case 'wide':
      return 800;
    case 'tablet':
      return 640;
    default:
      return 480;
  }
}

export function horizontalPadding(breakpoint: Breakpoint): number {
  switch (breakpoint) {
    case 'wide':
      return 40;
    case 'tablet':
      return 32;
    default:
      return 20;
  }
}

export function gridColumns(breakpoint: Breakpoint, compactCols = 1): number {
  if (compactCols === 1) {
    switch (breakpoint) {
      case 'wide':
      case 'tablet':
        return 2;
      default:
        return 1;
    }
  }

  switch (breakpoint) {
    case 'wide':
      return 4;
    case 'tablet':
      return 3;
    case 'phone':
      return 2;
    default:
      return compactCols;
  }
}
