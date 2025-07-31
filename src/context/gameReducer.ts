import { produce, Draft } from 'immer';
import type {
  GameState,
  GamePhase,
  SegmentCode,
  Player,
  PlayerId,
  ScoreEvent,
  GameAction as SpecAction,
} from '@/types/game';
import { initialGameState } from './initialGameState';

export type GameAction =
  | SpecAction
  | { type: 'INIT'; payload: GameState }
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'SET_CURRENT_SEGMENT'; segment: SegmentCode | null }
  | { type: 'ADD_PLAYER'; player: Player }
  | { type: 'UPDATE_PLAYER'; id: PlayerId; partial: Partial<Player> }
  | { type: 'UPDATE_TIMER'; timer: number; isRunning: boolean }
  | { type: 'PUSH_SCORE_EVENT'; event: ScoreEvent }
  | { type: 'RESET_STRIKES' }
  | { type: 'COMPLETE_GAME' };

export function gameReducer(state: GameState, action: GameAction) {
  return produce<GameState>(state, (draft: Draft<GameState>) => {
    switch (action.type) {
      case 'INIT':
        return action.payload;

      case 'SET_PHASE':
        draft.phase = action.phase;
        if (action.phase === 'CONFIG') draft.currentSegment = null;
        return;

      case 'SET_CURRENT_SEGMENT':
        draft.currentSegment = action.segment;
        draft.currentQuestionIndex = 0;
        draft.timer = 0;
        draft.isTimerRunning = false;
        return;

      case 'NEXT_QUESTION':
        draft.currentQuestionIndex += 1;
        draft.timer = 0;
        draft.isTimerRunning = false;
        Object.values(draft.players).forEach((p) => {
          p.strikes = 0;
        });
        return;
      case 'NEXT_SEGMENT':
        draft.currentQuestionIndex = 0;
        draft.timer = 0;
        draft.isTimerRunning = false;
        Object.values(draft.players).forEach((p) => {
          p.strikes = 0;
        });
        return;

      case 'ADD_PLAYER':
        draft.players[action.player.id] = action.player;
        return;

      case 'UPDATE_PLAYER':
        Object.assign(draft.players[action.id], action.partial);
        return;

      case 'UPDATE_SCORE': {
        const player = draft.players[action.payload.playerId];
        player.score += action.payload.points;
        return;
      }

      case 'ADD_STRIKE': {
        const player = draft.players[action.payload.playerId];
        player.strikes = (player.strikes || 0) + 1;
        return;
      }

      case 'USE_SPECIAL_BUTTON': {
        const player = draft.players[action.payload.playerId];
        player.specialButtons[action.payload.buttonType] = false;
        return;
      }

      case 'START_TIMER':
        draft.timer = action.payload.duration;
        draft.isTimerRunning = true;
        return;

      case 'STOP_TIMER':
        draft.timer = 0;
        draft.isTimerRunning = false;
        return;

      case 'TICK_TIMER':
        if (draft.timer > 0) draft.timer -= 1;
        return;

      case 'RESET_GAME':
        return { ...initialGameState } as GameState;

      case 'UPDATE_TIMER':
        draft.timer = action.timer;
        draft.isTimerRunning = action.isRunning;
        return;

      case 'PUSH_SCORE_EVENT':
        draft.scoreHistory.push(action.event);
        return;

      case 'RESET_STRIKES':
        Object.values(draft.players).forEach((p) => {
          p.strikes = 0;
        });
        return;

      case 'COMPLETE_GAME':
        draft.phase = 'COMPLETED';
        draft.isTimerRunning = false;
        return;
    }
  });
}
