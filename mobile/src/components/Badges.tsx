import { Text, View } from 'react-native';
import { languageMeta } from '../config/constants';
import type { CefrLevel } from '../config/constants';

export function LevelBadge({ level }: { level: string }) {
  return (
    <View className="rounded-lg border border-gold/40 bg-gold/15 px-2.5 py-1">
      <Text className="text-xs font-bold text-ink">{level}</Text>
    </View>
  );
}

export function LanguageBadge({ code }: { code: string }) {
  const meta = languageMeta(code);
  return (
    <View className="flex-row items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1">
      <Text className="text-sm">{meta.flag}</Text>
      <Text className="text-xs font-semibold text-ink">{meta.label}</Text>
    </View>
  );
}

export { MascotHero, MascotBubble, AuthHero } from './MascotBubble';

export type { CefrLevel };
