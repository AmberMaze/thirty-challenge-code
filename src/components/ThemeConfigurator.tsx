import { isArabicAtom } from '@/state/languageAtoms';
import {
  animationsEnabledAtom,
  backgroundMusicEnabledAtom,
  backgroundMusicVolumeAtom,
  backgroundOpacityAtom,
  backgroundStyleAtom,
  customColorsAtom,
  fontSizeMultiplierAtom,
  highContrastAtom,
  isDarkModeAtom,
  showBackgroundPatternAtom,
  soundEffectsEnabledAtom,
  soundEffectsVolumeAtom,
  themeAtom,
  toggleThemeAtom,
  type BackgroundStyle,
  type Theme,
} from '@/state/themeAtoms';
import { AnimatePresence, motion } from 'framer-motion';
import { useAtom, useAtomValue } from 'jotai';

interface ThemeConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
}

export default function ThemeConfigurator({
  isOpen,
  onClose,
  position = 'left',
}: ThemeConfiguratorProps) {
  const isArabic = useAtomValue(isArabicAtom);
  const isDarkMode = useAtomValue(isDarkModeAtom);

  // Theme state
  const [theme, setTheme] = useAtom(themeAtom);
  const [, toggleTheme] = useAtom(toggleThemeAtom);
  const [backgroundStyle, setBackgroundStyle] = useAtom(backgroundStyleAtom);
  const [customColors, setCustomColors] = useAtom(customColorsAtom);

  // Audio state
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useAtom(
    soundEffectsEnabledAtom,
  );
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useAtom(
    backgroundMusicEnabledAtom,
  );
  const [soundEffectsVolume, setSoundEffectsVolume] = useAtom(
    soundEffectsVolumeAtom,
  );
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useAtom(
    backgroundMusicVolumeAtom,
  );

  // Visual state
  const [animationsEnabled, setAnimationsEnabled] = useAtom(
    animationsEnabledAtom,
  );
  const [showBackgroundPattern, setShowBackgroundPattern] = useAtom(
    showBackgroundPatternAtom,
  );
  const [backgroundOpacity, setBackgroundOpacity] = useAtom(
    backgroundOpacityAtom,
  );

  // Accessibility state
  const [highContrast, setHighContrast] = useAtom(highContrastAtom);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useAtom(
    fontSizeMultiplierAtom,
  );

  const themeOptions: { value: Theme; label: string; description: string }[] = [
    {
      value: 'dark',
      label: 'Dark Football',
      description: 'Classic dark theme with football colors',
    },
    {
      value: 'light',
      label: 'Light Clean',
      description: 'Clean light theme for daytime use',
    },
    {
      value: 'football',
      label: 'Football Green',
      description: 'Green pitch-inspired theme',
    },
    {
      value: 'neon',
      label: 'Neon Cyber',
      description: 'Futuristic neon colors',
    },
  ];

  const backgroundOptions: {
    value: BackgroundStyle;
    label: string;
    description: string;
  }[] = [
    {
      value: 'gradient',
      label: 'Gradient',
      description: 'Smooth color transitions',
    },
    { value: 'solid', label: 'Solid', description: 'Single color background' },
    { value: 'pattern', label: 'Pattern', description: 'Geometric patterns' },
    {
      value: 'animated',
      label: 'Animated',
      description: 'Moving background effects',
    },
  ];

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    // Apply theme-specific document classes
    if (typeof document !== 'undefined') {
      // Remove all theme classes
      document.documentElement.classList.remove(
        'light',
        'dark',
        'football',
        'neon',
      );

      // Add the specific theme class
      document.documentElement.classList.add(newTheme);

      // Add 'dark' class for dark mode themes (for Tailwind dark: variants)
      if (newTheme === 'dark' || newTheme === 'neon') {
        document.documentElement.classList.add('dark');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Settings Panel */}
          <motion.div
            initial={{
              x: position === 'left' ? -400 : 400,
              opacity: 0,
            }}
            animate={{ x: 0, opacity: 1 }}
            exit={{
              x: position === 'left' ? -400 : 400,
              opacity: 0,
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed ${position === 'left' ? 'left-0' : 'right-0'} top-0 h-full w-80 z-50 overflow-y-auto ${
              isDarkMode
                ? 'bg-slate-900/95 border border-slate-700'
                : 'bg-white/95 border border-gray-200'
            } backdrop-blur-md shadow-2xl`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">⚙️</span>
                  <h2
                    className={`text-xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-black'
                    } ${isArabic ? 'font-arabic' : ''}`}
                  >
                    Theme Settings
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'hover:bg-white/10 text-white'
                      : 'hover:bg-black/10 text-black'
                  }`}
                >
                  <span className="text-lg">✕</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm">🎨</span>
                    <label
                      className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-black'
                      } ${isArabic ? 'font-arabic' : ''}`}
                    >
                      Color Theme
                    </label>
                  </div>
                  <div className="space-y-2">
                    {themeOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        onClick={() => handleThemeChange(option.value)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          theme === option.value
                            ? isDarkMode
                              ? 'border-green-400 bg-green-400/10'
                              : 'border-green-600 bg-green-50'
                            : isDarkMode
                              ? 'border-slate-600 hover:border-slate-500'
                              : 'border-gray-300 hover:border-gray-400'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="space-y-1">
                          <div
                            className={`font-medium ${
                              isDarkMode ? 'text-white' : 'text-black'
                            } ${isArabic ? 'font-arabic' : ''}`}
                          >
                            {option.label}
                          </div>
                          <div
                            className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            {option.description}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Background Style */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm">👁️</span>
                    <label
                      className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-black'
                      } ${isArabic ? 'font-arabic' : ''}`}
                    >
                      Background Style
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {backgroundOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setBackgroundStyle(option.value)}
                        className={`p-2 rounded-lg border transition-all text-sm ${
                          backgroundStyle === option.value
                            ? isDarkMode
                              ? 'border-purple-400 bg-purple-400/10 text-purple-400'
                              : 'border-purple-600 bg-purple-50 text-purple-600'
                            : isDarkMode
                              ? 'border-slate-600 text-white hover:border-slate-500'
                              : 'border-gray-300 text-black hover:border-gray-400'
                        } ${isArabic ? 'font-arabic' : ''}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm">🎨</span>
                    <label
                      className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-black'
                      } ${isArabic ? 'font-arabic' : ''}`}
                    >
                      Custom Colors
                    </label>
                  </div>
                  <div className="space-y-3">
                    {/* Primary Color */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-black'
                        } ${isArabic ? 'font-arabic' : ''}`}
                      >
                        Primary
                      </span>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded border-2 border-white/20"
                          style={{ backgroundColor: customColors.primary }}
                        />
                        <input
                          type="color"
                          value={customColors.primary}
                          onChange={(e) =>
                            setCustomColors((prev: typeof customColors) => ({
                              ...prev,
                              primary: e.target.value,
                            }))
                          }
                          className="w-8 h-8 rounded border-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Secondary Color */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-black'
                        } ${isArabic ? 'font-arabic' : ''}`}
                      >
                        Secondary
                      </span>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded border-2 border-white/20"
                          style={{ backgroundColor: customColors.secondary }}
                        />
                        <input
                          type="color"
                          value={customColors.secondary}
                          onChange={(e) =>
                            setCustomColors((prev: typeof customColors) => ({
                              ...prev,
                              secondary: e.target.value,
                            }))
                          }
                          className="w-8 h-8 rounded border-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-black'
                        } ${isArabic ? 'font-arabic' : ''}`}
                      >
                        Accent
                      </span>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded border-2 border-white/20"
                          style={{ backgroundColor: customColors.accent }}
                        />
                        <input
                          type="color"
                          value={customColors.accent}
                          onChange={(e) =>
                            setCustomColors((prev: typeof customColors) => ({
                              ...prev,
                              accent: e.target.value,
                            }))
                          }
                          className="w-8 h-8 rounded border-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audio Settings */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm">🔊</span>
                    <label
                      className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-black'
                      } ${isArabic ? 'font-arabic' : ''}`}
                    >
                      Audio Settings
                    </label>
                  </div>

                  <div className="space-y-4">
                    {/* Sound Effects */}
                    <div
                      className={`p-3 rounded-lg ${
                        isDarkMode ? 'bg-white/5' : 'bg-black/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm ${
                            isDarkMode ? 'text-white' : 'text-black'
                          } ${isArabic ? 'font-arabic' : ''}`}
                        >
                          Sound Effects
                        </span>
                        <button
                          onClick={() =>
                            setSoundEffectsEnabled(!soundEffectsEnabled)
                          }
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            soundEffectsEnabled
                              ? 'bg-green-500'
                              : isDarkMode
                                ? 'bg-gray-600'
                                : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                              soundEffectsEnabled
                                ? 'translate-x-7'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {soundEffectsEnabled && (
                        <div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={soundEffectsVolume}
                            onChange={(e) =>
                              setSoundEffectsVolume(Number(e.target.value))
                            }
                            className="w-full accent-green-500"
                          />
                          <div
                            className={`text-xs mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            Volume: {soundEffectsVolume}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Background Music */}
                    <div
                      className={`p-3 rounded-lg ${
                        isDarkMode ? 'bg-white/5' : 'bg-black/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm ${
                            isDarkMode ? 'text-white' : 'text-black'
                          } ${isArabic ? 'font-arabic' : ''}`}
                        >
                          Background Music
                        </span>
                        <button
                          onClick={() =>
                            setBackgroundMusicEnabled(!backgroundMusicEnabled)
                          }
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            backgroundMusicEnabled
                              ? 'bg-green-500'
                              : isDarkMode
                                ? 'bg-gray-600'
                                : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                              backgroundMusicEnabled
                                ? 'translate-x-7'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {backgroundMusicEnabled && (
                        <div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={backgroundMusicVolume}
                            onChange={(e) =>
                              setBackgroundMusicVolume(Number(e.target.value))
                            }
                            className="w-full accent-green-500"
                          />
                          <div
                            className={`text-xs mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            Volume: {backgroundMusicVolume}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visual Preferences */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm">⚡</span>
                    <label
                      className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-black'
                      } ${isArabic ? 'font-arabic' : ''}`}
                    >
                      Visual Effects
                    </label>
                  </div>

                  <div className="space-y-3">
                    {/* Animations Toggle */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-black'
                        } ${isArabic ? 'font-arabic' : ''}`}
                      >
                        Animations
                      </span>
                      <button
                        onClick={() => setAnimationsEnabled(!animationsEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          animationsEnabled
                            ? 'bg-orange-500'
                            : isDarkMode
                              ? 'bg-gray-600'
                              : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                            animationsEnabled
                              ? 'translate-x-7'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Background Pattern Toggle */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-black'
                        } ${isArabic ? 'font-arabic' : ''}`}
                      >
                        Background Pattern
                      </span>
                      <button
                        onClick={() =>
                          setShowBackgroundPattern(!showBackgroundPattern)
                        }
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          showBackgroundPattern
                            ? 'bg-orange-500'
                            : isDarkMode
                              ? 'bg-gray-600'
                              : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                            showBackgroundPattern
                              ? 'translate-x-7'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Pattern Opacity */}
                    {showBackgroundPattern && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            Pattern Opacity
                          </span>
                          <span
                            className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            {backgroundOpacity}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={backgroundOpacity}
                          onChange={(e) =>
                            setBackgroundOpacity(Number(e.target.value))
                          }
                          className="w-full accent-orange-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Accessibility */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-3 ${
                      isDarkMode ? 'text-white' : 'text-black'
                    } ${isArabic ? 'font-arabic' : ''}`}
                  >
                    Accessibility
                  </label>

                  <div className="space-y-3">
                    {/* High Contrast */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-black'
                        } ${isArabic ? 'font-arabic' : ''}`}
                      >
                        High Contrast
                      </span>
                      <button
                        onClick={() => setHighContrast(!highContrast)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          highContrast
                            ? 'bg-red-500'
                            : isDarkMode
                              ? 'bg-gray-600'
                              : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                            highContrast ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Font Size */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          Font Size
                        </span>
                        <span
                          className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {Math.round(fontSizeMultiplier * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="1.5"
                        step="0.1"
                        value={fontSizeMultiplier}
                        onChange={(e) =>
                          setFontSizeMultiplier(Number(e.target.value))
                        }
                        className="w-full accent-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => toggleTheme()}
                    className={`w-full p-3 rounded-lg border-2 transition-all ${
                      isDarkMode
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20'
                        : 'border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100'
                    } ${isArabic ? 'font-arabic' : ''}`}
                  >
                    {isDarkMode
                      ? '☀️ Switch to Light Mode'
                      : '🌙 Switch to Dark Mode'}
                  </button>

                  <button
                    onClick={() => {
                      // Reset to defaults
                      setTheme('dark');
                      setBackgroundStyle('gradient');
                      setCustomColors({
                        primary: '#22c55e',
                        secondary: '#38bdf8',
                        accent: '#6a5acd',
                        background: '#0f172a',
                        surface: 'rgba(15, 23, 42, 0.8)',
                      });
                      setSoundEffectsEnabled(true);
                      setSoundEffectsVolume(50);
                      setBackgroundMusicEnabled(true);
                      setBackgroundMusicVolume(30);
                      setAnimationsEnabled(true);
                      setShowBackgroundPattern(true);
                      setBackgroundOpacity(10);
                      setHighContrast(false);
                      setFontSizeMultiplier(1.0);
                    }}
                    className={`w-full p-2 text-sm rounded-lg transition-all ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } ${isArabic ? 'font-arabic' : ''}`}
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
