import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { playerAAtom, playerBAtom, currentSegmentAtom } from '../state/alphaAtoms';

export default function AlphaScoreboard() {
  const [playerA] = useAtom(playerAAtom);
  const [playerB] = useAtom(playerBAtom);
  const [currentSegment] = useAtom(currentSegmentAtom);

  const getSegmentName = (type: string) => {
    switch (type) {
      case 'bell': return 'فقرة الجرس';
      case 'sing': return 'سين & جيم';
      case 'remo': return 'التعويض';
      default: return 'Alpha Quiz';
    }
  };

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-accent2 font-arabic">
          {getSegmentName(currentSegment.type)}
        </h2>
        <p className="text-sm text-white/70 font-arabic">
          السؤال {currentSegment.questionNumber} من {currentSegment.totalQuestions}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Player A */}
        <motion.div
          className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-center">
            <div className="text-sm text-blue-300 font-arabic mb-1">لاعب أ</div>
            <div className="text-lg font-bold text-white font-arabic">
              {playerA?.name || 'في الانتظار...'}
            </div>
            <div className="text-2xl font-bold text-blue-400 mt-2">
              {playerA?.score || 0}
            </div>
            <div className="text-xs text-white/60 mt-1">
              عقوبات: {playerA?.strikes || 0}
            </div>
          </div>
        </motion.div>

        {/* Player B */}
        <motion.div
          className="bg-green-500/20 rounded-lg p-3 border border-green-400/30"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-center">
            <div className="text-sm text-green-300 font-arabic mb-1">لاعب ب</div>
            <div className="text-lg font-bold text-white font-arabic">
              {playerB?.name || 'في الانتظار...'}
            </div>
            <div className="text-2xl font-bold text-green-400 mt-2">
              {playerB?.score || 0}
            </div>
            <div className="text-xs text-white/60 mt-1">
              عقوبات: {playerB?.strikes || 0}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}