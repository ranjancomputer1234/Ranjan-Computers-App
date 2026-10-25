import React from 'react';
import Svg, {Circle, Path, Rect, Text as SvgText} from 'react-native-svg';
import {Image, View} from 'react-native';
import {AppText} from '../components/ui/AppText';

const raciLogo = require('./images/raci-logo.jpeg');

export function RediLogo({
  size = 44,
  borderColor,
}: {
  size?: number;
  borderColor?: string;
}) {
  return (
    <Image
      source={raciLogo}
      accessibilityLabel="RACI logo"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: borderColor ? 2 : 0,
        borderColor: borderColor ?? 'transparent',
        backgroundColor: '#000',
      }}
      resizeMode="cover"
    />
  );
}

export function Chalkboard({lines = ['Learn', 'Practice', 'Grow']}: {lines?: string[]}) {
  return (
    <View
      style={{
        width: 136,
        height: 104,
        borderRadius: 12,
        backgroundColor: '#1C2B3A',
        borderWidth: 5,
        borderColor: '#6D4C2F',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {lines.map(line => (
        <AppText key={line} face="caveat" weight="700" size={15} color="#ECEFF1">
          {line}
        </AppText>
      ))}
    </View>
  );
}

export function TeacherArt({width = 64, height = 84}: {width?: number; height?: number}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 84">
      <Path d="M18 84V58c0-9 7-16 16-16h4c9 0 16 7 16 16v26z" fill="#263238" />
      <Path d="M22 84V60c0-7 5-12 12-12h2c7 0 12 5 12 12v24z" fill="#37474F" />
      <Circle cx={34} cy={28} r={12} fill="#8D6E63" />
      <Path d="M22 26c0-8 5-13 12-13s12 5 12 13l-2 2-1-6c-3 2-15 2-18 0l-1 6z" fill="#263238" />
      <Circle cx={29} cy={29} r={3.2} fill="none" stroke="#ECEFF1" strokeWidth={1.6} />
      <Circle cx={39} cy={29} r={3.2} fill="none" stroke="#ECEFF1" strokeWidth={1.6} />
      <Path d="M32.2 29h3.6" stroke="#ECEFF1" strokeWidth={1.6} />
      <Path d="M28 38c2 2.5 10 2.5 12 0" stroke="#5D4037" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M54 34c3-6 3-12 0-16" stroke="#FDD835" strokeWidth={3} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function BooksArt({width = 74, height = 40}: {width?: number; height?: number}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 74 40">
      <Rect x={2} y={26} width={66} height={7} rx={2} fill="#1565C0" />
      <Rect x={6} y={18} width={56} height={7} rx={2} fill="#F57C00" />
      <Rect x={10} y={10} width={48} height={7} rx={2} fill="#43A047" />
      <Rect x={18} y={4} width={20} height={4} rx={1.5} fill="#FFD54F" />
      <SvgText x={37} y={22.5} fontSize={4.6} fontWeight="700" fill="#fff" textAnchor="middle">
        Better Skills
      </SvgText>
      <SvgText x={35} y={31} fontSize={4.6} fontWeight="700" fill="#fff" textAnchor="middle">
        Brighter Future
      </SvgText>
    </Svg>
  );
}

export function PlanetArt({size = 86}: {size?: number}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#0D1B3E',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: '#FFB74D',
          boxShadow: 'inset -5px -5px 10px rgba(192,98,0,0.45), inset 3px 3px 7px rgba(255,255,255,0.6)',
        }}
      />
    </View>
  );
}
