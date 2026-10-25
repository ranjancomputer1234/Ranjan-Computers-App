import {Platform} from 'react-native';

/**
 * Keep enough rows around the viewport for fast flings without mounting an
 * entire feed. Smaller batches also leave more of each frame for gestures and
 * native animations on high-refresh-rate displays.
 */
export const virtualizedListPerformanceProps = {
  initialNumToRender: 8,
  maxToRenderPerBatch: 8,
  updateCellsBatchingPeriod: 24,
  windowSize: 7,
  removeClippedSubviews: Platform.OS === 'android',
} as const;
