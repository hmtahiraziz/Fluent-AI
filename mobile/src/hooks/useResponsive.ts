import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  contentMaxWidth,
  getBreakpoint,
  gridColumns,
  horizontalPadding,
  type Breakpoint,
} from '../theme/breakpoints';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const breakpoint = getBreakpoint(width);
    return {
      width,
      height,
      breakpoint,
      isCompact: breakpoint === 'compact',
      isPhone: breakpoint === 'phone' || breakpoint === 'compact',
      isTablet: breakpoint === 'tablet' || breakpoint === 'wide',
      isWide: breakpoint === 'wide',
      contentMaxWidth: contentMaxWidth(breakpoint),
      horizontalPadding: horizontalPadding(breakpoint),
      columns: (compactCols = 1) => gridColumns(breakpoint, compactCols),
      displayTitleClass:
        breakpoint === 'wide' || breakpoint === 'tablet'
          ? 'text-4xl'
          : 'text-3xl',
      sectionTitleClass:
        breakpoint === 'wide' || breakpoint === 'tablet'
          ? 'text-2xl'
          : 'text-xl',
    };
  }, [width, height]);
}

export type ResponsiveInfo = ReturnType<typeof useResponsive> & {
  breakpoint: Breakpoint;
};
