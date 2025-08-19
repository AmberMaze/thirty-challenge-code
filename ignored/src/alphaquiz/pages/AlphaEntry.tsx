import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { myRoleAtom, myPlayerIdAtom, playersAtom, gamePhaseAtom } from '../state/alphaAtoms';

/**
 * Alpha Quiz entry page - simplified entry without room IDs
 * Players just enter their name and get assigned roles automatically
 */
export default function AlphaEntry() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [, setMyRole] = useAtom(myRoleAtom);
  const [, setMyPlayerId] = useAtom(myPlayerIdAtom);
  const [players, setPlayers] = useAtom(playersAtom);
  const [, setGamePhase] = useAtom(gamePhaseAtom);

  const joinAsHost = () => {
    if (!playerName.trim()) return;
    
    const hostId = 'host-' + Date.now();
    setMyRole('host');
    setMyPlayerId(hostId);
    setPlayers([{
      id: hostId,
      name: playerName.trim(),
      role: 'host',
      score: 0,
      strikes: 0,
    }]);
    setGamePhase('waiting');
    navigate('/alpha-quiz/host');
  };

  const joinAsPlayer = () => {
    if (!playerName.trim()) return;
    
    const existingPlayers = players.filter(p => p.role !== 'host');
    
    if (existingPlayers.length >= 2) {
      alert('عذراً، اللعبة ممتلئة! يمكن للاعبين اثنين فقط الانضمام.');
      return;
    }
    
    const playerRole = existingPlayers.length === 0 ? 'player-a' : 'player-b';
    const playerId = `${playerRole}-${Date.now()}`;
    
    setMyRole(playerRole);
    setMyPlayerId(playerId);
    
    setPlayers(prev => [...prev, {
      id: playerId,
      name: playerName.trim(),
      role: playerRole,
      score: 0,
      strikes: 0,
    }]);
    
    navigate('/alpha-quiz/player');
  };

  const goBack = () => {
    navigate('/');
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
      <motion.div
        className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-center mb-2 text-accent2 font-arabic">
          Alpha Quiz 🚀
        </h1>
        
        <p className="text-center mb-6 text-white/70 font-arabic text-sm">
          نسخة مبسطة بدون فيديو - للاختبار فقط
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-white/80 mb-2 font-arabic">
              أدخل اسمك:
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-accent2 font-arabic text-right"
              placeholder="اسم اللاعب..."
              dir="rtl"
            />
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={joinAsHost}
              disabled={!playerName.trim()}
              className="w-full px-6 py-3 text-lg rounded-xl font-bold bg-accent2 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all font-arabic"
            >
              انضمام كمقدم (PC)
            </button>

            <button
              onClick={joinAsPlayer}
              disabled={!playerName.trim()}
              className="w-full px-6 py-3 text-lg rounded-xl font-bold bg-transparent hover:bg-white/10 text-white/80 hover:text-accent2 border border-white/20 hover:border-accent2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-arabic"
            >
              انضمام كلاعب (Phone)
            </button>
          </div>

          <div className="pt-4 text-center text-white/60 text-sm space-y-1">
            <p className="font-arabic">
              المقدم: يرى الأسئلة ويتحكم في اللعبة
            </p>
            <p className="font-arabic">
              اللاعب: يشارك في الإجابة على الأسئلة
            </p>
            <p className="font-arabic text-orange-300">
              ⚠️ يمكن لاعبين فقط + مقدم واحد
            </p>
          </div>
        </div>

        <button
          onClick={goBack}
          className="w-full mt-6 px-4 py-2 text-sm rounded-lg font-bold bg-transparent hover:bg-white/5 text-white/60 hover:text-white/80 border border-white/10 hover:border-white/20 transition-all font-arabic"
        >
          العودة للصفحة الرئيسية
        </button>
      </motion.div>
    </motion.div>
  );
}