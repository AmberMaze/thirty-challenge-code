import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import type { GameRecord, PlayerRecord } from '@/lib/gameDatabase';
import { GameDatabase } from '@/lib/gameDatabase';
import type { GameState, PlayerId, Player } from '@/types/game';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createStore } from 'jotai';
type Store = ReturnType<typeof createStore>;
import { 
  updateGameStateAtom, 
  addPlayerAtom, 
  updatePlayerAtom,
  isConnectedToSupabaseAtom,
  connectionErrorAtom,
  gameSyncInstanceAtom,
  lobbyParticipantsAtom,
  broadcastEventAtom,
  type LobbyParticipant
} from '@/state';

function mapPlayerRecord(record: PlayerRecord): Player {
  return {
    id: record.id as PlayerId,
    name: record.name,
    flag: record.flag ?? undefined,
    club: record.club ?? undefined,
    role: record.role,
    score: record.score,
    strikes: record.strikes,
    isConnected: record.is_connected,
    specialButtons: record.special_buttons as Player['specialButtons'],
  };
}

function mapRecordToState(record: GameRecord): Partial<GameState> {
  return {
    gameId: record.id,
    hostCode: record.host_code,
    hostName: record.host_name ?? null,
    hostIsConnected: record.host_is_connected ?? false,
    phase: record.phase as GameState['phase'],
    currentSegment: record.current_segment as GameState['currentSegment'],
    currentQuestionIndex: record.current_question_index,
    videoRoomUrl: record.video_room_url ?? undefined,
    videoRoomCreated: record.video_room_created,
    timer: record.timer,
    isTimerRunning: record.is_timer_running,
    segmentSettings: record.segment_settings,
  };
}

export class AtomGameSync {
  private gameId: string;
  private store: Store;
  private channel: RealtimeChannel | null = null;
  private gameSubscription: RealtimeChannel | null = null;

  constructor(gameId: string, store: Store) {
    this.gameId = gameId;
    this.store = store;
  }

  async connect() {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, using local state only');
      this.store.set(connectionErrorAtom, 'Supabase not configured');
      return;
    }

    try {
      // Use singleton Supabase client
      
      // Create channel for real-time presence and broadcasts
      this.channel = supabase.channel(`game:${this.gameId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: 'participants' },
        },
      });

      // Listen for game state broadcasts with correct payload structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.channel as any).on(
        'broadcast',
        { event: 'game_state_update' },
        (data: { payload?: { gameState?: Partial<GameState> } }) => {
          if (data.payload?.gameState) {
            this.store.set(updateGameStateAtom, data.payload.gameState);
          }
        }
      );

      // Listen for player events with correct payload structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.channel as any).on(
        'broadcast',
        { event: 'player_join' },
        (data: { payload?: { playerId?: PlayerId; playerData?: unknown } }) => {
          if (data.payload?.playerId && data.payload?.playerData) {
            this.store.set(addPlayerAtom, data.payload.playerData as Player);
          }
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.channel as any).on(
        'broadcast',
        { event: 'player_leave' },
        (data: { payload?: { playerId?: PlayerId } }) => {
          if (data.payload?.playerId) {
            this.store.set(updatePlayerAtom, {
              playerId: data.payload.playerId,
              update: { isConnected: false }
            });
          }
        }
      );

      // Handle presence updates
      this.channel.on('presence', { event: 'sync' }, () => {
        this.updatePresenceState();
      });

      this.channel.on('presence', { event: 'join' }, () => {
        this.updatePresenceState();
      });

      this.channel.on('presence', { event: 'leave' }, () => {
        this.updatePresenceState();
      });

      // Subscribe to postgres changes for game and players
      this.gameSubscription = supabase
        .channel(`postgres:${this.gameId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${this.gameId}`,
          },
          (payload) => {
            const newRow = payload.new as GameRecord;
            this.store.set(updateGameStateAtom, mapRecordToState(newRow));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'players',
            filter: `game_id=eq.${this.gameId}`,
          },
          (payload) => {
            const pl = payload.new as PlayerRecord;
            this.store.set(addPlayerAtom, mapPlayerRecord(pl));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'players',
            filter: `game_id=eq.${this.gameId}`,
          },
          (payload) => {
            const pl = payload.new as PlayerRecord;
            this.store.set(updatePlayerAtom, {
              playerId: pl.id as PlayerId,
              update: mapPlayerRecord(pl),
            });
          }
        )
        .subscribe();

      // Subscribe to the main channel
      await this.channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Connected to game channel: ${this.gameId}`);
          this.store.set(isConnectedToSupabaseAtom, true);
          this.store.set(connectionErrorAtom, null);
        }
      });

      // Store the instance reference
      this.store.set(gameSyncInstanceAtom, this);

    } catch (error) {
      console.error('Failed to connect to game sync:', error);
      this.store.set(connectionErrorAtom, error instanceof Error ? error.message : 'Connection failed');
      this.store.set(isConnectedToSupabaseAtom, false);
    }
  }

  private updatePresenceState() {
    if (!this.channel) return;

    const presenceState = this.channel.presenceState();
    const participants: LobbyParticipant[] = [];

    Object.values(presenceState).forEach((presence: unknown) => {
      (presence as unknown[]).forEach((participant: unknown) => {
        const p = participant as LobbyParticipant;
        participants.push({
          id: p.id,
          name: p.name,
          type: p.type,
          playerId: p.playerId,
          flag: p.flag,
          club: p.club,
          isConnected: true,
        });
      });
    });

    // Clear existing participants first, then add current ones
    // This ensures we have accurate presence tracking
    this.store.set(lobbyParticipantsAtom, participants);
    
    // Also update player connection status if they are tracked players
    participants.forEach(participant => {
      if (participant.playerId && (participant.playerId === 'playerA' || participant.playerId === 'playerB')) {
        this.store.set(updatePlayerAtom, {
          playerId: participant.playerId,
          update: { isConnected: true, name: participant.name }
        });
        
        // Update database to reflect connection status
        GameDatabase.updatePlayerById(participant.playerId, { 
          is_connected: true,
          last_active: new Date().toISOString()
        }).then(result => {
          if (!result.success) {
            console.warn(`Failed to update player ${participant.playerId} connection:`, result.error);
          }
        }).catch(console.error);
      }
    });

    // Mark players as disconnected if they're not in presence
    const presentPlayerIds = new Set(participants
      .filter(p => p.playerId)
      .map(p => p.playerId));
      
    ['playerA', 'playerB'].forEach(playerId => {
      if (!presentPlayerIds.has(playerId as PlayerId)) {
        this.store.set(updatePlayerAtom, {
          playerId: playerId as PlayerId,
          update: { isConnected: false }
        });
        
        // Update database to reflect disconnection
        GameDatabase.updatePlayerById(playerId, { 
          is_connected: false,
          last_active: new Date().toISOString()
        }).then(result => {
          if (!result.success) {
            console.warn(`Failed to update player ${playerId} disconnection:`, result.error);
          }
        }).catch(console.error);
      }
    });
  }

  // Broadcast methods using proper Supabase v2 channel API
  async broadcastGameState(gameState: Partial<GameState>) {
    if (!this.channel) return;

    try {
      // Use proper Supabase v2 broadcast API format
      const result = await this.channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload: { gameState },
      });

      if (result === BROADCAST_SUCCESS) {
        this.store.set(broadcastEventAtom, {
          event: 'game_state_update',
          payload: gameState,
        });
      } else {
        console.warn('Broadcast may not have been delivered:', result);
      }
    } catch (error) {
      console.error('Failed to broadcast game state:', error);
    }
  }

  async broadcastPlayerJoin(playerId: PlayerId, playerData: Player) {
    if (!this.channel) return;

    try {
      // Use proper Supabase v2 broadcast API format
      const result = await this.channel.send({
        type: 'broadcast', 
        event: 'player_join',
        payload: { playerId, playerData },
      });

      if (result === 'ok') {
        this.store.set(broadcastEventAtom, {
          event: 'player_join',
          payload: { playerId, playerData },
        });
      } else {
        console.warn('Broadcast may not have been delivered:', result);
      }
    } catch (error) {
      console.error('Failed to broadcast player join:', error);
    }
  }

  async broadcastPlayerLeave(playerId: PlayerId) {
    if (!this.channel) return;

    try {
      // Use proper Supabase v2 broadcast API format
      const result = await this.channel.send({
        type: 'broadcast',
        event: 'player_leave',
        payload: { playerId },
      });

      if (result === 'ok') {
        this.store.set(broadcastEventAtom, {
          event: 'player_leave',
          payload: { playerId },
        });
      } else {
        console.warn('Broadcast may not have been delivered:', result);
      }
    } catch (error) {
      console.error('Failed to broadcast player leave:', error);
    }
  }

  async trackPresence(participantData: LobbyParticipant) {
    if (!this.channel) return;

    try {
      await this.channel.track(participantData);
    } catch (error) {
      console.error('Failed to track presence:', error);
    }
  }

  async disconnect() {
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }

    if (this.gameSubscription) {
      supabase.removeChannel(this.gameSubscription);
      this.gameSubscription = null;
    }

    this.store.set(isConnectedToSupabaseAtom, false);
    this.store.set(gameSyncInstanceAtom, null);
  }
}

// Factory function to create and connect game sync
export async function createAtomGameSync(gameId: string, store: Store): Promise<AtomGameSync> {
  const gameSync = new AtomGameSync(gameId, store);
  await gameSync.connect();
  return gameSync;
}