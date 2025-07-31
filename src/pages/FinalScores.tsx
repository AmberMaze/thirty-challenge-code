import Scoreboard from '@/components/Scoreboard';
import { useGame } from '@/hooks/useGame';

export default function FinalScores() {
  const { state } = useGame();

  if (state.phase !== 'COMPLETED') return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-[#10102a] to-blue-900 p-4">
      <h1 className="text-3xl text-white font-bold mb-6 font-arabic">
        النتائج النهائية
      </h1>
      <Scoreboard />
    </div>
  );
}
