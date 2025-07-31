import { supabase, isSupabaseConfigured } from './supabaseClient';
// GameState and PlayerId types are not needed in this module
const FALLBACK_SEGMENT_SETTINGS: Record<string, number> = {
  WSHA: 4,
  AUCT: 4,
  BELL: 10,
  SING: 10,
  REMO: 4,
};

export interface GameRecord {
  id: string;
  host_code: string; // Host code used for auth; non-unique
  host_name: string | null;
  phase: string; // 'CONFIG' | 'LOBBY' | 'PLAYING' | 'COMPLETED'
  current_segment: string | null;
  current_question_index: number;
  timer: number;
  is_timer_running: boolean;
  video_room_url: string | null;
  video_room_created: boolean;
  segment_settings: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface PlayerRecord {
  id: string;
  game_id: string;
  name: string;
  flag: string | null;
  club: string | null;
  role: string;
  score: number;
  strikes: number;
  is_connected: boolean;
  special_buttons: Record<string, boolean>;
  joined_at: string;
  last_active: string;
}

export class GameDatabase {
  // Check if Supabase is configured
  static isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  // =====================================
  // GAME OPERATIONS
  // =====================================

  /**
   * Insert a new game in CONFIG phase.
   *
   * @param gameId        six-char player join code
   * @param hostCode      full host code e.g. ABC123-HOST
   * @param hostName      optional display name
   * @param segmentSettings  map of segment codes to question counts
   */
  static async createGame(
    gameId: string,
    hostCode: string,
    hostName: string | null = null,
    segmentSettings: Record<string, number> = {},
  ): Promise<GameRecord | null> {
    if (!this.isConfigured()) {
      console.warn('Supabase not configured');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('games')
        .insert({
          id: gameId,
          host_code: hostCode,
          host_name: hostName,
          phase: 'CONFIG',
          segment_settings: Object.keys(segmentSettings).length
            ? segmentSettings
            : FALLBACK_SEGMENT_SETTINGS,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating game:', error);
        return null;
      }

      return data as GameRecord;
    } catch (error) {
      console.error('Error creating game:', error);
      return null;
    }
  }

  /**
   * Fetch a game by its ID.
   * @param gameId The game ID to look up.
   */
  static async getGame(gameId: string): Promise<GameRecord | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('games')
        .select('*') // selects all columns including host_code
        .eq('id', gameId)
        .single();

      if (error) {
        console.error('Error fetching game:', error);
        return null;
      }

      return data as GameRecord;
    } catch (error) {
      console.error('Error fetching game:', error);
      return null;
    }
  }

  /**
   * Look up a game using both its ID and host code to avoid collisions.
   */
  static async getGameByHostCode(
    gameId: string,
    hostCode: string,
  ): Promise<GameRecord | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .eq('host_code', hostCode)
        .single();

      if (error) {
        console.error('Error fetching game with host code:', error);
        return null;
      }

      return data as GameRecord;
    } catch (error) {
      console.error('Error fetching game with host code:', error);
      return null;
    }
  }

  /**
   * Update a game record with the provided fields.
   */
  static async updateGame(
    gameId: string,
    updates: Partial<GameRecord>,
  ): Promise<GameRecord | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single();

      if (error) {
        console.error('Error updating game:', error);
        return null;
      }

      return data as GameRecord;
    } catch (error) {
      console.error('Error updating game:', error);
      return null;
    }
  }

  // =====================================
  // PLAYER OPERATIONS
  // =====================================

  static async addPlayer(
    playerId: string,
    gameId: string,
    playerData: {
      name: string;
      flag?: string;
      club?: string;
      role?: string;
    },
  ): Promise<PlayerRecord | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('players')
        .insert({
          id: playerId,
          game_id: gameId,
          name: playerData.name,
          flag: playerData.flag || null,
          club: playerData.club || null,
          role: playerData.role || 'playerA',
          is_connected: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding player:', error);
        return null;
      }

      return data as PlayerRecord;
    } catch (error) {
      console.error('Error adding player:', error);
      return null;
    }
  }

  static async getGamePlayers(gameId: string): Promise<PlayerRecord[]> {
    if (!this.isConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching players:', error);
        return [];
      }

      return data as PlayerRecord[];
    } catch (error) {
      console.error('Error fetching players:', error);
      return [];
    }
  }

  static async updatePlayer(
    playerId: string,
    updates: Partial<PlayerRecord>,
  ): Promise<PlayerRecord | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', playerId)
        .select()
        .single();

      if (error) {
        console.error('Error updating player:', error);
        return null;
      }

      return data as PlayerRecord;
    } catch (error) {
      console.error('Error updating player:', error);
      return null;
    }
  }
  static async insertGameEvent(
    gameId: string,
    event_type: string,
    event_data: Record<string, unknown> = {},
  ) {
    if (!this.isConfigured()) return;
    const { error } = await supabase
      .from('game_events')
      .insert([{ game_id: gameId, event_type, event_data }]);
    if (error) console.error('insertGameEvent error:', error);
  }

  static async removePlayer(playerId: string): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) {
        console.error('Error removing player:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing player:', error);
      return false;
    }
  }

  // =====================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================

  static subscribeToGame(
    gameId: string,
    callbacks: {
      onGameUpdate?: (game: GameRecord) => void;
      onPlayerJoin?: (player: PlayerRecord) => void;
      onPlayerUpdate?: (player: PlayerRecord) => void;
      onPlayerLeave?: (playerId: string) => void;
    },
  ) {
    if (!this.isConfigured()) {
      console.warn('Supabase not configured - real-time disabled');
      return null;
    }

    // Subscribe to game updates
    const gameSubscription = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log('Game update:', payload);
          if (payload.eventType === 'UPDATE' && callbacks.onGameUpdate) {
            callbacks.onGameUpdate(payload.new as GameRecord);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          console.log('Player update:', payload);
          if (payload.eventType === 'INSERT' && callbacks.onPlayerJoin) {
            callbacks.onPlayerJoin(payload.new as PlayerRecord);
          } else if (
            payload.eventType === 'UPDATE' &&
            callbacks.onPlayerUpdate
          ) {
            callbacks.onPlayerUpdate(payload.new as PlayerRecord);
          } else if (
            payload.eventType === 'DELETE' &&
            callbacks.onPlayerLeave
          ) {
            callbacks.onPlayerLeave(payload.old.id);
          }
        },
      )
      .subscribe();

    return gameSubscription;
  }

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  static async logGameEvent(
    gameId: string,
    eventType: string,
    eventData: Record<string, unknown>,
  ): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      const { error } = await supabase.from('game_events').insert({
        game_id: gameId,
        event_type: eventType,
        event_data: eventData,
      });

      if (error) {
        console.error('Error logging game event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error logging game event:', error);
      return false;
    }
  }
}
