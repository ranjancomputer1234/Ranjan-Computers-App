import {Platform, StyleSheet, type ImageStyle, type TextStyle, type ViewStyle} from 'react-native';

const lightColors = {
  primary: '#1976D2',
  activeBlue: '#1565C0',
  deepBlue: '#0D47A1',
  navy: '#1A237E',
  ink: '#212121',
  text2: '#586174',
  text3: '#667085',
  success: '#2E7D32',
  successAccent: '#4CAF50',
  orange: '#F57C00',
  brightOrange: '#FF6D00',
  error: '#E53935',
  scroll: '#F7F9FC',
  white: '#FFFFFF',
  pressed: '#EEF1F7',
  subtle: '#F1F4F9',
  progressTrack: '#E2E8F2',
  inactiveNav: '#667085',
  pastel: {
    blue: '#E3F2FD',
    pink: '#FFEBEE',
    green: '#E8F5E9',
    purple: '#F3E5F5',
    yellow: '#FFFDE7',
    mint: '#E0F2F1',
    orange: '#FFF3E0',
    cyan: '#E1F5FE',
    lavender: '#EDE7F6',
    peach: '#FFF7ED',
    cream: '#FFF8E1',
    beige: '#EFEBE9',
    indigo: '#E8EAF6',
    sky: '#EFF6FF',
    red: '#FFEBEE',
  },
} as const;

export type AppColors = {
  [Key in Exclude<keyof typeof lightColors, 'pastel'>]: string;
} & {
  pastel: {[Key in keyof typeof lightColors.pastel]: string};
};
export type ColorScheme = 'light' | 'dark';

export const darkColors = {
  ...lightColors,
  primary: '#70BBFF',
  activeBlue: '#9BD0FF',
  deepBlue: '#8FC8FF',
  ink: '#F4F7FF',
  navy: '#E8EDFF',
  text2: '#BAC4DA',
  text3: '#8996B0',
  success: '#74D680',
  successAccent: '#8CE397',
  orange: '#FFB657',
  brightOrange: '#FF9F45',
  error: '#FF8585',
  scroll: '#090E1A',
  white: '#131B2D',
  pressed: '#0E1627',
  subtle: '#1B263D',
  progressTrack: '#2A3650',
  inactiveNav: '#8591AA',
  pastel: {
    blue: '#122C49',
    pink: '#38212C',
    green: '#153522',
    purple: '#2D203B',
    yellow: '#352F17',
    mint: '#123633',
    orange: '#3A2718',
    cyan: '#123341',
    lavender: '#27243F',
    peach: '#38231A',
    cream: '#352E18',
    beige: '#2D2828',
    indigo: '#222944',
    sky: '#122C49',
    red: '#38212A',
  },
} as const satisfies AppColors;

let activeColorScheme: ColorScheme = 'light';

export function setActiveColorScheme(scheme: ColorScheme): void {
  activeColorScheme = scheme;
}

export function getActiveColorScheme(): ColorScheme {
  return activeColorScheme;
}

/**
 * Backwards-compatible live palette. Existing screens can keep reading
 * `colors.*`; each access resolves against the current app theme.
 */
export const colors = new Proxy(lightColors as AppColors, {
  get(_target, property: keyof AppColors) {
    return paletteFor(activeColorScheme)[property];
  },
}) as AppColors;

export function resolveColorScheme(
  darkMode: boolean,
  _system?: 'light' | 'dark' | null,
): ColorScheme {
  return darkMode ? 'dark' : 'light';
}

export function paletteFor(scheme: ColorScheme): AppColors {
  return (scheme === 'dark' ? darkColors : lightColors) as AppColors;
}

type NamedStyle = ViewStyle | TextStyle | ImageStyle;
type NamedStyles<T> = {[P in keyof T]: NamedStyle};

const darkValueMap: Record<string, string> = {
  '#1976d2': darkColors.primary,
  '#1565c0': darkColors.activeBlue,
  '#0d47a1': darkColors.deepBlue,
  '#1a237e': darkColors.navy,
  '#212121': darkColors.ink,
  '#586174': darkColors.text2,
  '#667085': darkColors.text3,
  '#757575': darkColors.text2,
  '#98a2b3': darkColors.text3,
  '#90a4ae': darkColors.text3,
  '#b0bec5': darkColors.text3,
  '#2e7d32': darkColors.success,
  '#43a047': darkColors.success,
  '#4caf50': darkColors.successAccent,
  '#f57c00': darkColors.orange,
  '#ef6c00': darkColors.orange,
  '#e65100': darkColors.orange,
  '#ff6d00': darkColors.brightOrange,
  '#e53935': darkColors.error,
  '#c62828': darkColors.error,
  '#b71c1c': darkColors.error,
  '#7b1fa2': '#C7A0FF',
  '#8e24aa': '#C7A0FF',
  '#5e35b1': '#B9A5FF',
  '#4527a0': '#B9A5FF',
  '#00796b': '#71D7C8',
  '#00897b': '#71D7C8',
  '#00695c': '#71D7C8',
  '#0288d1': '#67C7F2',
};

const darkSurfaceMap: Record<string, string> = {
  '#fff': darkColors.white,
  '#ffffff': darkColors.white,
  '#f7f9fc': darkColors.scroll,
  '#f8fafc': darkColors.scroll,
  '#f9fafb': darkColors.scroll,
  '#eef1f7': darkColors.pressed,
  '#f1f4f9': darkColors.subtle,
  '#eceff1': darkColors.subtle,
  '#e2e8f2': darkColors.progressTrack,
  '#cbd5e1': darkColors.progressTrack,
  '#c9d9ec': darkColors.progressTrack,
  '#dce4ef': darkColors.progressTrack,
  '#dde4ee': darkColors.progressTrack,
  '#dfe5ef': darkColors.progressTrack,
  '#e8edf5': darkColors.subtle,
  '#e3f2fd': darkColors.pastel.blue,
  '#bbdefb': '#193A5A',
  '#eff6ff': darkColors.pastel.sky,
  '#e0f2fe': darkColors.pastel.cyan,
  '#e1f5fe': darkColors.pastel.cyan,
  '#e8f5e9': darkColors.pastel.green,
  '#d4ead8': '#274333',
  '#f0fdf4': darkColors.pastel.green,
  '#f1f8f2': darkColors.pastel.green,
  '#f1f8e9': darkColors.pastel.green,
  '#c8e6c9': '#20442A',
  '#dcfce7': '#173B25',
  '#e0f2f1': darkColors.pastel.mint,
  '#f3e5f5': darkColors.pastel.purple,
  '#ede7f6': darkColors.pastel.lavender,
  '#e8eaf6': darkColors.pastel.indigo,
  '#fffde7': darkColors.pastel.yellow,
  '#fde68a': '#403719',
  '#fff8e1': darkColors.pastel.cream,
  '#fff8e8': darkColors.pastel.cream,
  '#fff2d7': darkColors.pastel.cream,
  '#fff3e0': darkColors.pastel.orange,
  '#f5ddc2': '#4A3725',
  '#fff7ed': darkColors.pastel.peach,
  '#fffbeb': darkColors.pastel.cream,
  '#fef3c7': '#3D3218',
  '#ffebee': darkColors.pastel.red,
  '#fff1f1': darkColors.pastel.red,
  '#fff1f2': darkColors.pastel.red,
  '#fff7f7': darkColors.pastel.red,
  '#fff8f8': darkColors.pastel.red,
  '#ffe4e6': '#45212A',
  '#efebe9': darkColors.pastel.beige,
  '#fffdf7': darkColors.white,
  '#f2f5fa': darkColors.subtle,
  '#f5f7fa': darkColors.subtle,
  '#f5faff': darkColors.pastel.blue,
  '#f7fbff': darkColors.pastel.blue,
  '#ffe0a3': '#5A431B',
  '#fed7aa': '#57351E',
};

function darkShadow(value: string): string {
  return value
    .replace(/rgba\(255,\s*255,\s*255,\s*0\.(?:7|72|8|82|85|9|92|95)\)/gi, 'rgba(255,255,255,0.065)')
    .replace(/rgba\(255,\s*255,\s*255,\s*0\.(?:12|14|16|18|2|22|24|26|28|3|32|34|35|4)\)/gi, 'rgba(255,255,255,0.055)')
    .replace(/rgba\((?:100,\s*116,\s*139|148,\s*163,\s*184),\s*0\.[0-9]+\)/gi, 'rgba(0,0,0,0.34)')
    .replace(/rgba\((?:26,\s*35,\s*126|13,\s*71,\s*161),\s*0\.[0-9]+\)/gi, 'rgba(0,0,0,0.56)');
}

function themedStyleValue(value: unknown, key?: string): unknown {
  if (Array.isArray(value)) return value.map(item => themedStyleValue(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [
        childKey,
        themedStyleValue(childValue, childKey),
      ]),
    );
  }
  if (typeof value !== 'string') return value;
  if (key === 'boxShadow' || key === 'textShadowColor') return darkShadow(value);
  const normalized = value.toLowerCase();
  const isSurface = key === 'backgroundColor' || key === 'borderColor' || key === 'shadowColor';
  if (isSurface && darkSurfaceMap[normalized]) return darkSurfaceMap[normalized];
  if (key === 'backgroundColor') {
    const compact = normalized.replace(/\s+/g, '');
    const translucentWhite = compact.match(/^rgba\(255,255,255,(0?\.\d+)\)$/);
    if (translucentWhite && Number(translucentWhite[1]) >= 0.45) {
      return 'rgba(19,27,45,0.92)';
    }
    if (compact === 'rgba(232,245,233,0.72)') return 'rgba(21,53,34,0.88)';
    if (compact === 'rgba(255,248,225,0.86)') return 'rgba(53,46,24,0.9)';
  }
  if (key === 'borderColor') {
    const compact = normalized.replace(/\s+/g, '');
    if (/^rgba\((?:26,35,126|30,64,175),/.test(compact)) {
      return 'rgba(143,178,230,0.18)';
    }
  }
  return darkValueMap[normalized] ?? value;
}

/**
 * Creates styles that resolve against the active color scheme on access.
 * This keeps legacy screen styles theme-aware without requiring every style
 * declaration to be rebuilt in every component render.
 */
export function createThemedStyles<T extends NamedStyles<T>>(source: T): T {
  const light = StyleSheet.create(source);
  let dark: T | undefined;
  return new Proxy(light as T, {
    get(target, property, receiver) {
      if (activeColorScheme === 'light' || typeof property !== 'string') {
        return Reflect.get(target, property, receiver);
      }
      dark ??= StyleSheet.create(themedStyleValue(source) as T) as T;
      return dark[property as keyof T];
    },
  });
}

export type ClayVariant =
  | 'blue'
  | 'green'
  | 'orange'
  | 'pink'
  | 'purple'
  | 'yellow'
  | 'mint'
  | 'lavender'
  | 'cyan'
  | 'peach'
  | 'cream'
  | 'beige'
  | 'indigo'
  | 'sky'
  | 'red'
  | 'white';

const lightClay = {
  blue: {bg: lightColors.pastel.blue, out: 'rgba(21, 101, 192, 0.34)', ins: 'rgba(13, 71, 161, 0.13)', icon: '#1976D2'},
  green: {bg: lightColors.pastel.green, out: 'rgba(46, 125, 50, 0.32)', ins: 'rgba(27, 94, 32, 0.13)', icon: '#2E7D32'},
  orange: {bg: lightColors.pastel.orange, out: 'rgba(245, 124, 0, 0.34)', ins: 'rgba(230, 81, 0, 0.13)', icon: '#EF6C00'},
  pink: {bg: lightColors.pastel.pink, out: 'rgba(229, 57, 53, 0.3)', ins: 'rgba(198, 40, 40, 0.11)', icon: '#E53935'},
  purple: {bg: lightColors.pastel.purple, out: 'rgba(142, 36, 170, 0.3)', ins: 'rgba(106, 27, 154, 0.11)', icon: '#8E24AA'},
  yellow: {bg: lightColors.pastel.yellow, out: 'rgba(251, 192, 45, 0.34)', ins: 'rgba(245, 127, 23, 0.14)', icon: '#EF6C00'},
  mint: {bg: lightColors.pastel.mint, out: 'rgba(0, 137, 123, 0.3)', ins: 'rgba(0, 105, 92, 0.11)', icon: '#00695C'},
  lavender: {bg: lightColors.pastel.lavender, out: 'rgba(103, 58, 183, 0.3)', ins: 'rgba(81, 45, 168, 0.11)', icon: '#5E35B1'},
  cyan: {bg: lightColors.pastel.cyan, out: 'rgba(3, 155, 229, 0.3)', ins: 'rgba(2, 119, 189, 0.11)', icon: '#0288D1'},
  peach: {bg: lightColors.pastel.peach, out: 'rgba(234, 88, 12, 0.26)', ins: 'rgba(194, 65, 12, 0.11)', icon: '#EA580C'},
  cream: {bg: lightColors.pastel.cream, out: 'rgba(245, 180, 0, 0.32)', ins: 'rgba(230, 145, 0, 0.13)', icon: '#F9A825'},
  beige: {bg: lightColors.pastel.beige, out: 'rgba(109, 76, 65, 0.26)', ins: 'rgba(78, 52, 46, 0.11)', icon: '#6D4C41'},
  indigo: {bg: lightColors.pastel.indigo, out: 'rgba(40, 53, 147, 0.3)', ins: 'rgba(26, 35, 126, 0.13)', icon: '#283593'},
  sky: {bg: lightColors.pastel.sky, out: 'rgba(37, 99, 235, 0.26)', ins: 'rgba(29, 78, 216, 0.11)', icon: '#2563EB'},
  red: {bg: lightColors.pastel.red, out: 'rgba(183, 28, 28, 0.26)', ins: 'rgba(136, 14, 79, 0.06)', icon: '#C62828'},
  white: {bg: lightColors.white, out: 'rgba(26, 35, 126, 0.22)', ins: 'rgba(100, 116, 139, 0.14)', icon: '#1976D2'},
} as const;

const darkClay = Object.fromEntries(
  (Object.keys(lightClay) as ClayVariant[]).map(variant => [
    variant,
    {
      ...lightClay[variant],
      bg: variant === 'white' ? darkColors.white : darkColors.pastel[variant],
      out: 'rgba(0, 0, 0, 0.48)',
      ins: 'rgba(255, 255, 255, 0.055)',
      icon:
        variant === 'green' || variant === 'mint'
          ? '#81C784'
          : variant === 'orange' || variant === 'yellow' || variant === 'peach' || variant === 'cream'
            ? '#FFB74D'
            : variant === 'pink' || variant === 'red'
              ? '#EF9A9A'
              : variant === 'purple' || variant === 'lavender' || variant === 'indigo'
                ? '#B39DDB'
                : '#64B5F6',
    },
  ]),
) as unknown as typeof lightClay;

export const clay = new Proxy(lightClay, {
  get(_target, property: ClayVariant) {
    return (activeColorScheme === 'dark' ? darkClay : lightClay)[property];
  },
}) as typeof lightClay;

export function clayShadow(variant: ClayVariant, insetOnly = false): string {
  const v = clay[variant];
  const inset = activeColorScheme === 'dark'
    ? `inset 2px 2px 8px rgba(255, 255, 255, 0.055), inset -5px -5px 12px rgba(0, 0, 0, 0.28)`
    : `inset 5px 5px 12px rgba(255, 255, 255, 0.72), inset -4px -4px 10px ${v.ins}`;
  if (insetOnly) {
    return inset;
  }
  return `0 16px 26px -16px ${v.out}, ${inset}`;
}

export function insetShadow(): string {
  return activeColorScheme === 'dark'
    ? 'inset 4px 4px 10px rgba(0, 0, 0, 0.36), inset -3px -3px 8px rgba(255, 255, 255, 0.045)'
    : 'inset 4px 4px 10px rgba(148, 163, 184, 0.32), inset -4px -4px 10px rgba(255, 255, 255, 0.9)';
}

export function iconButtonShadow(): string {
  return activeColorScheme === 'dark'
    ? 'inset 2px 2px 5px rgba(0, 0, 0, 0.34), inset -2px -2px 5px rgba(255, 255, 255, 0.045)'
    : 'inset 2px 2px 5px rgba(148, 163, 184, 0.35), inset -2px -2px 5px rgba(255, 255, 255, 0.9)';
}

export const fonts = {
  inter: Platform.select({ios: 'Inter', android: 'Inter', default: 'Inter'}) as string,
  caveat: Platform.select({ios: 'Caveat', android: 'Caveat', default: 'Caveat'}) as string,
  mono: Platform.select({
    ios: 'JetBrainsMono',
    android: 'JetBrainsMono',
    default: 'JetBrainsMono',
  }) as string,
};

export const space = {
  pageTop: 14,
  pageX: 16,
  pageBottom: 26,
  section: 14,
  grid: 11,
  hit: Platform.OS === 'ios' ? 44 : 48,
} as const;

export const radius = {
  search: 16,
  card: 17,
  icon: 13,
  hero: 22,
  loginHero: 24,
  field: 14,
  chip: 999,
  headerIcon: 11,
  navIcon: 10,
} as const;

const lightGradients = {
  primaryButton: ['#2F86ED', '#1976D2'] as const,
  orangeCta: ['#FF8F00', '#F57C00'] as const,
  freeBadge: ['#66BB6A', '#43A047'] as const,
  paidBadge: ['#FB8C00', '#F57C00'] as const,
  banner: ['#0D47A1', '#1565C0', '#1976D2'] as const,
  loginHero: ['#0D1B3E', '#0D47A1', '#1976D2'] as const,
  avatar: ['#90CAF9', '#1976D2'] as const,
  interview: ['#00695C', '#00897B', '#26A69A'] as const,
  semesterWait: ['#283593', '#3F51B5', '#5C6BC0'] as const,
  certificate: ['#FFFDF7', '#FFF8E1', '#FFF3E0'] as const,
  progress: ['#64B5F6', '#1976D2'] as const,
  play: ['#2F86ED', '#1565C0'] as const,
  result: ['#66BB6A', '#2E7D32'] as const,
};

type AppGradients = {
  [Key in keyof typeof lightGradients]: readonly string[];
};

const darkGradients: AppGradients = {
  primaryButton: ['#2F91EF', '#1768B5'],
  orangeCta: ['#FF9E35', '#D96B16'],
  freeBadge: ['#51B96B', '#2C8B4B'],
  paidBadge: ['#F99B3D', '#D96B16'],
  banner: ['#0A2B53', '#104C83', '#176DAF'],
  loginHero: ['#080F22', '#0C2B55', '#104D86'],
  avatar: ['#66B8F5', '#1768B5'],
  interview: ['#0B4C48', '#08756A', '#2BA996'],
  semesterWait: ['#20264F', '#35458C', '#5268BD'],
  certificate: ['#17170F', '#272214', '#322317'],
  progress: ['#68C2FF', '#2385DF'],
  play: ['#318FEC', '#155AA1'],
  result: ['#55BE6C', '#287C43'],
};

export const gradients = new Proxy(lightGradients as AppGradients, {
  get(_target, property: keyof AppGradients) {
    return (activeColorScheme === 'dark' ? darkGradients : lightGradients)[property];
  },
}) as AppGradients;

export const motion = {
  pressScale: 0.98,
  duration: 180,
};

export const brand = {
  name: 'RACI',
  institute: 'Ranjan Computer Institute',
  tagline: 'Learn Computer With AI',
};
