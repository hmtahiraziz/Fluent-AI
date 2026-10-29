import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FluentAIBrand } from '../brand/FluentAILogo';
import { colors, spacing } from '../../theme/tokens';

const SIDE_SLOT = 76;

type AuthHeaderProps = {
  onBack?: () => void;
  horizontalPadding?: number;
  iconSize?: number;
  /** Extra space under the brand before following content (scroll headers). */
  bottomSpacing?: number;
};

/**
 * Safe-area aware auth header. Equal side slots keep the brand centered
 * without clipping icon overflow or crowding the back control.
 */
export function AuthHeader({
  onBack,
  horizontalPadding = spacing.container,
  iconSize = 32,
  bottomSpacing = spacing.sm,
}: AuthHeaderProps) {
  const insets = useSafeAreaInsets();
  // Icon mark canvas is slightly larger than iconSize (speech-dot overflow).
  const brandRowMinHeight = Math.max(44, Math.ceil(iconSize * 1.35));

  return (
    <View
      style={{
        backgroundColor: colors.canvas,
        paddingTop: Math.max(insets.top, 12) + 8,
        paddingBottom: bottomSpacing,
        paddingHorizontal: horizontalPadding,
      }}>
      <View
        className="flex-row items-center"
        style={{ minHeight: brandRowMinHeight }}>
        <View style={{ width: SIDE_SLOT, alignItems: 'flex-start' }}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="h-10 flex-row items-center justify-center rounded-full px-3"
              style={({ pressed }) => ({
                backgroundColor: pressed
                  ? colors.surfaceContainerHighest
                  : colors.surfaceContainer,
              })}>
              <Text className="text-sm font-bold text-brand">← Back</Text>
            </Pressable>
          ) : null}
        </View>

        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 4,
          }}>
          <FluentAIBrand iconSize={iconSize} />
        </View>

        <View style={{ width: SIDE_SLOT }} />
      </View>
    </View>
  );
}
