import React from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';

type Props = {
  /** Quieter light when a photo already fills the card. */
  overImage?: boolean;
};

const surfaceLayers = [
  'radial-gradient(ellipse 78% 90% at 108% -8%, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.10) 34%, transparent 66%)',
  'radial-gradient(ellipse 64% 56% at -14% 120%, rgba(255,255,255,0.18) 0%, transparent 62%)',
  'linear-gradient(164deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 26%, transparent 48%)',
  'linear-gradient(180deg, transparent 46%, rgba(0,16,24,0.22) 100%)',
];

const overImageLayers = [
  'radial-gradient(ellipse 72% 80% at 100% 0%, rgba(255,255,255,0.22) 0%, transparent 58%)',
  'linear-gradient(180deg, transparent 42%, rgba(4,12,28,0.24) 100%)',
];

/**
 * Layered light for gradient hero cards: a key light, a low fill,
 * a top sheen, and a bottom vignette.
 */
export function CardAtmosphere({overImage = false}: Props) {
  const layers = overImage ? overImageLayers : surfaceLayers;
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, overImage ? null : styles.rim]}>
      {layers.map(image => (
        <View key={image} style={[StyleSheet.absoluteFill, wash(image)]} />
      ))}
      {overImage ? null : <View style={styles.highlight} />}
    </View>
  );
}

function wash(image: string): ViewStyle {
  return {experimental_backgroundImage: image} as ViewStyle;
}

const styles = StyleSheet.create({
  rim: {
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
