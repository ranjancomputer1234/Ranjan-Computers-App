import React from 'react';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react-native';
import {ScrollView, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
  RefreshIndicatorHost,
  usePullRefreshFeedback,
} from '../src/components/ui/AppRefreshControl';
import {ThemeProvider} from '../src/theme/ThemeProvider';

const metrics = {
  frame: {x: 0, y: 0, width: 390, height: 844},
  insets: {top: 44, left: 0, right: 0, bottom: 34},
};

function pointer(pageY: number, previousPageY: number, timeStamp: number) {
  return {
    nativeEvent: {
      touches: [{identifier: 1, pageX: 10, pageY}],
      changedTouches: [{identifier: 1, pageX: 10, pageY}],
    },
    touchHistory: {
      mostRecentTimeStamp: timeStamp,
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      touchBank: [
        {
          touchActive: true,
          startPageX: 10,
          startPageY: 100,
          startTimeStamp: 1,
          currentPageX: 10,
          currentPageY: pageY,
          currentTimeStamp: timeStamp,
          previousPageX: 10,
          previousPageY,
          previousTimeStamp: timeStamp - 1,
        },
      ],
    },
  };
}

function PullRefreshHarness({
  onRefresh,
  refreshing = false,
}: {
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  const pullRefresh = usePullRefreshFeedback({refreshing, onRefresh});
  return (
    <>
      <View {...pullRefresh.gestureHandlers} testID="pull-gesture-surface">
        <ScrollView {...pullRefresh.scrollProps} testID="pull-surface" />
      </View>
      <RefreshIndicatorHost />
    </>
  );
}

test('shows the animated study-card indicator while a page refreshes', async () => {
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <PullRefreshHarness refreshing onRefresh={jest.fn()} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

  await waitFor(() => {
    expect(screen.getByText('Refreshing your page')).toBeOnTheScreen();
    expect(screen.getByText('Bringing in the latest lessons')).toBeOnTheScreen();
    expect(screen.getByLabelText('Refreshing this page')).toBeOnTheScreen();
  });
});

test('shows pull progress, release feedback, and the refresh animation', async () => {
  const onRefresh = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <PullRefreshHarness onRefresh={onRefresh} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

  const pullSurface = screen.getByTestId('pull-surface');
  const gestureSurface = screen.getByTestId('pull-gesture-surface');
  fireEvent(pullSurface, 'scroll', {nativeEvent: {contentOffset: {y: 0}}});
  await act(async () => {
    gestureSurface.props.onResponderGrant(pointer(100, 100, 10));
    gestureSurface.props.onResponderMove(pointer(155, 100, 20));
  });
  await waitFor(() => {
    expect(screen.getByText('Pull to refresh')).toBeOnTheScreen();
    expect(screen.getByText('Keep pulling to check for updates')).toBeOnTheScreen();
  });

  await act(async () => {
    gestureSurface.props.onResponderMove(pointer(210, 155, 30));
  });
  await waitFor(() => {
    expect(screen.getByText('Release to refresh')).toBeOnTheScreen();
    expect(screen.getByText('Let go to update your learning')).toBeOnTheScreen();
  });

  await act(async () => {
    gestureSurface.props.onResponderRelease(pointer(210, 210, 40));
  });

  await waitFor(() => {
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Refreshing your page')).toBeOnTheScreen();
    expect(screen.getByText('Bringing in the latest lessons')).toBeOnTheScreen();
  });
});
