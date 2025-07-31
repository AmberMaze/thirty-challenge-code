import { useGame } from '@/hooks/useGame';
import VideoRoom from '@/components/VideoRoom';

/**
 * Host control interface shown on the PC. Displays join codes,
 * lets the host create or end the Daily video room, and offers
 * quick controls for starting the game or advancing questions.
 */
export default function ControlRoom() {
  const { state, startGame, createVideoRoom, endVideoRoom } = useGame();

  const handleCreate = async () => {
    if (!state.gameId) return;
    await createVideoRoom(state.gameId);
  };

  const handleEnd = async () => {
    if (!state.gameId) return;
    await endVideoRoom(state.gameId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#10102a] to-blue-900 p-6">
      <h1 className="text-4xl font-bold text-white mb-8 font-arabic text-center">
        غرفة التحكم
      </h1>

      {/* Display session codes */}
      <div className="text-center mb-6 space-y-1">
        <p className="text-accent2 font-arabic">
          رمز اللاعبين: <span className="font-mono">{state.gameId}</span>
        </p>
        <p className="text-accent2 font-arabic">
          رمز المقدم: <span className="font-mono">{state.hostCode}</span>
        </p>
      </div>

      {/* Host actions */}
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <button
          onClick={() => startGame()}
          disabled={state.phase !== 'CONFIG'}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-arabic"
        >
          ابدأ اللعبة
        </button>
        {!state.videoRoomCreated ? (
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-accent2 hover:bg-accent text-white rounded-lg font-arabic"
          >
            إنشاء غرفة الفيديو
          </button>
        ) : (
          <button
            onClick={handleEnd}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-arabic"
          >
            إنهاء غرفة الفيديو
          </button>
        )}
      </div>

      {/* Video tiles grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(
          [
            {
              id: 'host-mobile',
              label: 'المقدم',
              name: state.hostName ?? 'المقدم',
            },
            {
              id: 'playerA',
              label: 'لاعب 1',
              name: state.players.playerA.name || 'Player A',
            },
            {
              id: 'playerB',
              label: 'لاعب 2',
              name: state.players.playerB.name || 'Player B',
            },
          ] as const
        ).map((p) => (
          <div key={p.id as string}>
            <h3 className="text-center text-white font-arabic mb-2">
              {p.label}
            </h3>
            <VideoRoom
              gameId={state.gameId}
              userName={p.name}
              userRole={p.id as 'host-mobile' | 'playerA' | 'playerB'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
