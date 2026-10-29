import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import type { TabRouteName } from '../theme/tabBar';

type IconProps = {
  color: string;
  size?: number;
};

function HomeIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function WordsIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4.75h9.5A2.75 2.75 0 0 1 17.25 7.5v12.25L12 17.25l-5.25 2.5V7.5A2.75 2.75 0 0 1 9.5 4.75"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path
        d="M17.25 7.5h1.25A2.75 2.75 0 0 1 21.25 10.25V19.5L17.25 17.6"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ProfileIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={9} r={3.25} stroke={color} strokeWidth={1.75} />
      <Path
        d="M5.75 19.25c.9-3 2.95-4.5 6.25-4.5s5.35 1.5 6.25 4.5"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const ICONS: Record<TabRouteName, React.ComponentType<IconProps>> = {
  Practice: HomeIcon,
  Vocabulary: WordsIcon,
  Settings: ProfileIcon,
};

export function TabIcon({
  name,
  color,
  size = 22,
}: {
  name: TabRouteName;
  color: string;
  size?: number;
}) {
  const Icon = ICONS[name];
  return <Icon color={color} size={size} />;
}
