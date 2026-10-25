/* Auto-generated from RACI-App-UI-Design HTML SVG symbols. Do not edit by hand. */
import React from 'react';
import Svg, { Path, Circle, Rect, Ellipse, G } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';

export const ICON_NAMES = [
  "atom",
  "award",
  "back",
  "balloon",
  "bank",
  "batt",
  "bell",
  "book",
  "bookmark",
  "bookopen",
  "brain",
  "bulb",
  "cal",
  "caltick",
  "cam",
  "cap",
  "capitol",
  "card",
  "chakra",
  "chart",
  "chat",
  "check",
  "chev",
  "clipboard",
  "clock",
  "cpu",
  "crown",
  "css3s",
  "dam",
  "deer",
  "doc",
  "dome",
  "download",
  "edit",
  "ellipsis",
  "eye",
  "feather",
  "file",
  "flag",
  "flask",
  "gate",
  "gear",
  "gift",
  "globe",
  "gpay",
  "gradcap",
  "heart",
  "help",
  "home",
  "hourglass",
  "html5",
  "html5s",
  "india",
  "kebab",
  "keyboard",
  "live",
  "lock",
  "logout",
  "map",
  "max",
  "medal",
  "mic",
  "micoff",
  "monitor",
  "moon",
  "mountain",
  "news",
  "para",
  "pillar",
  "pin",
  "play",
  "police",
  "python",
  "qr",
  "refresh",
  "rupee",
  "search",
  "send",
  "share",
  "shield",
  "sig",
  "skipb",
  "skipf",
  "slider",
  "star",
  "target",
  "teacher",
  "train",
  "trees",
  "trendup",
  "trophy",
  "user",
  "users",
  "verify",
  "video",
  "vol",
  "waterfall",
  "waves",
  "wifi",
  "zap"
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Icon({
  name,
  size = 22,
  color = '#1A237E',
  strokeWidth = 2,
  fill = 'none',
  filled,
  style,
}: IconProps) {
  const resolvedFill = filled ? color : fill;
  switch (name) {
    case 'atom':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Circle cx={12} cy={12} r={1} />
        <Path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
        <Path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
        </Svg>
      );
    case 'award':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Circle cx={12} cy={8} r={6} />
        <Path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
        </Svg>
      );
    case 'back':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m15 18-6-6 6-6" />
        </Svg>
      );
    case 'balloon':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 3.6 3 5.8 3.8 8.7h7.4c.8-2.9 3.8-5.1 3.8-8.7A7.5 7.5 0 0 0 12 2z" />
        <Path d="M9.4 4.3C7.9 5.9 7.2 8 7.3 10.2M14.6 4.3c1.5 1.6 2.2 3.7 2.1 5.9" />
        <Path d="M10.6 18.2c-.2 1.5.8 2 .8 3.1M13.4 18.2c.2 1.5-.8 2-.8 3.1M10 21.5h4" />
        </Svg>
      );
    case 'bank':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M3 22h18" />
        <Path d="M6 22V11M10 22V11M14 22V11M18 22V11" />
        <Path d="m12 2-9 6h18z" />
        </Svg>
      );
    case 'batt':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Rect x={1} y={7} width={19} height={10} rx={3} />
        <Path d="M22 11v2" />
        <Rect x={3} y={9} width={13} height={6} rx={1.5} />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </Svg>
      );
    case 'book':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </Svg>
      );
    case 'bookmark':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </Svg>
      );
    case 'bookopen':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </Svg>
      );
    case 'brain':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <Path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        <Path d="M12 5v13" />
        </Svg>
      );
    case 'bulb':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <Path d="M9 18h6M10 22h4" />
        </Svg>
      );
    case 'cal':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Rect x={3} y={4} width={18} height={18} rx={2} />
        <Path d="M16 2v4M8 2v4M3 10h18" />
        </Svg>
      );
    case 'caltick':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Rect x={3} y={4} width={18} height={18} rx={2} />
        <Path d="M16 2v4M8 2v4M3 10h18" />
        <Path d="m9 15 2 2 4-4" />
        </Svg>
      );
    case 'cam':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
        <Circle cx={12} cy={13} r={3} />
        </Svg>
      );
    case 'cap':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m22 9.5-10-4.5L2 9.5l10 4.5 10-4.5z" />
        <Path d="M6 11.8v4.2c0 1.5 2.7 2.7 6 2.7s6-1.2 6-2.7v-4.2" />
        </Svg>
      );
    case 'capitol':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M3 21h18" />
        <Path d="M5 21v-8h14v8" />
        <Path d="M9 13V9h6v4" />
        <Path d="M12 3 7 8h10z" />
        <Path d="M8 21v-4M12 21v-4M16 21v-4" />
        </Svg>
      );
    case 'card':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Rect x={2} y={5} width={20} height={14} rx={2} />
        <Path d="M2 10h20" />
        </Svg>
      );
    case 'chakra':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Circle cx={12} cy={12} r={9} />
        <Circle cx={12} cy={12} r={2.6} />
        <Path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
        </Svg>
      );
    case 'chart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m22 7-8.5 8.5-5-5L2 17" />
        <Path d="M16 7h6v6" />
        </Svg>
      );
    case 'chat':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M22 11.1V12a10 10 0 1 1-5.93-9.14" />
        <Path d="m9 11 3 3L22 4" />
        </Svg>
      );
    case 'chev':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m9 18 6-6-6-6" />
        </Svg>
      );
    case 'clipboard':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Rect x={8} y={2} width={8} height={4} rx={1} />
        <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <Path d="M9 13h6M9 17h4" />
        </Svg>
      );
    case 'clock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Circle cx={12} cy={12} r={9} />
        <Path d="M12 7v5l3 3" />
        </Svg>
      );
    case 'cpu':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Rect x={5} y={5} width={14} height={14} rx={2} />
        <Rect x={9} y={9} width={6} height={6} />
        <Path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
        </Svg>
      );
    case 'crown':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M3 8l4 4 5-6 5 6 4-4v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        </Svg>
      );
    case 'css3s':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path fill="#1572B6" d="M4 2h16l-1.4 17.2L12 22l-4.6-2.8z" />
        <Path fill="#33A9DC" d="M12 3.5h6.7l-1.2 14L12 19.4z" />
        <Path fill="#fff" d="M12 6.6v9.9l3.1-.9.6-4.4h-3.1l.1-1.6h3.4l.2-2.2H12z" opacity={0} />
        <Path fill="#EBEBEB" d="M12 11H8.9l-.2-2.2H12V6.6H6.5l.1.9.4 5.5H12zm0 5.6-3.4-.9-.2-2.2H6.9l.3 3.5 4.8 1.3z" />
        <Path fill="#fff" d="M12 11v2.2h3.1l-.3 3.3-2.8.9v2.3l4.8-1.3.7-7.4z" />
        <Path fill="#fff" d="M12 6.6v2.2h5.2l.1-.9.2-1.3z" />
        </Svg>
      );
    case 'dam':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M2 6h20" />
        <Path d="M4 6v15M20 6v15" />
        <Path d="M7 21v-4a5 5 0 0 1 10 0v4" />
        <Path d="M2 21h20" />
        <Path d="M9.5 13c.5.4 1 .7 2.5.7s2-.3 2.5-.7" />
        </Svg>
      );
    case 'deer':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Ellipse cx={12} cy={13.5} rx={3} ry={3.5} />
        <Path d="M8.8 10.5C7 8.6 7 6.2 8.5 3.5c.6 1.6 1.8 2.5 3.5 2.5s2.9-.9 3.5-2.5c1.5 2.7 1.5 5.1-.3 7" />
        <Path d="m6.5 13 2 1.5M17.5 13l-2 1.5M12 17v3" />
        </Svg>
      );
    case 'doc':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <Path d="M14 2v6h6" />
        <Path d="M16 13H8M16 17H8M10 9H8" />
        </Svg>
      );
    case 'dome':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M3 21h18" />
        <Path d="M5 21v-8h14v8" />
        <Path d="M7 13V9h10v4" />
        <Path d="M12 2 8 8h8z" />
        <Path d="M2 13h20" />
        </Svg>
      );
    case 'download':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </Svg>
      );
    case 'edit':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <Path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" />
        </Svg>
      );
    case 'ellipsis':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Circle cx={5} cy={12} r={1.3} />
        <Circle cx={12} cy={12} r={1.3} />
        <Circle cx={19} cy={12} r={1.3} />
        </Svg>
      );
    case 'eye':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <Circle cx={12} cy={12} r={3} />
        </Svg>
      );
    case 'feather':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
        <Path d="M16 8 2 22" />
        <Path d="M17.5 15H9" />
        </Svg>
      );
    case 'file':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <Path d="M14 2v6h6" />
        </Svg>
      );
    case 'flag':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <Path d="M4 22v-7" />
        </Svg>
      );
    case 'flask':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M8.5 2h7" />
        <Path d="M9 2v6.5L4.7 18.7A2 2 0 0 0 6.5 22h11a2 2 0 0 0 1.8-3.3L15 8.5V2" />
        <Path d="M7 15h10" />
        </Svg>
      );
    case 'gate':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M4 21h16" />
        <Path d="M6 21V8M18 21V8" />
        <Path d="M6 8c0-2.5 2.5-4 6-4s6 1.5 6 4H6z" />
        <Path d="M9 21v-7h6v7" />
        <Path d="M10 4V2M14 4V2" />
        </Svg>
      );
    case 'gear':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Circle cx={12} cy={12} r={3} />
        <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </Svg>
      );
    case 'gift':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Rect x={3} y={8} width={18} height={13} rx={2} />
        <Path d="M12 8v13M3 12h18" />
        <Path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
        </Svg>
      );
    case 'globe':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Circle cx={12} cy={12} r={10} />
        <Path d="M2 12h20" />
        <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </Svg>
      );
    case 'gpay':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path fill={color} stroke="none" d="M12 2 7.5 10.5h9L12 2Zm-4.7 8.5L3 18h5.6l3.4-5.8-1.4-2.4-3.3.7Zm9.4 0-3.3-.7-1.4 2.4L15.4 18H21l-4.3-7.5Z" />
        </Svg>
      );
    case 'gradcap':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m22 10-10-5L2 10l10 5 10-5z" />
        <Path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7Z" />
        </Svg>
      );
    case 'help':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Circle cx={12} cy={12} r={9} />
        <Path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
        <Path d="M12 17h.01" />
        </Svg>
      );
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <Path d="M9 22V12h6v10" />
        </Svg>
      );
    case 'hourglass':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M7 2v3.5L12 11l5-5.5V2M7 22v-3.5L12 13l5 5.5V22" />
        <Path d="M5 2h14M5 22h14" />
        </Svg>
      );
    case 'html5':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path fill="#E34F26" d="M4 2h16l-1.4 17.2L12 22l-4.6-2.8z" />
        <Path fill="#fff" opacity={0} d="M15.5 7H8l.3 2.5h6.9l-.4 2.5h-3.3v-.01H8.7l.35 2.6 2.95.8 2.95-.8.4-2.4h3.15l-.5 4.5L12 18.7l-4.6-1.15-.45-2.3h1.9l.3 1.3 2.85.75 2.85-.75.4-2.7H7.2L6.6 8h8.9z" />
        </Svg>
      );
    case 'html5s':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path fill="#E44D26" d="M4 2h16l-1.4 17.2L12 22l-4.6-2.8z" />
        <Path fill="#F16529" d="M12 3.5h6.7l-1.2 14L12 19.4z" />
        <Path fill="#EBEBEB" d="M12 11H8.9l-.2-2.2H12V6.6H6.5l.1.9.4 5.5H12zm0 5.6-3.4-.9-.2-2.2H6.9l.3 3.5 4.8 1.3z" />
        <Path fill="#fff" d="M12 11v2.2h3.4l-.35 3.4L12 17.4v2.3l4.8-1.3.7-7.4zm0-4.9v2.2h5.2l.1-.9.2-1.3z" />
        </Svg>
      );
    case 'india':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M13 2c1.5.5 2.5 1.6 2.6 3.2L14 6.8c1.8-.4 3.7.5 4.9 2.2l2.4-.9-.7 2.9 1.5 2.8-3 2.3-.4 2.9-3.6-.8-2.2 2.4-2.5-1.7-2.1 1.5-.5-3.1-2.6-1.5 1.1-3.1-1.4-2.8 3-1.3.6-3.1 3.1.3 2.4-1.6.9 1.4 2.3.4z" />
        </Svg>
      );
    case 'kebab':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Circle cx={12} cy={5} r={1.3} />
        <Circle cx={12} cy={12} r={1.3} />
        <Circle cx={12} cy={19} r={1.3} />
        </Svg>
      );
    case 'keyboard':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Rect x={2} y={6} width={20} height={12} rx={2} />
        <Path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" />
        </Svg>
      );
    case 'live':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
        <Path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
        <Circle cx={12} cy={12} r={2} />
        <Path d="M16.2 7.7c2.3 2.3 2.3 6.1 0 8.5" />
        <Path d="M19.1 4.9C23 8.8 23 15.1 19.1 19.1" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Rect x={4} y={11} width={16} height={10} rx={2} />
        <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </Svg>
      );
    case 'logout':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <Path d="m16 17 5-5-5-5M21 12H9" />
        </Svg>
      );
    case 'map':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
        <Path d="M9 3v15M15 6v15" />
        </Svg>
      );
    case 'max':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </Svg>
      );
    case 'medal':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M7.4 13.5 5 22l7-3 7 3-2.4-8.5" />
        <Circle cx={12} cy={9} r={6} />
        </Svg>
      );
    case 'mic':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
        </Svg>
      );
    case 'micoff':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m2 2 20 20" />
        <Path d="M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V5a3 3 0 0 0-5.9-.7" />
        <Path d="M19 10v2a7 7 0 0 1-11 5.7M12 19v3" />
        </Svg>
      );
    case 'monitor':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Rect x={2} y={3} width={20} height={14} rx={2} />
        <Path d="M8 21h8M12 17v4" />
        </Svg>
      );
    case 'moon':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </Svg>
      );
    case 'mountain':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m8 3 4 8 5-5 5 15H2L8 3z" />
        </Svg>
      );
    case 'news':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9h2" />
        <Path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
        </Svg>
      );
    case 'para':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M3 21h18" />
        <Path d="M5 21v-7h14v7" />
        <Path d="M7 14v-4h10v4" />
        <Path d="M9 10V7h6v3" />
        <Path d="M12 3v4" />
        <Path d="M2 14h20" />
        </Svg>
      );
    case 'pillar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M4 3h16" />
        <Path d="M5 6h14" />
        <Path d="M7 6v14M12 6v14M17 6v14" />
        <Path d="M4 22h16" />
        <Path d="M6 20h12" />
        </Svg>
      );
    case 'pin':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
        <Circle cx={12} cy={10} r={3} />
        </Svg>
      );
    case 'play':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m6 3 14 9-14 9z" />
        </Svg>
      );
    case 'police':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M4 16a8 8 0 0 1 16 0H4z" />
        <Path d="M2 16h20v4H2z" />
        <Circle cx={12} cy={11.5} r={1.5} />
        </Svg>
      );
    case 'python':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path fill="#3776AB" d="M11.9 2c-2.9 0-4.9 1.2-4.9 3.1v2.2h4.9v.8H5.3C3.4 8.1 2 9.6 2 12.1s1.4 4 3.3 4h1.7v-2.7c0-1.9 1.6-3.4 3.5-3.4h4.4c1.6 0 2.9-1.3 2.9-2.9V5.1C17.8 3.3 15.6 2 12.8 2z" />
        <Path fill="#FFD43B" d="M12.1 22c2.9 0 4.9-1.2 4.9-3.1v-2.2h-4.9v-.8h6.6c1.9 0 3.3-1.5 3.3-4s-1.4-4-3.3-4h-1.7v2.7c0 1.9-1.6 3.4-3.5 3.4H9.1c-1.6 0-2.9 1.3-2.9 2.9v2.4c0 1.8 2.2 3.7 5 3.7z" />
        <Circle fill="#fff" cx={9.6} cy={4.6} r={1} />
        <Circle fill="#fff" cx={14.4} cy={19.4} r={1} />
        </Svg>
      );
    case 'qr':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <G fill="currentColor" stroke="none">
          <Rect x={10.5} y={2} width={2} height={2} />
          <Rect x={10.5} y={6} width={2} height={2} />
          <Rect x={10.5} y={10.5} width={2} height={2} />
          <Rect x={2} y={10.5} width={2} height={2} />
          <Rect x={6} y={10.5} width={2} height={2} />
          <Rect x={14.5} y={10.5} width={2} height={2} />
          <Rect x={18.5} y={10.5} width={2} height={2} />
          <Rect x={10.5} y={14.5} width={2} height={2} />
          <Rect x={14.5} y={14.5} width={2} height={2} />
          <Rect x={18.5} y={14.5} width={2} height={2} />
          <Rect x={21} y={14.5} width={1.5} height={2} />
          <Rect x={10.5} y={18.5} width={2} height={2} />
          <Rect x={14.5} y={18.5} width={2} height={2} />
          <Rect x={14.5} y={21} width={2} height={1.5} />
          <Rect x={18.5} y={18.5} width={2} height={2} />
          <Rect x={21} y={18.5} width={1.5} height={2} />
          <Rect x={6} y={14.5} width={2} height={2} />
          <Rect x={2} y={18.5} width={2} height={2} />
          <Rect x={6} y={18.5} width={2} height={2} />
        </G>
        <Rect x={1.5} y={1.5} width={7} height={7} rx={1.2} fill="none" stroke="currentColor" strokeWidth={1.5} />
        <Rect x={4} y={4} width={2} height={2} fill="currentColor" stroke="none" />
        <Rect x={15.5} y={1.5} width={7} height={7} rx={1.2} fill="none" stroke="currentColor" strokeWidth={1.5} />
        <Rect x={18} y={4} width={2} height={2} fill="currentColor" stroke="none" />
        <Rect x={1.5} y={15.5} width={7} height={7} rx={1.2} fill="none" stroke="currentColor" strokeWidth={1.5} />
        <Rect x={4} y={18} width={2} height={2} fill="currentColor" stroke="none" />
        </Svg>
      );
    case 'refresh':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" />
        <Path d="M21 3v5h-5" />
        </Svg>
      );
    case 'rupee':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M6 3h12" />
        <Path d="M6 8h12" />
        <Path d="m6 13 8.5 8" />
        <Path d="M6 13h3" />
        <Path d="M9 13c6.667 0 6.667-10 0-10" />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Circle cx={11} cy={11} r={7} />
        <Path d="m21 21-4.3-4.3" />
        </Svg>
      );
    case 'send':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m22 2-7 20-4-9-9-4Z" />
        <Path d="m22 2-11 11" />
        </Svg>
      );
    case 'share':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Circle cx={18} cy={5} r={3} />
        <Circle cx={6} cy={12} r={3} />
        <Circle cx={18} cy={19} r={3} />
        <Path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </Svg>
      );
    case 'sig':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Rect x={1} y={14} width={4} height={6} rx={1} />
        <Rect x={7} y={10.5} width={4} height={9.5} rx={1} />
        <Rect x={13} y={7} width={4} height={13} rx={1} />
        <Rect x={19} y={3.5} width={4} height={16.5} rx={1} opacity=".4" />
        </Svg>
      );
    case 'skipb':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m19 4-10 8 10 8V4Z" />
        <Path d="M5 5v14" />
        </Svg>
      );
    case 'skipf':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m5 4 10 8-10 8V4Z" />
        <Path d="M19 5v14" />
        </Svg>
      );
    case 'slider':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
        </Svg>
      );
    case 'target':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Circle cx={12} cy={12} r={9} />
        <Circle cx={12} cy={12} r={5} />
        <Circle cx={12} cy={12} r={1.2} />
        </Svg>
      );
    case 'teacher':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M2 3h20" />
        <Path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
        <Path d="m7 21 5-5 5 5" />
        </Svg>
      );
    case 'train':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Rect x={5} y={3} width={14} height={13} rx={3} />
        <Path d="M5 10h14" />
        <Circle cx={9} cy={19} r={1.6} />
        <Circle cx={15} cy={19} r={1.6} />
        <Path d="M8 16l-2 4M16 16l2 4" />
        </Svg>
      );
    case 'trees':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M12 2 6.5 9H9l-4 7h5v6h4v-6h5l-4-7h2.5z" />
        </Svg>
      );
    case 'trendup':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M22 7l-8.5 8.5-5-5L2 17" />
        <Path d="M16 7h6v6" />
        </Svg>
      );
    case 'trophy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <Path d="M4 22h16" />
        <Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </Svg>
      );
    case 'user':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <Circle cx={12} cy={7} r={4} />
        </Svg>
      );
    case 'users':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <Circle cx={9} cy={7} r={4} />
        <Path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </Svg>
      );
    case 'verify':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M12 2l8 3.5V11c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V5.5L12 2Z" />
        <Path d="m8.5 11.5 2.5 2.5 4.5-5" />
        </Svg>
      );
    case 'video':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="m22 8-6 4 6 4V8Z" />
        <Rect x={2} y={6} width={14} height={12} rx={2} />
        </Svg>
      );
    case 'vol':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M11 5 6 9H2v6h4l5 4V5Z" />
        <Path d="M15.5 8.5a5 5 0 0 1 0 7M18.4 5.6a9 9 0 0 1 0 12.8" />
        </Svg>
      );
    case 'waterfall':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M4 3h16" />
        <Path d="M5.5 3v5c0 5 2.5 7 2.5 13" />
        <Path d="M18.5 3v5c0 5-2.5 7-2.5 13" />
        <Path d="M12 3v3" />
        <Path d="M10.5 8c0 4-.7 5-.7 9M13.5 8c0 4 .7 5 .7 9" />
        </Svg>
      );
    case 'waves':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <Path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <Path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        </Svg>
      );
    case 'wifi':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <Path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <Path d="M12 20h.01" />
        </Svg>
      );
    case 'zap':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedFill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <Path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
        </Svg>
      );
    default:
      return null;
  }
}
