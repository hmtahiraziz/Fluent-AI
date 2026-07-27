import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

type ResponsiveGridProps = ViewProps & {
  children: React.ReactNode;
  compactCols?: number;
  gap?: number;
};

export function ResponsiveGrid({
  children,
  compactCols = 1,
  gap = 12,
  className = '',
  ...props
}: ResponsiveGridProps) {
  const { columns, width, horizontalPadding, contentMaxWidth } =
    useResponsive();
  const cols = columns(compactCols);
  const childArray = React.Children.toArray(children);
  const available =
    Math.min(width, contentMaxWidth) - horizontalPadding * 2;
  const itemWidth = (available - gap * (cols - 1)) / cols;

  return (
    <View
      className={`flex-row flex-wrap ${className}`}
      style={{ gap }}
      {...props}>
      {childArray.map((child, i) => (
        <View key={i} style={{ width: itemWidth }}>
          {child}
        </View>
      ))}
    </View>
  );
}
