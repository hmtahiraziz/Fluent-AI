import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform, type KeyboardEvent } from 'react-native';

function resolveKeyboardHeight(event: KeyboardEvent): number {
  const windowHeight = Dimensions.get('window').height;
  const fromScreenY = windowHeight - event.endCoordinates.screenY;
  const reported = event.endCoordinates.height;

  // Android often under-reports height; screenY is more reliable.
  return Math.max(fromScreenY, reported, 0);
}

export function useKeyboardInset(onShow?: () => void) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, event => {
      setHeight(resolveKeyboardHeight(event));
      onShow?.();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [onShow]);

  return height;
}
