import { Platform } from 'react-native';

/**
 * Bottom padding for sticky composers, modal CTAs, and footers so controls
 * never sit under the Android/iOS system navigation bar or home indicator.
 *
 * When the keyboard is open, parent KeyboardStickyView already clears the
 * keyboard — only keep a small visual gap (do not re-add the system inset).
 */
export function bottomChromePadding(
  insetBottom: number,
  options?: { keyboardOpen?: boolean; extra?: number },
): number {
  if (options?.keyboardOpen) {
    return 10;
  }
  // Android 3-button nav / gesture bar: never rely on a 0 inset alone.
  const floor = Platform.OS === 'android' ? 28 : 10;
  const extra = options?.extra ?? 16;
  return Math.max(insetBottom, floor) + extra;
}
