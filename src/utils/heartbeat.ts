import { GameDatabase } from '@/lib/gameDatabase';

export interface HeartbeatConfig {
  playerId: string;
  intervalMs?: number; // Default: 60000 (60s)
  onError?: (error: Error) => void;
}

export class HeartbeatManager {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private config: HeartbeatConfig;
  private isActive = false;

  constructor(config: HeartbeatConfig) {
    this.config = {
      intervalMs: 60000, // 60 seconds default
      ...config,
    };
  }

  /**
   * Start the heartbeat timer that updates last_active every ~60s
   */
  start(): void {
    if (this.isActive) {
      console.warn('Heartbeat already active for player:', this.config.playerId);
      return;
    }

    this.isActive = true;
    
    // Initial heartbeat to mark as connected
    this.beat();

    // Set up interval for regular heartbeats
    this.intervalId = window.setInterval(() => {
      this.beat();
    }, this.config.intervalMs);

    console.log(`Heartbeat started for player ${this.config.playerId} with ${this.config.intervalMs}ms interval`);
  }

  /**
   * Stop the heartbeat timer
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isActive = false;
    console.log(`Heartbeat stopped for player ${this.config.playerId}`);
  }

  /**
   * Send a single heartbeat update to the database
   */
  private async beat(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    try {
      const now = new Date().toISOString();
      const result = await GameDatabase.updatePlayerById(this.config.playerId, {
        is_connected: true,
        last_active: now,
      });

      if (!result.success) {
        // Only log error if it's not a "not found" error (player might not exist yet)
        if (result.error !== 'Player not found') {
          console.warn(`Heartbeat failed for player ${this.config.playerId}:`, result.error);
          this.config.onError?.(new Error(result.error || 'Unknown heartbeat error'));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Heartbeat error for player ${this.config.playerId}:`, errorMessage);
      this.config.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * Mark player as disconnected in the database
   */
  async markDisconnected(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const result = await GameDatabase.updatePlayerById(this.config.playerId, {
        is_connected: false,
        last_active: now,
      });

      if (!result.success && result.error !== 'Player not found') {
        console.warn(`Failed to mark player ${this.config.playerId} as disconnected:`, result.error);
      }
    } catch (error) {
      console.error(`Error marking player ${this.config.playerId} as disconnected:`, error);
    }
  }

  /**
   * Check if heartbeat is currently active
   */
  get active(): boolean {
    return this.isActive;
  }
}

/**
 * Utility function to create and manage heartbeats for multiple players
 */
export class MultiPlayerHeartbeat {
  private heartbeats = new Map<string, HeartbeatManager>();

  /**
   * Start heartbeat for a specific player
   */
  startForPlayer(playerId: string, onError?: (error: Error) => void): void {
    if (this.heartbeats.has(playerId)) {
      console.warn(`Heartbeat already exists for player ${playerId}`);
      return;
    }

    const heartbeat = new HeartbeatManager({
      playerId,
      onError,
    });

    this.heartbeats.set(playerId, heartbeat);
    heartbeat.start();
  }

  /**
   * Stop heartbeat for a specific player
   */
  stopForPlayer(playerId: string): void {
    const heartbeat = this.heartbeats.get(playerId);
    if (heartbeat) {
      heartbeat.stop();
      this.heartbeats.delete(playerId);
    }
  }

  /**
   * Mark a player as disconnected
   */
  async markPlayerDisconnected(playerId: string): Promise<void> {
    const heartbeat = this.heartbeats.get(playerId);
    if (heartbeat) {
      await heartbeat.markDisconnected();
      heartbeat.stop();
      this.heartbeats.delete(playerId);
    } else {
      // Even if no heartbeat manager exists, try to mark as disconnected
      try {
        const now = new Date().toISOString();
        await GameDatabase.updatePlayerById(playerId, {
          is_connected: false,
          last_active: now,
        });
      } catch (error) {
        console.error(`Error marking player ${playerId} as disconnected:`, error);
      }
    }
  }

  /**
   * Stop all heartbeats and mark all players as disconnected
   */
  async stopAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [, heartbeat] of this.heartbeats) {
      promises.push(heartbeat.markDisconnected());
      heartbeat.stop();
    }

    await Promise.all(promises);
    this.heartbeats.clear();
  }

  /**
   * Get list of active heartbeat player IDs
   */
  getActivePlayerIds(): string[] {
    return Array.from(this.heartbeats.keys());
  }
}