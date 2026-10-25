import React from 'react';
import {Animated, StyleSheet, useWindowDimensions, View} from 'react-native';
import {SplashDeskBackdrop} from '../../screens/splash/SplashDeskBackdrop';
import {useTheme} from '../../theme/ThemeProvider';

const still = new Animated.Value(0);

/**
 * School-desk stationery on a plain white sheet. Books, copies, pens, and
 * pencils stay at 20% opacity (80% transparent) so the page stays clear.
 */
export function StudyPaperBackdrop() {
  const theme = useTheme();
  const {width} = useWindowDimensions();
  if (theme.scheme === 'dark') return null;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.root}>
      <View style={styles.desk}>
        <SplashDeskBackdrop compact={width < 360} drift={still} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  desk: {
    ...StyleSheet.absoluteFill,
    opacity: 0.2,
  },
});
