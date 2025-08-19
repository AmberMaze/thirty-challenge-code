-- Supabase database schema for Thirty Challenge Quiz App
-- This file defines the database structure for the quiz game system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better type safety
CREATE TYPE game_phase AS ENUM ('CONFIG', 'LOBBY', 'QUIZ', 'RESULTS', 'ENDED');
CREATE TYPE player_role AS ENUM ('playerA', 'playerB', 'host', 'controller');

-- Games table - stores quiz game sessions
CREATE TABLE IF NOT EXISTS public.games (
    id TEXT PRIMARY KEY, -- 6-character game code (e.g., ABC123)
    host_code TEXT NOT NULL UNIQUE, -- Full host code with suffix (e.g., ABC123-HOST)
    host_name TEXT, -- Optional display name for the host
    phase game_phase NOT NULL DEFAULT 'CONFIG',
    segment_settings JSONB NOT NULL DEFAULT '{}', -- Quiz segment configuration
    video_room_created BOOLEAN NOT NULL DEFAULT false,
    video_room_url TEXT, -- Daily.co room URL
    current_question INTEGER DEFAULT 0,
    current_segment TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Players table - stores participant information
CREATE TABLE IF NOT EXISTS public.players (
    id TEXT PRIMARY KEY, -- Unique player identifier
    game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    flag TEXT, -- Optional flag/country representation
    club TEXT, -- Optional club affiliation
    role player_role NOT NULL DEFAULT 'playerA',
    score INTEGER NOT NULL DEFAULT 0,
    is_ready BOOLEAN NOT NULL DEFAULT false,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game events table - stores quiz interactions and events
CREATE TABLE IF NOT EXISTS public.game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    player_id TEXT, -- Optional, for player-specific events
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_host_code ON public.games(host_code);
CREATE INDEX IF NOT EXISTS idx_games_phase ON public.games(phase);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON public.games(created_at);

CREATE INDEX IF NOT EXISTS idx_players_game_id ON public.players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_role ON public.players(role);
CREATE INDEX IF NOT EXISTS idx_players_updated_at ON public.players(updated_at);

CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON public.game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_type ON public.game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_created_at ON public.game_events(created_at);

-- Add foreign key constraint for player events
CREATE INDEX IF NOT EXISTS idx_game_events_player_id ON public.game_events(player_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to automatically update updated_at columns
CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON public.games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON public.players 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies for security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous access for now (can be restricted later)
CREATE POLICY "Allow all operations for games" ON public.games FOR ALL USING (true);
CREATE POLICY "Allow all operations for players" ON public.players FOR ALL USING (true);
CREATE POLICY "Allow all operations for game_events" ON public.game_events FOR ALL USING (true);

-- Additional constraints
ALTER TABLE public.games ADD CONSTRAINT check_id_format 
    CHECK (id ~ '^[A-Z0-9]{6}$');

ALTER TABLE public.games ADD CONSTRAINT check_host_code_format 
    CHECK (host_code ~ '^[A-Z0-9]{6}-(HOST|CTRL)$');

-- Cleanup function for old games (maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_games(older_than_hours INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    cutoff_time TIMESTAMPTZ;
    deleted_count INTEGER;
BEGIN
    cutoff_time := NOW() - (older_than_hours || ' hours')::INTERVAL;
    
    DELETE FROM public.games 
    WHERE created_at < cutoff_time;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment on tables and important columns
COMMENT ON TABLE public.games IS 'Quiz game sessions with video room integration';
COMMENT ON TABLE public.players IS 'Participants in quiz games';
COMMENT ON TABLE public.game_events IS 'Log of game interactions and quiz events';

COMMENT ON COLUMN public.games.id IS 'Short 6-character game code for players to join';
COMMENT ON COLUMN public.games.host_code IS 'Full host code with HOST/CTRL suffix for authentication';
COMMENT ON COLUMN public.games.segment_settings IS 'Configuration for quiz segments and question counts';
COMMENT ON COLUMN public.games.video_room_url IS 'Daily.co video room URL for real-time communication';

COMMENT ON COLUMN public.players.id IS 'Unique identifier for player across sessions';
COMMENT ON COLUMN public.players.role IS 'Player role: playerA, playerB, host, or controller';

COMMENT ON COLUMN public.game_events.event_type IS 'Type of event: join, answer, buzz, etc.';
COMMENT ON COLUMN public.game_events.event_data IS 'Event-specific data as JSON';
