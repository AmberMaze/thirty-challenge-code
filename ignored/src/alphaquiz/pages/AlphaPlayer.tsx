import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  myRoleAtom, 
  gamePhaseAtom, 
  currentSegmentAtom,
  myPlayerAtom 
} from '../state/alphaAtoms';
import AlphaScoreboard from '../components/AlphaScoreboard';
import AlphaBell from '../components/AlphaBell';

export default function AlphaPlayer() {
  const navigate = useNavigate();
  const [myRole] = useAtom(myRoleAtom);
  const [gamePhase] = useAtom(gamePhaseAtom);
  const [currentSegment] = useAtom(currentSegmentAtom);
  const [myPlayer] = useAtom(myPlayerAtom);

  // Redirect if not a player
  useEffect(() => {
    if (myRole === 'host' || (!myRole.startsWith('player'))) {
      navigate('/alpha-quiz');
    }
  }, [myRole, navigate]);

  const getSegmentInstructions = () => {
    switch (currentSegment.type) {
      case 'bell':
        return 'فقرة الجرس: اضغط الجرس بسرعة عندما تعرف الإجابة!';
      case 'sing':
        return 'سين & جيم: أسئلة صعبة - فكر جيداً قبل الضغط!';
      case 'remo':
        return 'التعويض: اضغط الجرس عندما تعرف الإجابة من الدلائل';
      default:
        return 'استعد للعب!';
    }
  };

  const getPhaseMessage = () => {
    switch (gamePhase) {
      case 'waiting':
        return 'في انتظار المقدم لبدء اللعبة...';
      case 'finished':
        return 'انتهت اللعبة!';
      default:
        return 'اللعبة جارية';
    }
  };

  const exitGame = () => {
    if (confirm('هل أنت متأكد من الخروج من اللعبة؟')) {
      navigate('/');
    }
  };

  return (
    <motion.div
      className="min-h-screen p-4 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-accent2 font-arabic">
            مرحباً {myPlayer?.name || 'لاعب'}!
          </h1>
          <p className="text-sm text-white/70 font-arabic">
            {myRole === 'player-a' ? 'لاعب أ' : 'لاعب ب'}
          </p>
        </div>
        <button
          onClick={exitGame}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-300 font-arabic transition-all text-sm"
        >
          خروج
        </button>
      </div>

      {/* Scoreboard */}
      <AlphaScoreboard />

      {/* Game Status */}
      <motion.div
        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <p className="text-lg text-white/90 font-arabic font-bold">
          {getPhaseMessage()}
        </p>
        {gamePhase !== 'waiting' && gamePhase !== 'finished' && (
          <p className="text-sm text-white/70 mt-2 font-arabic">
            {getSegmentInstructions()}
          </p>
        )}
      </motion.div>

      {/* Main Game Area */}
      {gamePhase === 'waiting' && (
        <motion.div
          className="bg-orange-500/20 rounded-xl p-6 border border-orange-400/30 text-center"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-orange-300 mb-2 font-arabic">
            في الانتظار
          </h2>
          <p className="text-white/80 font-arabic">
            المقدم يحضر اللعبة... كن مستعداً!
          </p>
        </motion.div>
      )}

      {(gamePhase === 'bell' || gamePhase === 'sing' || gamePhase === 'remo') && (
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-accent2 font-arabic">
              {currentSegment.type === 'bell' ? '🔔 فقرة الجرس' :
               currentSegment.type === 'sing' ? '❓ سين & جيم' :
               '🎯 التعويض'}
            </h2>
            
            {/* Bell Component */}
            <AlphaBell />
            
            {/* Instructions */}
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <p className="text-sm text-white/70 font-arabic">
                {currentSegment.type === 'bell' && '⚡ اضغط الجرس بسرعة عندما تسمع السؤال وتعرف الإجابة'}
                {currentSegment.type === 'sing' && '🤔 أسئلة صعبة - تأكد من إجابتك قبل الضغط'}
                {currentSegment.type === 'remo' && '🕵️ استمع للدلائل واضغط عندما تعرف الإجابة'}
              </p>
              <p className="text-xs text-white/50 mt-2 font-arabic">
                لديك 10 ثوانٍ للإجابة بعد الضغط
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {gamePhase === 'finished' && (
        <motion.div
          className="bg-green-500/20 rounded-xl p-6 border border-green-400/30 text-center"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-300 mb-4 font-arabic">
            انتهت اللعبة!
          </h2>
          <p className="text-white/80 mb-4 font-arabic">
            أحسنت! شكراً لك على المشاركة
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-accent2 hover:bg-accent rounded-xl text-white font-bold font-arabic transition-all"
          >
            العودة للصفحة الرئيسية
          </button>
        </motion.div>
      )}

      {/* Player Tips */}
      {gamePhase !== 'waiting' && gamePhase !== 'finished' && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="font-bold text-white/80 mb-2 font-arabic">نصائح للاعب:</h4>
          <ul className="text-sm text-white/60 space-y-1">
            <li className="font-arabic">• استمع للمقدم بعناية</li>
            <li className="font-arabic">• اضغط الجرس بسرعة عندما تعرف الإجابة</li>
            <li className="font-arabic">• لديك 10 ثوان للإجابة بعد الضغط</li>
            <li className="font-arabic">• الإجابات الخاطئة تعطيك عقوبات</li>
          </ul>
        </div>
      )}

      {/* Personal Stats */}
      {myPlayer && (
        <motion.div
          className="bg-white/5 rounded-xl p-4 border border-white/10"
          whileHover={{ scale: 1.02 }}
        >
          <h4 className="font-bold text-white/80 mb-2 font-arabic">إحصائياتك:</h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-blue-500/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">{myPlayer.score}</div>
              <div className="text-xs text-blue-300 font-arabic">النقاط</div>
            </div>
            <div className="bg-red-500/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-400">{myPlayer.strikes}</div>
              <div className="text-xs text-red-300 font-arabic">العقوبات</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}