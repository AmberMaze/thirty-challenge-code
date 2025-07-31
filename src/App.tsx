import { Routes, Route } from 'react-router-dom';
import { GameProvider } from '@/context/GameContext';
import ConnectionBanner from '@/components/ConnectionBanner';

// Import the page components required for the early playable build.
import Landing from '@/pages/Landing';
import CreateSession from '@/pages/CreateSession';
import Join from '@/pages/Join';
import Lobby from '@/pages/Lobby';
import QuizRoom from '@/pages/QuizRoom';
import ControlRoom from '@/pages/ControlRoom';
import FinalScores from '@/pages/FinalScores';
import NotFound from '@/pages/NotFound';

/**
 * Root application component. This simplified router is used during
 * development to focus on core API and state management logic without
 * the distraction of all game flows. Additional routes will be added as
 * features mature.
 */
export default function App() {
  return (
    <GameProvider>
      <div className="dark min-h-screen bg-gradient-to-tr from-black via-[#10102a] to-accent2">
        <ConnectionBanner />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/create-session" element={<CreateSession />} />
          <Route path="/control-room" element={<ControlRoom />} />
          <Route path="/join" element={<Join />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/quiz" element={<QuizRoom />} />
          <Route path="/scores" element={<FinalScores />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </GameProvider>
  );
}
