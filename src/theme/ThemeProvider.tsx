import React from 'react';
import {Appearance, StatusBar} from 'react-native';
import {
  colors,
  paletteFor,
  resolveColorScheme,
  setActiveColorScheme,
  type AppColors,
  type ColorScheme,
} from './index';
import {usePreferencesStore} from '../features/settings/preferencesStore';

type ThemeValue = {
  scheme: ColorScheme;
  colors: AppColors;
};

const ThemeContext = React.createContext<ThemeValue>({
  scheme: 'light',
  colors,
});

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const darkMode = usePreferencesStore(s => s.darkMode);
  const scheme = resolveColorScheme(darkMode);
  setActiveColorScheme(scheme);

  React.useEffect(() => {
    Appearance.setColorScheme(scheme);
    StatusBar.setBarStyle(scheme === 'dark' ? 'light-content' : 'dark-content', true);
  }, [scheme]);

  const value = React.useMemo<ThemeValue>(() => {
    return {scheme, colors: paletteFor(scheme)};
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return React.useContext(ThemeContext);
}

export function useColors(): AppColors {
  return React.useContext(ThemeContext).colors;
}

const themeSubscribedScreens = new WeakMap<object, object>();

/**
 * Navigation keeps inactive scenes mounted. This wrapper makes every scene a
 * theme consumer so its style proxy values are read again when the user flips
 * between light and dark mode, without remounting the scene or losing state.
 */
export function themedScreen<P extends object>(
  Component: React.ComponentType<P>,
): React.ComponentType<P> {
  const cached = themeSubscribedScreens.get(Component as object);
  if (cached) return cached as React.ComponentType<P>;

  function ThemeSubscribedScreen(props: P) {
    useTheme();
    return <Component {...props} />;
  }

  ThemeSubscribedScreen.displayName = `Themed(${Component.displayName ?? Component.name ?? 'Screen'})`;
  themeSubscribedScreens.set(Component as object, ThemeSubscribedScreen);
  return ThemeSubscribedScreen;
}
