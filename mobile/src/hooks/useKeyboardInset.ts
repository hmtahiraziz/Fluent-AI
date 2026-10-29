import { useEffect, useRef } from 'react';
import { useKeyboardState } from 'react-native-keyboard-controller';

/**
 * Cross-platform keyboard height powered by react-native-keyboard-controller.
 * Returns 0 when the keyboard is hidden.
 */
export function useKeyboardInset(onShow?: () => void) {
  const height = useKeyboardState(state => (state.isVisible ? state.height : 0));
  const isVisible = useKeyboardState(state => state.isVisible);
  const onShowRef = useRef(onShow);
  onShowRef.current = onShow;

  useEffect(() => {
    if (isVisible) {
      onShowRef.current?.();
    }
  }, [isVisible]);

  return height;
}
