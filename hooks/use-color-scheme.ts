import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useNWColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { LayoutAnimation, Platform, UIManager, useColorScheme as useRNColorScheme } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const THEME_STORAGE_KEY = '@hobit_theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

export function useColorScheme(): 'light' | 'dark' {
  const { colorScheme } = useNWColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
}

export function useThemeMode() {
  const { colorScheme, setColorScheme } = useNWColorScheme();
  const rnColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved) {
          const mode = saved as ThemeMode;
          setThemeModeState(mode);
          if (mode === 'system') {
            setColorScheme(rnColorScheme === 'dark' ? 'dark' : 'light');
          } else {
            setColorScheme(mode);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    loadTheme();
  }, [rnColorScheme, setColorScheme]);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      
      // Animate the style and color transitions smoothly across the entire view hierarchy
      if (Platform.OS !== 'web') {
        LayoutAnimation.configureNext({
          duration: 380,
          create: {
            type: LayoutAnimation.Types.easeInEaseOut,
            property: LayoutAnimation.Properties.opacity,
          },
          update: {
            type: LayoutAnimation.Types.easeInEaseOut,
          },
        });
      }

      if (mode === 'system') {
        setColorScheme(rnColorScheme === 'dark' ? 'dark' : 'light');
      } else {
        setColorScheme(mode);
      }
    } catch (e) {
      // ignore
    }
  };

  return {
    colorScheme: (colorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark',
    themeMode,
    setThemeMode,
  };
}
