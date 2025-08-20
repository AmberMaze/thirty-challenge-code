import { atom } from 'jotai';

export type Theme = 'light' | 'dark' | 'football' | 'neon';
export type BackgroundStyle =
  | 'gradient'
  | 'solid'
  | 'pattern'
  | 'animated'
  | 'mesh'
  | 'waves';

// Core theme atom
export const themeAtom = atom<Theme>('dark');

// Background style atom
export const backgroundStyleAtom = atom<BackgroundStyle>('gradient');

// Derived atom for dark mode class
export const isDarkModeAtom = atom((get) => {
  const theme = get(themeAtom);
  return theme === 'dark' || theme === 'neon';
});

// Toggle theme atom
export const toggleThemeAtom = atom(null, (get, set) => {
  const currentTheme = get(themeAtom);
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  set(themeAtom, newTheme);

  // Apply to document
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }
});

// Advanced theme colors atom
export const customColorsAtom = atom({
  primary: '#22c55e',
  secondary: '#38bdf8',
  accent: '#6a5acd',
  background: '#0f172a',
  surface: 'rgba(15, 23, 42, 0.8)',
});

// Theme preset configurations
export const themePresetsAtom = atom((get) => {
  const presets = {
    dark: {
      name: 'Dark Football',
      colors: {
        primary: '#22c55e',
        secondary: '#38bdf8',
        accent: '#6a5acd',
        background: '#0f172a',
        surface: 'rgba(15, 23, 42, 0.8)',
      },
      backgroundClass:
        'bg-gradient-to-br from-brand-dark via-slate-900 to-football-dark',
    },
    light: {
      name: 'Light Clean',
      colors: {
        primary: '#16a34a',
        secondary: '#0284c7',
        accent: '#7c3aed',
        background: '#ffffff',
        surface: 'rgba(255, 255, 255, 0.9)',
      },
      backgroundClass: 'bg-gradient-to-br from-blue-50 via-white to-green-50',
    },
    football: {
      name: 'Football Green',
      colors: {
        primary: '#15803d',
        secondary: '#059669',
        accent: '#eab308',
        background: '#064e3b',
        surface: 'rgba(6, 78, 59, 0.8)',
      },
      backgroundClass:
        'bg-gradient-to-br from-green-900 via-emerald-800 to-green-700',
    },
    neon: {
      name: 'Neon Cyber',
      colors: {
        primary: '#00ff88',
        secondary: '#00d4ff',
        accent: '#ff0080',
        background: '#0a0a0a',
        surface: 'rgba(10, 10, 10, 0.9)',
      },
      backgroundClass:
        'bg-gradient-to-br from-black via-gray-900 to-purple-900',
    },
  };

  const currentTheme = get(themeAtom);
  return { presets, current: presets[currentTheme] };
});

// Settings atoms for sound effects and background music
export const soundEffectsVolumeAtom = atom(50);
export const backgroundMusicVolumeAtom = atom(30);
export const soundEffectsEnabledAtom = atom(true);
export const backgroundMusicEnabledAtom = atom(true);

// Animation preferences
export const animationsEnabledAtom = atom(true);
export const reducedMotionAtom = atom(false);

// Background pattern preferences
export const showBackgroundPatternAtom = atom(true);
export const backgroundOpacityAtom = atom(10);

// Auto-theme based on time of day
export const autoThemeAtom = atom(false);
export const autoThemeScheduleAtom = atom({
  darkStart: '18:00',
  lightStart: '06:00',
});

// Accessibility preferences
export const highContrastAtom = atom(false);
export const fontSizeMultiplierAtom = atom(1.0); // 0.8 to 1.5
export const dyslexiaFriendlyFontAtom = atom(false);
