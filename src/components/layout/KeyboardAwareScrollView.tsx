import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
  type ScrollViewProps,
} from 'react-native';
import {useKeyboardBottomInset} from './useKeyboardBottomInset';

const FOCUS_GAP = 28;
const SCROLL_SETTLE_MS = Platform.OS === 'ios' ? 60 : 120;

type Props = ScrollViewProps & {
  /** Extra space kept between the focused field and the keyboard. */
  keyboardGap?: number;
  /** Extra bottom breathing room once the keyboard is open. */
  bottomLift?: number;
  /**
   * When false, still scrolls the focused field into view but does not add
   * keyboard padding (use when a parent already lifts for the keyboard).
   */
  padForKeyboard?: boolean;
};

/**
 * ScrollView that keeps the focused text field above the soft keyboard
 * across iOS and Android — used for every form surface in the app.
 */
export const KeyboardAwareScrollView = React.forwardRef<ScrollViewInstance, Props>(
  function KeyboardAwareScrollView(
    {
      children,
      contentContainerStyle,
      keyboardShouldPersistTaps = 'handled',
      keyboardDismissMode = Platform.OS === 'ios' ? 'interactive' : 'on-drag',
      keyboardGap = FOCUS_GAP,
      bottomLift = 16,
      padForKeyboard = true,
      onScroll,
      ...rest
    },
    ref,
  ) {
    const innerRef = React.useRef<ScrollViewInstance | null>(null);
    const scrollY = React.useRef(0);
    const frame = useKeyboardBottomInset();
    const {height: windowHeight} = useWindowDimensions();
    const restingHeight = React.useRef(windowHeight);
    const pendingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
      if (frame.height === 0) restingHeight.current = windowHeight;
    }, [frame.height, windowHeight]);

    // iOS: Screen already uses KeyboardAvoidingView, so only scroll into view.
    // Android: pad by whatever adjustResize did not already shrink away.
    const resizedAway = Math.max(0, restingHeight.current - windowHeight);
    const keyboardInset =
      padForKeyboard && Platform.OS === 'android' && frame.height > 0
        ? Math.max(0, frame.height - resizedAway) + bottomLift
        : 0;

    const setRefs = React.useCallback(
      (node: ScrollViewInstance | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const ensureFocusedVisible = React.useCallback(() => {
      const keyboardTop = frame.screenY;
      if (!keyboardTop || !innerRef.current) return;

      const focused = TextInput.State.currentlyFocusedInput?.();
      if (!focused || typeof focused.measureInWindow !== 'function') return;

      focused.measureInWindow((_x: number, y: number, _w: number, height: number) => {
        if (!Number.isFinite(y) || !Number.isFinite(height)) return;
        const fieldBottom = y + height + keyboardGap;
        const overlap = fieldBottom - keyboardTop;
        if (overlap <= 0) return;
        innerRef.current?.scrollTo({
          y: Math.max(0, scrollY.current + overlap),
          animated: true,
        });
      });
    }, [frame.screenY, keyboardGap]);

    const scheduleEnsureVisible = React.useCallback(() => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      pendingTimer.current = setTimeout(() => {
        pendingTimer.current = null;
        ensureFocusedVisible();
      }, SCROLL_SETTLE_MS);
    }, [ensureFocusedVisible]);

    React.useEffect(() => {
      if (frame.height > 0) scheduleEnsureVisible();
      return () => {
        if (pendingTimer.current) clearTimeout(pendingTimer.current);
      };
    }, [frame.height, frame.screenY, keyboardInset, scheduleEnsureVisible]);

    // Capture TextInput focus bubbling through the scroll content (next-field focus).
    const onContentFocus = React.useCallback(() => {
      scheduleEnsureVisible();
    }, [scheduleEnsureVisible]);

    const handleScroll = React.useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollY.current = event.nativeEvent.contentOffset.y;
        onScroll?.(event);
      },
      [onScroll],
    );

    const flattened = StyleSheet.flatten(contentContainerStyle) ?? {};
    const baseBottom =
      typeof flattened.paddingBottom === 'number'
        ? flattened.paddingBottom
        : typeof flattened.padding === 'number'
          ? flattened.padding
          : 0;

    return (
      <ScrollView
        {...rest}
        ref={setRefs}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        automaticallyAdjustKeyboardInsets={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onFocus={onContentFocus}
        contentContainerStyle={[
          contentContainerStyle,
          keyboardInset > 0 ? {paddingBottom: baseBottom + keyboardInset} : null,
        ]}>
        {children}
      </ScrollView>
    );
  },
);
