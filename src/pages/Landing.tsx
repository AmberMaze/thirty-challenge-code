import ActiveGames from '@/components/ActiveGames';
import LanguageToggle from '@/components/LanguageToggle';
import { useTranslation } from '@/hooks/useTranslation';
import { isArabicAtom } from '@/state/languageAtoms';
import {
  backgroundMusicEnabledAtom,
  backgroundMusicVolumeAtom,
  isDarkModeAtom,
  soundEffectsEnabledAtom,
  soundEffectsVolumeAtom,
  themeAtom,
  toggleThemeAtom,
  type Theme,
} from '@/state/themeAtoms';
import { AnimatePresence, motion } from 'framer-motion';
import { useAtom, useAtomValue } from 'jotai';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Enhanced Landing page with theme customization sidebar and proper responsive design
 */
export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isArabic = useAtomValue(isArabicAtom);
  const isDarkMode = useAtomValue(isDarkModeAtom);
  const [, toggleTheme] = useAtom(toggleThemeAtom);

  // Theme configuration state
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [theme, setTheme] = useAtom(themeAtom);
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

  const handleCreateSession = () => {
    navigate('/create-session');
  };

  const handleJoinGame = () => {
    navigate('/join');
  };

  const handleJoinGameById = (gameId: string) => {
    navigate(`/join?gameId=${gameId}`);
  };

  const themeOptions: { value: Theme; label: string; preview: string }[] = [
    {
      value: 'dark',
      label: 'Dark Theme',
      preview: 'bg-gradient-to-br from-gray-900 to-blue-900',
    },
    {
      value: 'light',
      label: 'Light Theme',
      preview: 'bg-gradient-to-br from-blue-50 to-white',
    },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gradient-to-br from-brand-dark via-slate-900 to-football-dark'
          : 'bg-gradient-to-br from-blue-50 via-white to-green-50'
      }`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2322c55e' fill-opacity='0.2'%3E%3Ccircle cx='20' cy='20' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* Theme Settings Button */}
      <motion.button
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => setShowThemeSettings(!showThemeSettings)}
        className={`fixed top-4 left-4 z-50 p-3 rounded-xl transition-all duration-300 ${
          isDarkMode
            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            : 'bg-black/10 hover:bg-black/20 text-black border border-black/20'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </motion.button>

      {/* Theme Settings Sidebar */}
      <AnimatePresence>
        {showThemeSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowThemeSettings(false)}
            />

            {/* Settings Panel */}
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed left-0 top-0 h-full w-80 z-50 overflow-y-auto ${
                isDarkMode
                  ? 'bg-slate-900/95 border-r border-slate-700'
                  : 'bg-white/95 border-r border-gray-200'
              } backdrop-blur-sm`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className={`text-xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-black'
                    } ${isArabic ? 'font-arabic' : ''}`}
                  >
                    Theme Settings
                  </h2>
                  <button
                    onClick={() => setShowThemeSettings(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? 'hover:bg-white/10 text-white'
                        : 'hover:bg-black/10 text-black'
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {/* Theme Selection */}
                <div className="space-y-6">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-3 ${
                        isDarkMode ? 'text-white' : 'text-black'
                      } ${isArabic ? 'font-arabic' : ''}`}
                    >
                      Color Theme
                    </label>
                    <div className="space-y-2">
                      {themeOptions.map((option) => (
                        <motion.button
                          key={option.value}
                          onClick={() => setTheme(option.value)}
                          className={`w-full p-3 rounded-lg border-2 transition-all ${
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
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full ${option.preview}`}
                            />
                            <span
                              className={`font-medium ${
                                isDarkMode ? 'text-white' : 'text-black'
                              } ${isArabic ? 'font-arabic' : ''}`}
                            >
                              {option.label}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Sound Settings */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-3 ${
                        isDarkMode ? 'text-white' : 'text-black'
                      } ${isArabic ? 'font-arabic' : ''}`}
                    >
                      Audio Settings
                    </label>

                    {/* Sound Effects */}
                    <div className="space-y-4">
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
                            className={`w-12 h-6 rounded-full transition-colors ${
                              soundEffectsEnabled
                                ? 'bg-green-500'
                                : isDarkMode
                                  ? 'bg-gray-600'
                                  : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full transition-transform ${
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
                            className={`w-12 h-6 rounded-full transition-colors ${
                              backgroundMusicEnabled
                                ? 'bg-green-500'
                                : isDarkMode
                                  ? 'bg-gray-600'
                                  : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full transition-transform ${
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

                  {/* Quick Theme Toggle */}
                  <div>
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
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10">
        <motion.div
          className="flex flex-col items-center justify-center min-h-screen px-4"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
        >
          {/* Logo */}
          <motion.img
            src="/tahadialthalatheen/images/Logo.png"
            alt="تحدي الثلاثين"
            className="w-24 sm:w-32 mb-6"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          />

          {/* Title */}
          <motion.h1
            className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold mb-4 text-center ${
              isDarkMode ? 'text-accent glow' : 'text-green-600'
            } font-arabic`}
            style={
              isDarkMode
                ? { textShadow: '0 0 30px #7c3aed, 0 0 20px #38bdf8' }
                : {}
            }
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            تحدي الثلاثين
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className={`mb-8 text-lg text-center ${
              isDarkMode ? 'text-accent2' : 'text-green-700'
            } ${isArabic ? 'font-arabic' : ''}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {t('startChallenge')}
          </motion.p>

          {/* Active Games Section */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <ActiveGames onJoinGame={handleJoinGameById} />
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col gap-6 items-center w-full max-w-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button
              onClick={handleCreateSession}
              className={`w-full px-10 py-4 text-xl rounded-2xl font-bold transition-all shadow-lg ${
                isDarkMode
                  ? 'bg-accent2 hover:bg-accent text-white border border-accent glow'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } ${isArabic ? 'font-arabic' : ''}`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('createSession')}
            </motion.button>

            <motion.button
              onClick={handleJoinGame}
              className={`w-full px-6 py-3 text-lg rounded-xl font-bold transition-all ${
                isDarkMode
                  ? 'bg-transparent hover:bg-white/10 text-white/80 hover:text-accent2 border border-white/20 hover:border-accent2'
                  : 'bg-transparent hover:bg-green-50 text-green-700 hover:text-green-800 border border-green-300 hover:border-green-500'
              } ${isArabic ? 'font-arabic' : ''}`}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('joinSession')}
            </motion.button>
          </motion.div>

          {/* Footer Info */}
          <motion.div
            className={`mt-12 text-center text-sm max-w-md ${
              isDarkMode ? 'text-white/60' : 'text-gray-600'
            } ${isArabic ? 'font-arabic' : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p>{t('createSessionDesc')}</p>
            <p className="mt-1">{t('joinSessionDesc')}</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
