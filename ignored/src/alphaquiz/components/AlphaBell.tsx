import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { bellStateAtom, myPlayerIdAtom, myRoleAtom, playersAtom } from '../state/alphaAtoms';
import { useEffect } from 'react';

export default function AlphaBell() {
  const [bellState, setBellState] = useAtom(bellStateAtom);
  const [myPlayerId] = useAtom(myPlayerIdAtom);
  const [myRole] = useAtom(myRoleAtom);
  const [players] = useAtom(playersAtom);

  // Timer countdown effect
  useEffect(() => {
    if (bellState.timerRunning && bellState.timeLeft > 0) {
      const timer = setTimeout(() => {
        setBellState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (bellState.timerRunning && bellState.timeLeft === 0) {
      // Timer finished
      setBellState(prev => ({
        ...prev,
        timerRunning: false,
        isActive: false,
      }));
    }
  }, [bellState.timerRunning, bellState.timeLeft, setBellState]);

  const pressBell = () => {
    if (!bellState.isActive || bellState.pressedBy) return;
    if (myRole === 'host') return; // Host can't press the bell
    
    setBellState(prev => ({
      ...prev,
      pressedBy: myPlayerId,
      pressedAt: Date.now(),
      timerRunning: true,
      timeLeft: 10,
    }));
  };

  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return '';
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Unknown';
  };

  const canPress = bellState.isActive && !bellState.pressedBy && myRole !== 'host';

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Bell Button */}
      <motion.button
        onClick={pressBell}
        disabled={!canPress}
        className={`
          w-32 h-32 rounded-full border-4 font-bold text-2xl transition-all duration-200 font-arabic
          ${canPress 
            ? 'bg-yellow-400 border-yellow-500 text-yellow-900 hover:bg-yellow-300 hover:scale-105 shadow-lg cursor-pointer' 
            : bellState.pressedBy 
              ? 'bg-red-400 border-red-500 text-red-900 cursor-not-allowed'
              : 'bg-gray-400 border-gray-500 text-gray-700 cursor-not-allowed opacity-50'
          }
        `}
        whileTap={canPress ? { scale: 0.95 } : {}}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        🔔
      </motion.button>

      {/* Bell Status */}
      <div className="text-center">
        {!bellState.isActive && (
          <p className="text-white/60 font-arabic">الجرس غير مفعل</p>
        )}
        
        {bellState.isActive && !bellState.pressedBy && (
          <p className="text-yellow-400 font-arabic font-bold animate-pulse">
            اضغط الجرس للإجابة!
          </p>
        )}
        
        {bellState.pressedBy && (
          <div className="space-y-2">
            <p className="text-accent2 font-arabic font-bold">
              {getPlayerName(bellState.pressedBy)} ضغط الجرس!
            </p>
            {bellState.timerRunning && (
              <motion.div
                className="text-2xl font-bold text-red-400"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {bellState.timeLeft}
              </motion.div>
            )}
            {!bellState.timerRunning && bellState.timeLeft === 0 && (
              <p className="text-red-400 font-arabic">انتهى الوقت!</p>
            )}
          </div>
        )}
      </div>

      {/* Instructions for players */}
      {myRole !== 'host' && (
        <div className="text-center text-xs text-white/50 max-w-sm">
          <p className="font-arabic">
            اضغط الجرس بسرعة عندما يكون مفعلاً للحصول على فرصة الإجابة
          </p>
        </div>
      )}
    </div>
  );
}