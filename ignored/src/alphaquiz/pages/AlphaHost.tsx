import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  playersAtom, 
  gamePhaseAtom, 
  currentSegmentAtom, 
  bellStateAtom,
  myRoleAtom 
} from '../state/alphaAtoms';
import AlphaScoreboard from '../components/AlphaScoreboard';
import AlphaBell from '../components/AlphaBell';
import { useEffect } from 'react';

export default function AlphaHost() {
  const navigate = useNavigate();
  const [myRole] = useAtom(myRoleAtom);
  const [players, setPlayers] = useAtom(playersAtom);
  const [gamePhase, setGamePhase] = useAtom(gamePhaseAtom);
  const [currentSegment, setCurrentSegment] = useAtom(currentSegmentAtom);
  const [bellState, setBellState] = useAtom(bellStateAtom);

  // Redirect if not host
  useEffect(() => {
    if (myRole !== 'host') {
      navigate('/alpha-quiz');
    }
  }, [myRole, navigate]);

  const playerA = players.find(p => p.role === 'player-a');
  const playerB = players.find(p => p.role === 'player-b');
  const bothPlayersJoined = playerA && playerB;

  const startGame = () => {
    if (!bothPlayersJoined) return;
    setGamePhase('bell');
    setBellState(prev => ({ ...prev, isActive: true }));
  };

  const activateBell = () => {
    setBellState(prev => ({
      ...prev,
      isActive: true,
      pressedBy: null,
      pressedAt: null,
      timerRunning: false,
      timeLeft: 10,
    }));
  };

  const resetBell = () => {
    setBellState(prev => ({
      ...prev,
      isActive: false,
      pressedBy: null,
      pressedAt: null,
      timerRunning: false,
      timeLeft: 10,
    }));
  };

  const addScore = (playerId: string, points: number) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId 
        ? { ...p, score: Math.max(0, p.score + points) }
        : p
    ));
  };

  const addStrike = (playerId: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId 
        ? { ...p, strikes: p.strikes + 1 }
        : p
    ));
  };

  const nextSegment = () => {
    if (currentSegment.type === 'bell') {
      setCurrentSegment({ type: 'sing', questionNumber: 1, totalQuestions: 4 });
      setGamePhase('sing');
    } else if (currentSegment.type === 'sing') {
      setCurrentSegment({ type: 'remo', questionNumber: 1, totalQuestions: 3 });
      setGamePhase('remo');
    } else {
      setGamePhase('finished');
    }
    resetBell();
  };

  const nextQuestion = () => {
    if (currentSegment.questionNumber < currentSegment.totalQuestions) {
      setCurrentSegment(prev => ({
        ...prev,
        questionNumber: prev.questionNumber + 1
      }));
    } else {
      nextSegment();
    }
    resetBell();
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
        <h1 className="text-2xl font-bold text-accent2 font-arabic">
          لوحة تحكم المقدم
        </h1>
        <button
          onClick={exitGame}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-300 font-arabic transition-all"
        >
          خروج
        </button>
      </div>

      {/* Game Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AlphaScoreboard />
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-3 font-arabic">حالة اللعبة</h3>
          <div className="space-y-2 text-sm">
            <p className="text-white/80 font-arabic">
              المرحلة: {gamePhase === 'waiting' ? 'في الانتظار' : 
                       gamePhase === 'bell' ? 'فقرة الجرس' :
                       gamePhase === 'sing' ? 'سين & جيم' :
                       gamePhase === 'remo' ? 'التعويض' : 'انتهت'}
            </p>
            <p className="text-white/80 font-arabic">
              اللاعبين: {players.filter(p => p.role !== 'host').length}/2
            </p>
            <p className="text-white/80 font-arabic">
              الجرس: {bellState.isActive ? 'مفعل' : 'معطل'}
            </p>
          </div>
        </div>
      </div>

      {/* Waiting Phase */}
      {gamePhase === 'waiting' && (
        <motion.div
          className="bg-orange-500/20 rounded-xl p-6 border border-orange-400/30 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h2 className="text-xl font-bold text-orange-300 mb-4 font-arabic">
            في انتظار اللاعبين
          </h2>
          <p className="text-white/80 mb-4 font-arabic">
            {!playerA && !playerB && 'في انتظار انضمام اللاعبين...'}
            {playerA && !playerB && 'لاعب واحد انضم، في انتظار اللاعب الثاني...'}
            {playerA && playerB && 'كلا اللاعبين جاهز! يمكنك بدء اللعبة الآن.'}
          </p>
          {bothPlayersJoined && (
            <button
              onClick={startGame}
              className="px-6 py-3 bg-accent2 hover:bg-accent rounded-xl text-white font-bold font-arabic transition-all"
            >
              بدء اللعبة
            </button>
          )}
        </motion.div>
      )}

      {/* Game Controls */}
      {gamePhase !== 'waiting' && gamePhase !== 'finished' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bell Controls */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-bold text-white mb-4 font-arabic">تحكم الجرس</h3>
            <div className="flex justify-center mb-4">
              <AlphaBell />
            </div>
            <div className="flex gap-2">
              <button
                onClick={activateBell}
                className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-300 font-arabic transition-all"
              >
                تفعيل الجرس
              </button>
              <button
                onClick={resetBell}
                className="flex-1 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/30 rounded-lg text-yellow-300 font-arabic transition-all"
              >
                إعادة تعيين
              </button>
            </div>
          </div>

          {/* Score Controls */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-bold text-white mb-4 font-arabic">تحكم النقاط</h3>
            <div className="space-y-4">
              {[playerA, playerB].filter(Boolean).map((player) => (
                <div key={player!.id} className="space-y-2">
                  <p className="font-arabic text-white/80">{player!.name}</p>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => addScore(player!.id, 1)}
                      className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded text-blue-300 text-sm font-arabic"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => addScore(player!.id, -1)}
                      className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded text-red-300 text-sm font-arabic"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => addStrike(player!.id)}
                      className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/30 rounded text-orange-300 text-sm font-arabic"
                    >
                      عقوبة
                    </button>
                    <button
                      onClick={() => setPlayers(prev => prev.map(p => 
                        p.id === player!.id ? { ...p, strikes: 0 } : p
                      ))}
                      className="px-2 py-1 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-400/30 rounded text-gray-300 text-sm font-arabic"
                    >
                      مسح
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      {gamePhase !== 'waiting' && gamePhase !== 'finished' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
          <div className="flex gap-4 justify-center">
            <button
              onClick={nextQuestion}
              className="px-6 py-3 bg-accent2 hover:bg-accent rounded-xl text-white font-bold font-arabic transition-all"
            >
              السؤال التالي
            </button>
            <button
              onClick={nextSegment}
              className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-xl text-purple-300 font-bold font-arabic transition-all"
            >
              الفقرة التالية
            </button>
          </div>
        </div>
      )}

      {/* Game Finished */}
      {gamePhase === 'finished' && (
        <motion.div
          className="bg-green-500/20 rounded-xl p-6 border border-green-400/30 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h2 className="text-2xl font-bold text-green-300 mb-4 font-arabic">
            انتهت اللعبة! 🎉
          </h2>
          <div className="space-y-2">
            {playerA && playerB && (
              <p className="text-lg font-arabic text-white">
                الفائز: {playerA.score > playerB.score ? playerA.name : 
                         playerB.score > playerA.score ? playerB.name : 
                         'تعادل!'}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-3 bg-accent2 hover:bg-accent rounded-xl text-white font-bold font-arabic transition-all"
          >
            العودة للصفحة الرئيسية
          </button>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h4 className="font-bold text-white/80 mb-2 font-arabic">تعليمات المقدم:</h4>
        <ul className="text-sm text-white/60 space-y-1">
          <li className="font-arabic">• اقرأ الأسئلة بصوت عالٍ للاعبين</li>
          <li className="font-arabic">• فعل الجرس عندما تريد السماح للاعبين بالإجابة</li>
          <li className="font-arabic">• أضف نقاط (+1) للإجابات الصحيحة وعقوبات للخاطئة</li>
          <li className="font-arabic">• استخدم "السؤال التالي" للانتقال أو "الفقرة التالية" لتغيير النوع</li>
        </ul>
      </div>
    </motion.div>
  );
}