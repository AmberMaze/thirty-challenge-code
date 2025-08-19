import ActiveGames from '@/components/ActiveGames';
import { useTranslation } from '@/hooks/useTranslation';
import { isArabicAtom } from '@/state/languageAtoms';
import { motion } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { useNavigate } from 'react-router-dom';

/**
 * Landing page with simple navigation options. Hosts can create a
 * new session while players can join an existing one. All detailed
 * session setup now lives on the CreateSession page.
 */
export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isArabic = useAtomValue(isArabicAtom);

  const handleCreateSession = () => {
    navigate('/create-session');
  };

  const handleJoinGame = () => {
    navigate('/join');
  };

  const handleJoinGameById = (gameId: string) => {
    navigate(`/join?gameId=${gameId}`);
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
      <img
        src="/tahadialthalatheen/images/Logo.png"
        alt="تحدي الثلاثين"
        className="w-32 mb-6"
      />

      <motion.h1
        className="text-5xl sm:text-7xl font-extrabold mb-6 text-accent glow font-arabic text-center"
        style={{ textShadow: '0 0 30px #7c3aed, 0 0 20px #38bdf8' }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        تحدي الثلاثين
      </motion.h1>

      <motion.p
        className={`mb-10 text-accent2 text-lg text-center ${isArabic ? 'font-arabic' : ''}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {t('startChallenge')}
      </motion.p>

      {/* Active Games Section */}
      <ActiveGames onJoinGame={handleJoinGameById} />

      <motion.div
        className="flex flex-col gap-6 items-center w-full max-w-md"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={handleCreateSession}
          className={`w-full px-10 py-4 text-xl rounded-2xl font-bold bg-accent2 hover:bg-accent shadow-lg transition-all border border-accent glow ${isArabic ? 'font-arabic' : ''}`}
        >
          {t('createSession')}
        </button>

        <button
          onClick={handleJoinGame}
          className={`w-full px-6 py-3 text-lg rounded-xl font-bold bg-transparent hover:bg-white/10 text-white/80 hover:text-accent2 border border-white/20 hover:border-accent2 transition-all ${isArabic ? 'font-arabic' : ''}`}
        >
          {t('joinSession')}
        </button>
      </motion.div>

      <motion.div
        className={`mt-12 text-center text-white/60 text-sm max-w-md ${isArabic ? 'font-arabic' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p>{t('createSessionDesc')}</p>
        <p className="mt-1">{t('joinSessionDesc')}</p>
      </motion.div>
    </motion.div>
  );
}
