import React from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import Svg, {Circle, Ellipse, G, Path, Rect} from 'react-native-svg';

/**
 * Corner flat-lay of study stationery. Objects stay cropped at the edges so the
 * wordmark and logo keep the middle of the splash.
 */
const paper = '#FFF8EE';
const paperShade = '#F4E9D6';
const paperLine = '#E5D6C2';
const kraft = '#E4BC82';
const kraftDeep = '#C99655';
const gold = '#FFE08A';
const goldDeep = '#E8B43C';
const sky = '#D6EBFF';
const skyDeep = '#7EB4F0';
const peach = '#FFD3BA';
const peachDeep = '#E7A888';
const ink = '#2A313C';
const eraserPink = '#F6B7C4';
const metal = '#E7EEF5';
const metalLine = '#C5D0DC';
const marginRed = '#E07A7A';
const ribbon = '#F07167';
const shadow = 'rgba(2, 12, 40, 0.28)';
const wood = '#F8E3BC';

type Props = {
  compact: boolean;
  drift: Animated.Value;
};

function PageEdge({x, y, height}: {x: number; y: number; height: number}) {
  const lines = Math.max(4, Math.floor(height / 2.4));
  return (
    <G>
      <Rect x={x} y={y} width={12} height={height} rx={1.4} fill={paper} />
      <Rect x={x} y={y} width={2} height={height} fill="rgba(90, 70, 40, 0.08)" />
      {Array.from({length: lines}, (_, index) => (
        <Rect key={index} x={x + 1} y={y + 1.2 + index * 2.4} width={10} height={0.55} fill={paperLine} />
      ))}
    </G>
  );
}

function FlatBook({
  x,
  y,
  fill,
  spine,
  marked,
}: {
  x: number;
  y: number;
  fill: string;
  spine: string;
  marked?: boolean;
}) {
  return (
    <G>
      <Rect x={x} y={y} width={108} height={30} rx={3.5} fill={fill} />
      <Rect x={x} y={y} width={11} height={30} rx={3} fill={spine} />
      <Rect x={x + 22} y={y + 9} width={46} height={3.2} rx={1.6} fill="rgba(255,255,255,0.72)" />
      <Rect x={x + 22} y={y + 16} width={30} height={2.4} rx={1.2} fill="rgba(255,255,255,0.42)" />
      <Rect x={x + 4} y={y + 3} width={2} height={24} rx={1} fill="rgba(255,255,255,0.28)" />
      <PageEdge x={x + 106} y={y + 3} height={24} />
      {marked ? <Path d={`M${x + 86} ${y} v14 l4.2-3.2 4.2 3.2 V${y} Z`} fill={ribbon} /> : null}
    </G>
  );
}

function BookStack({width}: {width: number}) {
  const height = width * (118 / 156);
  return (
    <Svg width={width} height={height} viewBox="0 0 156 118">
      <Ellipse cx={78} cy={110} rx={58} ry={5} fill={shadow} />
      <FlatBook x={6} y={74} fill={sky} spine={skyDeep} />
      <FlatBook x={14} y={42} fill={peach} spine={peachDeep} />
      <FlatBook x={22} y={10} fill={gold} spine={goldDeep} marked />
    </Svg>
  );
}

function OpenBook({width}: {width: number}) {
  const height = width * (112 / 180);
  return (
    <Svg width={width} height={height} viewBox="0 0 180 112">
      <Ellipse cx={90} cy={102} rx={70} ry={6} fill={shadow} />
      <Path d="M88 20C66 16 34 24 12 36l6 52c24-12 50-14 70-8V20Z" fill={paper} />
      <Path d="M92 20c22-4 54 4 76 16l-6 52c-24-12-50-14-70-8V20Z" fill={paperShade} />
      <Path d="M88 22c2 16 2 42 0 58 2-16 2-42 0-58Z" fill="#E7D8C2" />
      <Path d="M30 46c18-4 38-4 54 4M28 56c20-4 38-4 54 4M27 66c20-4 36-3 52 5" stroke={paperLine} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M150 46c-18-4-38-4-54 4M152 56c-20-4-38-4-54 4M153 66c-20-4-36-3-52 5" stroke={paperLine} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M118 20v22l6-4.5 6 4.5V20Z" fill={ribbon} />
    </Svg>
  );
}

function RuledCopy({width}: {width: number}) {
  const height = width * (142 / 108);
  const rings = [20, 34, 48, 62, 76, 90, 104, 118];
  return (
    <Svg width={width} height={height} viewBox="0 0 108 142">
      <Ellipse cx={58} cy={132} rx={36} ry={5} fill={shadow} />
      {rings.map(y => (
        <Circle key={`back-${y}`} cx={16} cy={y} r={5} fill="none" stroke={metal} strokeWidth={2} />
      ))}
      <Rect x={22} y={10} width={74} height={116} rx={5} fill={kraftDeep} />
      <Rect x={18} y={8} width={74} height={116} rx={4} fill={paper} />
      <Path d="M32 14v104" stroke={marginRed} strokeWidth={1.3} />
      {Array.from({length: 9}, (_, index) => (
        <Rect key={index} x={38} y={24 + index * 10} width={index === 8 ? 32 : 46} height={1.5} rx={0.7} fill="#D5E4F5" />
      ))}
      {rings.map(y => (
        <Path key={`front-${y}`} d={`M16 ${y - 5}a5 5 0 0 0 0 10`} stroke={metal} strokeWidth={2} fill="none" strokeLinecap="round" />
      ))}
    </Svg>
  );
}

function SchoolCopy({width}: {width: number}) {
  const height = width * (132 / 104);
  return (
    <Svg width={width} height={height} viewBox="0 0 104 132">
      <Ellipse cx={52} cy={124} rx={38} ry={5} fill={shadow} />
      <Rect x={14} y={12} width={76} height={106} rx={4} fill={kraftDeep} />
      <Rect x={10} y={8} width={76} height={106} rx={4} fill={kraft} />
      <Rect x={10} y={8} width={12} height={106} rx={3} fill={ribbon} />
      <Rect x={86} y={14} width={7} height={94} rx={1} fill={paper} />
      {Array.from({length: 8}, (_, index) => (
        <Rect key={index} x={86} y={18 + index * 11} width={7} height={0.8} fill={paperLine} />
      ))}
      <Rect x={30} y={32} width={46} height={40} rx={3} fill={paper} />
      <Rect x={36} y={42} width={34} height={3} rx={1.5} fill={paperLine} />
      <Rect x={36} y={50} width={22} height={2.4} rx={1.2} fill={paperLine} />
      <Rect x={36} y={58} width={28} height={2.4} rx={1.2} fill={paperLine} />
    </Svg>
  );
}

function CopyStack({width}: {width: number}) {
  const height = width * (128 / 112);
  return (
    <Svg width={width} height={height} viewBox="0 0 112 128">
      <Ellipse cx={56} cy={120} rx={40} ry={5} fill={shadow} />
      <Rect x={18} y={20} width={76} height={94} rx={3} fill="#E4D5C0" />
      <Rect x={12} y={14} width={76} height={94} rx={3} fill={paperShade} />
      <Path d="M6 8h52l22 22v72H6V8Z" fill={paper} />
      <Path d="M58 8l22 22H58V8Z" fill={paperShade} />
      <Path d="M58 8l22 22" stroke={paperLine} strokeWidth={1} fill="none" />
      {Array.from({length: 6}, (_, index) => (
        <Rect key={index} x={16} y={40 + index * 10} width={index === 5 ? 34 : 52} height={1.7} rx={0.8} fill={paperLine} />
      ))}
    </Svg>
  );
}

function PencilArt({height}: {height: number}) {
  const width = height * (28 / 168);
  return (
    <Svg width={width} height={height} viewBox="0 0 28 168">
      <Ellipse cx={14} cy={160} rx={8} ry={3.2} fill={shadow} />
      <Rect x={6} y={4} width={16} height={16} rx={3} fill={eraserPink} />
      <Rect x={5} y={18} width={18} height={14} rx={1} fill={metal} />
      <Rect x={5} y={21.5} width={18} height={2} fill={metalLine} />
      <Rect x={5} y={26.5} width={18} height={2} fill={metalLine} />
      <Rect x={6} y={32} width={16} height={86} fill={gold} />
      <Rect x={8} y={34} width={3} height={80} rx={1.5} fill="rgba(255,255,255,0.38)" />
      <Path d="M6 118h16l-8 36-8-36Z" fill={wood} />
      <Path d="M10 126h8l-4 24-4-24Z" fill={ink} />
      <Path d="M12.2 140h3.6L14 156l-1.8-16Z" fill="#111418" />
    </Svg>
  );
}

function PenArt({height, grip = '#1976D2'}: {height: number; grip?: string}) {
  const width = height * (26 / 164);
  return (
    <Svg width={width} height={height} viewBox="0 0 26 164">
      <Ellipse cx={13} cy={156} rx={7} ry={3} fill={shadow} />
      <Rect x={9} y={2} width={8} height={9} rx={2.5} fill={goldDeep} />
      <Path d="M6 12h14v48H6V12Z" fill={paper} />
      <Path d="M8 16h2.4v40H8V16Z" fill="rgba(255,255,255,0.8)" />
      <Path d="M18 16c5 1 6 4 6 7v26c0 3-2 4.5-4.5 3.4" stroke={paper} strokeWidth={2.3} fill="none" strokeLinecap="round" />
      <Rect x={5.5} y={60} width={15} height={7} rx={1.5} fill={gold} />
      <Path d="M6 67h14v58c0 3-3 6-7 6s-7-3-7-6V67Z" fill={paperShade} />
      <Path d="M8 72h2.3v48H8V72Z" fill="rgba(255,255,255,0.45)" />
      <Path d="M6.6 112h12.8v12H6.6v-12Z" fill={grip} />
      <Path d="M8.2 124 13 150l4.8-26H8.2Z" fill={metal} />
      <Circle cx={13} cy={148.5} r={1.35} fill={ink} />
    </Svg>
  );
}

type Edge = number | `${number}%`;

type Piece = {
  key: string;
  top?: Edge;
  left?: Edge;
  right?: Edge;
  bottom?: Edge;
  rotate: string;
  opacity: number;
  bob: 'up' | 'down';
  art: React.ReactNode;
};

export function SplashDeskBackdrop({compact, drift}: Props) {
  const unit = compact ? 0.78 : 1;
  const driftUp = drift.interpolate({inputRange: [0, 1], outputRange: [0, -6]});
  const driftDown = drift.interpolate({inputRange: [0, 1], outputRange: [0, 5]});

  const pieces: Piece[] = [
    {
      key: 'copy-tl',
      top: 6 * unit,
      left: -32 * unit,
      rotate: '-12deg',
      opacity: 0.9,
      bob: 'down',
      art: <SchoolCopy width={116 * unit} />,
    },
    {
      key: 'pencil-tl',
      top: -28 * unit,
      left: -22 * unit,
      rotate: '-34deg',
      opacity: 0.92,
      bob: 'up',
      art: <PencilArt height={150 * unit} />,
    },
    {
      key: 'books-tr',
      top: -32 * unit,
      right: -48 * unit,
      rotate: '8deg',
      opacity: 0.94,
      bob: 'down',
      art: <BookStack width={168 * unit} />,
    },
    {
      key: 'pen-tr',
      top: 92 * unit,
      right: -28 * unit,
      rotate: '26deg',
      opacity: 0.88,
      bob: 'up',
      art: <PenArt height={164 * unit} />,
    },
    {
      key: 'notebook-ml',
      top: '37%',
      left: -54 * unit,
      rotate: '14deg',
      opacity: 0.66,
      bob: 'up',
      art: <RuledCopy width={96 * unit} />,
    },
    {
      key: 'sheets-mr',
      top: '39%',
      right: -52 * unit,
      rotate: '-13deg',
      opacity: 0.64,
      bob: 'down',
      art: <CopyStack width={104 * unit} />,
    },
    {
      key: 'book-bl',
      bottom: -28 * unit,
      left: -58 * unit,
      rotate: '-9deg',
      opacity: 0.9,
      bob: 'down',
      art: <OpenBook width={158 * unit} />,
    },
    {
      key: 'pencil-bl',
      bottom: 42 * unit,
      left: 2 * unit,
      rotate: '18deg',
      opacity: 0.88,
      bob: 'up',
      art: <PencilArt height={118 * unit} />,
    },
    {
      key: 'copies-br',
      bottom: -34 * unit,
      right: -46 * unit,
      rotate: '8deg',
      opacity: 0.9,
      bob: 'up',
      art: <CopyStack width={128 * unit} />,
    },
    {
      key: 'pen-br',
      bottom: 34 * unit,
      right: 0,
      rotate: '-16deg',
      opacity: 0.88,
      bob: 'down',
      art: <PenArt height={122 * unit} grip="#F07167" />,
    },
  ];

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.root}>
      {pieces.map(piece => (
        <Animated.View
          key={piece.key}
          style={[
            styles.piece,
            {
              top: piece.top,
              left: piece.left,
              right: piece.right,
              bottom: piece.bottom,
              opacity: piece.opacity,
              transform: [{translateY: piece.bob === 'up' ? driftUp : driftDown}, {rotate: piece.rotate}],
            },
          ]}>
          {piece.art}
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden'},
  piece: {position: 'absolute'},
});
