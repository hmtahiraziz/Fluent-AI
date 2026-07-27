import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { softShadow } from '../../theme/glass';

export const BRAND_ICON_PURPLE = '#5A62A3';

type AppIconMarkProps = {
  size?: number;
  style?: ViewStyle;
};

export function AppIconMark({ size = 48, style }: AppIconMarkProps) {
  const corner = size * 0.22;
  const dotSize = size * 0.22;
  const canvas = size + dotSize * 0.35;

  return (
    <View
      accessibilityLabel="FluentAI"
      style={[{ width: canvas, height: canvas }, style]}>
      <Svg width={canvas} height={canvas} viewBox={`0 0 ${canvas} ${canvas}`}>
        <Rect
          x={0}
          y={dotSize * 0.2}
          width={size}
          height={size}
          rx={corner}
          ry={corner}
          fill={BRAND_ICON_PURPLE}
        />
        <Path
          d={`M ${size * 0.28} ${size * 0.72} 
              C ${size * 0.34} ${size * 0.38}, ${size * 0.42} ${size * 0.28}, ${size * 0.5} ${size * 0.28}
              C ${size * 0.58} ${size * 0.28}, ${size * 0.66} ${size * 0.38}, ${size * 0.72} ${size * 0.72}
              M ${size * 0.38} ${size * 0.54} L ${size * 0.62} ${size * 0.54}`}
          stroke="#FFFFFF"
          strokeWidth={size * 0.07}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          transform={`translate(0, ${dotSize * 0.2})`}
        />
        <Circle
          cx={size - dotSize * 0.15}
          cy={dotSize * 0.35}
          r={dotSize / 2}
          fill={BRAND_ICON_PURPLE}
        />
      </Svg>
    </View>
  );
}

export function AppIconMarkShadow({ size = 48, style }: AppIconMarkProps) {
  return (
    <View style={softShadow(8)}>
      <AppIconMark size={size} style={style} />
    </View>
  );
}
