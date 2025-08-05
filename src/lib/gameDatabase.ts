import { isSupabaseConfigured, supabase } from './supabaseClient';

// Check if we're in development mode
const isDevelopmentMode = () => import.meta.env?.DEV === true;

// In-memory storage for development mode
const developmentStorage = {
  games: new Map<string, GameRecord>(),
  players: new Map<string, PlayerRecord[]>(),
};

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
  host_is_connected: boolean; // Track host connection status
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
    return isSupabaseConfigured() || isDevelopmentMode();
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
    // Development mode: use in-memory storage
    if (isDevelopmentMode()) {
      console.log('[DEV] Creating game in memory:', { gameId, hostCode, hostName });
      
      const gameRecord: GameRecord = {
        id: gameId,
        host_code: hostCode,
        host_name: hostName,
        host_is_connected: false,
        phase: 'CONFIG',
        current_segment: null,
        current_question_index: 0,
        timer: 0,
        is_timer_running: false,
        video_room_url: null,
        video_room_created: false,
        segment_settings: Object.keys(segmentSettings).length
          ? segmentSettings
          : FALLBACK_SEGMENT_SETTINGS,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      developmentStorage.games.set(gameId, gameRecord);
      console.log('[DEV] Game created successfully in memory');
      return gameRecord;
    }

    // Production mode: use Supabase
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return null;
    }

    try {
      // Use singleton supabase client
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
    // Development mode: get from in-memory storage
    if (isDevelopmentMode()) {
      console.log('[DEV] Getting game from memory:', gameId);
      const game = developmentStorage.games.get(gameId);
      if (game) {
        console.log('[DEV] Game found in memory:', game);
        return game;
      } else {
        console.log('[DEV] Game not found in memory:', gameId);
        return null;
      }
    }

    // Production mode: use Supabase
    if (!isSupabaseConfigured()) return null;

    try {
      // Use singleton supabase client
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
      // Use singleton supabase client
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
    // Development mode: update in-memory storage
    if (isDevelopmentMode()) {
      console.log('[DEV] Updating game in memory:', { gameId, updates });
      
      const existingGame = developmentStorage.games.get(gameId);
      if (!existingGame) {
        console.warn('[DEV] Game not found in memory:', gameId);
        return null;
      }
      
      const updatedGame: GameRecord = {
        ...existingGame,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      developmentStorage.games.set(gameId, updatedGame);
      console.log('[DEV] Game updated successfully in memory');
      return updatedGame;
    }

    // Production mode: use Supabase
    if (!isSupabaseConfigured()) return null;

    try {
      // Use singleton supabase client
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
      // Use singleton supabase client
      
      // First, remove the player from any existing games to avoid primary key conflicts
      // This allows players to switch between games
      await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      // Now insert the player into the new game
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
      // Use singleton supabase client
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
      // Use singleton supabase client - ensure single row update
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', playerId)
        .select()
        .limit(1)
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

  /**
   * Update a player by ID with better error handling for single-row operations
   */
  static async updatePlayerById(
    playerId: string,
    updates: Partial<PlayerRecord>,
  ): Promise<{ success: boolean; data?: PlayerRecord; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      // First check if player exists and get current data
      const { data: existingPlayer, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .limit(1);

      if (fetchError) {
        console.error('Error fetching player before update:', fetchError);
        return { success: false, error: fetchError.message };
      }

      if (!existingPlayer || existingPlayer.length === 0) {
        console.warn(`Player ${playerId} not found for update`);
        return { success: false, error: 'Player not found' };
      }

      if (existingPlayer.length > 1) {
        console.warn(`Multiple players found with ID ${playerId}, updating first one`);
      }

      // Update the player with precise filtering
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', playerId)
        .select()
        .limit(1)
        .single();

      if (error) {
        console.error('Error updating player:', error);
        return { success: false, error: error.message };
      }

      if (isPlayerRecord(data)) {
        return { success: true, data };
      } else {
        console.error('Updated player data does not match PlayerRecord type:', data);
        return { success: false, error: 'Invalid player data returned from database' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating player by ID:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
  static async insertGameEvent(
    gameId: string,
    event_type: string,
    event_data: Record<string, unknown> = {},
  ) {
    if (!this.isConfigured()) return;
    // Use singleton supabase client
    const { error } = await supabase
      .from('game_events')
      .insert([{ game_id: gameId, event_type, event_data }]);
    if (error) console.error('insertGameEvent error:', error);
  }

  static async removePlayer(playerId: string): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      // Use singleton supabase client
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

  /**
   * Get all players for a specific game
   */
  static async getPlayers(gameId: string): Promise<PlayerRecord[]> {
    if (!this.isConfigured()) return [];

    try {
      // Use singleton supabase client
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId);

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

  // =====================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================

  static async subscribeToGame(
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
    // Use singleton supabase client
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

  /**
   * Check if a game exists and is in a specific phase
   */
  static async checkGamePhase(gameId: string): Promise<{ exists: boolean; phase?: string; game?: GameRecord }> {
    if (!this.isConfigured()) {
      return { exists: false };
    }

    try {
      const game = await this.getGame(gameId);
      if (!game) {
        return { exists: false };
      }

      return {
        exists: true,
        phase: game.phase,
        game,
      };
    } catch (error) {
      console.error('Error checking game phase:', error);
      return { exists: false };
    }
  }

  /**
   * Get game statistics for monitoring
   */
  static async getGameStats(gameId: string): Promise<{
    playerCount: number;
    connectedPlayers: number;
    totalQuestions: number;
    currentProgress: number;
    averageScore: number;
  } | null> {
    if (!this.isConfigured()) return null;

    try {
      const [game, players] = await Promise.all([
        this.getGame(gameId),
        this.getPlayers(gameId),
      ]);

      if (!game) return null;

      const totalQuestions = Object.values(game.segment_settings).reduce((sum, count) => sum + (count as number), 0);
      const connectedPlayers = players.filter(p => p.is_connected).length;
      const averageScore = players.length > 0 
        ? players.reduce((sum, p) => sum + p.score, 0) / players.length 
        : 0;

      return {
        playerCount: players.length,
        connectedPlayers,
        totalQuestions,
        currentProgress: game.current_question_index,
        averageScore,
      };
    } catch (error) {
      console.error('Error getting game stats:', error);
      return null;
    }
  }

  /**
   * Cleanup old games (for maintenance)
   */
  static async cleanupOldGames(olderThanHours: number = 24): Promise<number> {
    if (!this.isConfigured()) return 0;

    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

      // Use singleton supabase client
      const { data, error } = await supabase
        .from('games')
        .delete()
        .lt('created_at', cutoffTime.toISOString())
        .select('id');

      if (error) {
        console.error('Error cleaning up old games:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up old games:', error);
      return 0;
    }
  }

  /**
   * Reset a game to CONFIG phase (for testing/development)
   */
  static async resetGameToConfig(gameId: string): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      const updated = await this.updateGame(gameId, {
        phase: 'CONFIG',
        current_segment: null,
        current_question_index: 0,
        timer: 0,
        is_timer_running: false,
      });

      return !!updated;
    } catch (error) {
      console.error('Error resetting game to CONFIG:', error);
      return false;
    }
  }

  /**
   * Get all games with their current status (for admin/monitoring)
   */
  static async getAllGames(limit: number = 50): Promise<GameRecord[]> {
    if (!this.isConfigured()) return [];

    try {
      // Use singleton supabase client
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching all games:', error);
        return [];
      }

      return data as GameRecord[];
    } catch (error) {
      console.error('Error fetching all games:', error);
      return [];
    }
  }

  static async logGameEvent(
    gameId: string,
    eventType: string,
    eventData: Record<string, unknown>,
  ): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      // Use singleton supabase client
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
