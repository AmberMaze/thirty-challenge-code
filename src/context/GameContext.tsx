import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import type { GameState, SegmentCode, PlayerId } from '@/types/game';
import { GameDatabase, type GameRecord } from '@/lib/gameDatabase';
import { attachGameSync, createGameSync, type GameSync } from '@/lib/gameSync';
import { gameReducer, type GameAction } from './gameReducer';
import { initialGameState } from './initialGameState';
import { defaultPlayers } from './defaults';

/** Map a Supabase record to our internal GameState shape */
export function mapRecordToState(record: GameRecord): GameState {
  return {
    ...initialGameState,
    gameId: record.id,
    hostCode: record.host_code,
    hostName: record.host_name ?? null,
    phase: record.phase as GameState['phase'],
    currentSegment: record.current_segment as GameState['currentSegment'],
    currentQuestionIndex: record.current_question_index,
    videoRoomUrl: record.video_room_url ?? undefined,
    videoRoomCreated: record.video_room_created,
    timer: record.timer,
    isTimerRunning: record.is_timer_running,
    segmentSettings: record.segment_settings as Record<SegmentCode, number>,
    players: defaultPlayers,
  };
}

export const GameContext = createContext<
  { state: GameState; dispatch: React.Dispatch<GameAction> } | undefined
>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const gameSyncRef = useRef<GameSync | null>(null);
  useEffect(() => {
    if (!state.gameId) return;
    const detach = attachGameSync(state.gameId, dispatch);
    if (!gameSyncRef.current) {
      const gs = createGameSync(state.gameId, {
        onGameStateUpdate: (gs) =>
          dispatch({ type: 'INIT', payload: { ...state, ...gs } as GameState }),
        onPlayerJoin: () => {},
        onPlayerLeave: () => {},
        onHostUpdate: () => {},
        onVideoRoomUpdate: () => {},
      });
      void gs.connect();
      gameSyncRef.current = gs;
    }
    return () => {
      detach();
      gameSyncRef.current?.disconnect();
      gameSyncRef.current = null;
    };
  }, [state.gameId]);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  const { state, dispatch } = ctx;

  // ================ Helper actions =================

  const startSession = async (
    gameId: string,
    hostCode: string,
    hostName: string | null,
    segmentSettings: Record<SegmentCode, number>,
  ) => {
    const record = await GameDatabase.createGame(
      gameId,
      hostCode,
      hostName,
      segmentSettings,
    );
    if (record) dispatch({ type: 'INIT', payload: mapRecordToState(record) });
  };

  const startGame = () => dispatch({ type: 'SET_PHASE', phase: 'PLAYING' });

  const advanceQuestion = () => dispatch({ type: 'ADVANCE_QUESTION' });

  // ================= Daily.co video helpers =================
  const callFn = async (name: string, payload: unknown) => {
    const res = await fetch(`/.netlify/functions/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  const createVideoRoom = async (gameId: string) => {
    const result = (await callFn('create-daily-room', {
      roomName: gameId,
    })) as {
      url?: string;
      error?: string;
    };
    if (result.url) {
      await GameDatabase.updateGame(gameId, {
        video_room_url: result.url,
        video_room_created: true,
      });
      return { success: true, roomUrl: result.url };
    }
    return { success: false, error: result.error || 'create failed' };
  };

  const endVideoRoom = async (gameId: string) => {
    await callFn('delete-daily-room', { roomName: gameId });
    await GameDatabase.updateGame(gameId, {
      video_room_created: false,
      video_room_url: null,
    });
    return { success: true };
  };

  /**
   * Request a Daily.co meeting token for a participant.
   *
   * @param room - Daily.co room name
   * @param user - Display name for the token
   * @param isHost - Whether the user should have host privileges
   * @returns The token string, or null if generation failed
   */
  const generateDailyToken = async (
    room: string,
    user: string,
    isHost: boolean,
  ): Promise<string | null> => {
    try {
      const res = await fetch('/.netlify/functions/create-daily-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, user, isHost }),
      });
      const json = (await res.json()) as { token?: string; error?: string };
      if (!json.token) throw new Error(json.error || 'No token');
      return json.token;
    } catch (err) {
      console.error('generateDailyToken error', err);
      return null;
    }
  };

  const actions = {
    startGame: async (gameId: string, hostName?: string) => {
      dispatch({
        type: 'START_GAME',
        payload: { gameId, hostCode: state.hostCode },
      });
      await GameDatabase.updateGame(gameId, {
        phase: 'PLAYING',
        host_name: hostName ?? state.hostName,
      });
      await gameSyncRef.current?.broadcastGameState({ phase: 'PLAYING' });
    },
    joinGame: async (
      playerId: PlayerId,
      playerData: Partial<GameState['players'][PlayerId]>,
    ) => {
      dispatch({ type: 'JOIN_GAME', payload: { playerId, playerData } });
      await GameDatabase.addPlayer(playerId, state.gameId, {
        name: playerData.name || '',
        flag: playerData.flag,
        club: playerData.club,
        role: playerId,
      });
      await gameSyncRef.current?.broadcastPlayerJoin(playerId, playerData);
    },
    updateHostName: async (name: string) => {
      dispatch({ type: 'UPDATE_HOST_NAME', payload: { hostName: name } });
      await GameDatabase.updateGame(state.gameId, { host_name: name });
      await gameSyncRef.current?.broadcastHostUpdate(name);
    },
    updateSegmentSettings: async (settings: Record<SegmentCode, number>) => {
      dispatch({ type: 'UPDATE_SEGMENT_SETTINGS', payload: { settings } });
      await GameDatabase.updateGame(state.gameId, {
        segment_settings: settings,
      });
      await gameSyncRef.current?.broadcastGameState({
        segment_settings: settings,
      });
    },
    createVideoRoom,
    endVideoRoom,
    generateDailyToken,
    trackPresence: (participantData: {
      id: string;
      name: string;
      type: 'host-pc' | 'host-mobile' | 'player';
      playerId?: PlayerId;
      flag?: string;
      club?: string;
    }) => {
      void gameSyncRef.current?.trackPresence(participantData);
    },
    nextQuestion: async () => {
      dispatch({ type: 'NEXT_QUESTION' });
      await GameDatabase.updateGame(state.gameId, {
        current_question_index: state.currentQuestionIndex + 1,
      });
      await gameSyncRef.current?.broadcastGameState({
        current_question_index: state.currentQuestionIndex + 1,
      });
    },
    nextSegment: async () => {
      dispatch({ type: 'NEXT_SEGMENT' });
      const order: SegmentCode[] = ['WSHA', 'AUCT', 'BELL', 'SING', 'REMO'];
      const idx = state.currentSegment
        ? order.indexOf(state.currentSegment) + 1
        : 0;
      const next = idx < order.length ? order[idx] : null;
      dispatch({ type: 'SET_CURRENT_SEGMENT', segment: next });
      await GameDatabase.updateGame(state.gameId, {
        current_segment: next,
        current_question_index: 0,
      });
      await gameSyncRef.current?.broadcastGameState({
        current_segment: next,
        current_question_index: 0,
      });
    },
    updateScore: async (playerId: PlayerId, points: number) => {
      dispatch({ type: 'UPDATE_SCORE', payload: { playerId, points } });
      const newScore = state.players[playerId].score + points;
      await GameDatabase.updatePlayer(playerId, { score: newScore });
      await gameSyncRef.current?.broadcastGameState({
        players: { [playerId]: { score: newScore } },
      });
    },
    addStrike: async (playerId: PlayerId) => {
      dispatch({ type: 'ADD_STRIKE', payload: { playerId } });
      const strikes = (state.players[playerId].strikes || 0) + 1;
      await GameDatabase.updatePlayer(playerId, { strikes });
      await gameSyncRef.current?.broadcastGameState({
        players: { [playerId]: { strikes } },
      });
    },
    useSpecialButton: async (
      playerId: PlayerId,
      buttonType: keyof GameState['players'][PlayerId]['specialButtons'],
    ) => {
      dispatch({
        type: 'USE_SPECIAL_BUTTON',
        payload: { playerId, buttonType },
      });
      const buttons = {
        ...state.players[playerId].specialButtons,
        [buttonType]: false,
      };
      await GameDatabase.updatePlayer(playerId, { special_buttons: buttons });
      await gameSyncRef.current?.broadcastGameState({
        players: { [playerId]: { specialButtons: buttons } },
      });
    },
    startTimer: async (duration: number) => {
      dispatch({ type: 'START_TIMER', payload: { duration } });
      await GameDatabase.updateGame(state.gameId, {
        timer: duration,
        is_timer_running: true,
      });
      await gameSyncRef.current?.broadcastGameState({
        timer: duration,
        isTimerRunning: true,
      });
    },
    stopTimer: async () => {
      dispatch({ type: 'STOP_TIMER' });
      await GameDatabase.updateGame(state.gameId, {
        timer: 0,
        is_timer_running: false,
      });
      await gameSyncRef.current?.broadcastGameState({
        timer: 0,
        isTimerRunning: false,
      });
    },
    tickTimer: () => {
      dispatch({ type: 'TICK_TIMER' });
      void gameSyncRef.current?.broadcastGameState({ timer: state.timer - 1 });
    },
    resetGame: async () => {
      dispatch({ type: 'RESET_GAME' });
      await GameDatabase.updateGame(state.gameId, {
        phase: 'CONFIG',
        current_segment: null,
        current_question_index: 0,
        timer: 0,
        is_timer_running: false,
      });
      await gameSyncRef.current?.broadcastGameState({ phase: 'CONFIG' });
    },
  };
  return {
    state,
    dispatch,
    startSession,
    startGame,
    advanceQuestion,
    createVideoRoom,
    endVideoRoom,
    generateDailyToken,
    actions,
  };
}
