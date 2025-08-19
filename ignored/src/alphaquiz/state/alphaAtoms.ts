import { atom } from 'jotai';

// Player roles
export type PlayerRole = 'host' | 'player-a' | 'player-b';

// Game state
export type GamePhase = 'entry' | 'waiting' | 'bell' | 'sing' | 'remo' | 'finished';

// Player data
export interface AlphaPlayer {
  id: string;
  name: string;
  role: PlayerRole;
  score: number;
  strikes: number;
}

// Current question/segment
export interface CurrentSegment {
  type: 'bell' | 'sing' | 'remo';
  questionNumber: number;
  totalQuestions: number;
}

// Bell state for BELL and SING segments
export interface BellState {
  isActive: boolean;
  pressedBy: string | null; // player id who pressed the bell
  pressedAt: number | null;
  timerRunning: boolean;
  timeLeft: number; // seconds
}

// Core game state atoms
export const gamePhaseAtom = atom<GamePhase>('entry');
export const playersAtom = atom<AlphaPlayer[]>([]);
export const currentSegmentAtom = atom<CurrentSegment>({ type: 'bell', questionNumber: 1, totalQuestions: 5 });
export const bellStateAtom = atom<BellState>({
  isActive: false,
  pressedBy: null,
  pressedAt: null,
  timerRunning: false,
  timeLeft: 10,
});

// User's role atom
export const myRoleAtom = atom<PlayerRole>('host');
export const myPlayerIdAtom = atom<string>('');

// Derived atoms
export const myPlayerAtom = atom(
  (get) => {
    const players = get(playersAtom);
    const myId = get(myPlayerIdAtom);
    return players.find(p => p.id === myId) || null;
  }
);

export const playerAAtom = atom(
  (get) => {
    const players = get(playersAtom);
    return players.find(p => p.role === 'player-a') || null;
  }
);

export const playerBAtom = atom(
  (get) => {
    const players = get(playersAtom);
    return players.find(p => p.role === 'player-b') || null;
  }
);

export const hostPlayerAtom = atom(
  (get) => {
    const players = get(playersAtom);
    return players.find(p => p.role === 'host') || null;
  }
);