import React from 'react';
import {Keyboard, Platform} from 'react-native';

type KeyboardFrame = {
  /** Distance from the top of the screen to the top of the keyboard. */
  screenY: number;
  /** Keyboard height reported by the OS. */
  height: number;
};

/**
 * Tracks the soft keyboard frame so screens can keep focused fields visible.
 * Uses will* events on iOS for smoother animation and did* on Android.
 */
export function useKeyboardBottomInset(): KeyboardFrame {
  const [frame, setFrame] = React.useState<KeyboardFrame>({screenY: 0, height: 0});

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, event => {
      setFrame({
        screenY: event.endCoordinates.screenY,
        height: Math.max(0, event.endCoordinates.height),
      });
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setFrame({screenY: 0, height: 0});
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  return frame;
}
