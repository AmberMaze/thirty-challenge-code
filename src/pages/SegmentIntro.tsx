import { useGame } from '@/hooks/useGame';

export default function SegmentIntro() {
  const { state } = useGame();

  if (!state.currentSegment) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-[#10102a] to-blue-900 p-4">
      <div className="text-center text-white space-y-4">
        <h1 className="text-4xl font-bold font-arabic">
          {state.currentSegment}
        </h1>
        <p className="text-white/70 font-arabic">استعد لبدء الفقرة</p>
      </div>
    </div>
  );
}
