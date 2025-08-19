-- Initial schema setup for Thirty Challenge Quiz App
-- Migration: 20241201000001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE game_phase AS ENUM ('CONFIG', 'LOBBY', 'QUIZ', 'RESULTS', 'ENDED');
CREATE TYPE player_role AS ENUM ('playerA', 'playerB', 'host', 'controller');

-- Games table
CREATE TABLE public.games (
    id TEXT PRIMARY KEY,
    host_code TEXT NOT NULL UNIQUE,
    host_name TEXT,
    phase game_phase NOT NULL DEFAULT 'CONFIG',
    segment_settings JSONB NOT NULL DEFAULT '{}',
    video_room_created BOOLEAN NOT NULL DEFAULT false,
    video_room_url TEXT,
    current_question INTEGER DEFAULT 0,
    current_segment TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Players table
CREATE TABLE public.players (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    flag TEXT,
    club TEXT,
    role player_role NOT NULL DEFAULT 'playerA',
    score INTEGER NOT NULL DEFAULT 0,
    is_ready BOOLEAN NOT NULL DEFAULT false,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game events table
CREATE TABLE public.game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    player_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_games_host_code ON public.games(host_code);
CREATE INDEX idx_games_phase ON public.games(phase);
CREATE INDEX idx_games_created_at ON public.games(created_at);

CREATE INDEX idx_players_game_id ON public.players(game_id);
CREATE INDEX idx_players_role ON public.players(role);
CREATE INDEX idx_players_updated_at ON public.players(updated_at);

CREATE INDEX idx_game_events_game_id ON public.game_events(game_id);
CREATE INDEX idx_game_events_type ON public.game_events(event_type);
CREATE INDEX idx_game_events_created_at ON public.game_events(created_at);
CREATE INDEX idx_game_events_player_id ON public.game_events(player_id);

-- Constraints
ALTER TABLE public.games ADD CONSTRAINT check_id_format 
    CHECK (id ~ '^[A-Z0-9]{6}$');

ALTER TABLE public.games ADD CONSTRAINT check_host_code_format 
    CHECK (host_code ~ '^[A-Z0-9]{6}-(HOST|CTRL)$');

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON public.games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON public.players 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;

-- Policies (permissive for now)
CREATE POLICY "Allow all operations for games" ON public.games FOR ALL USING (true);
CREATE POLICY "Allow all operations for players" ON public.players FOR ALL USING (true);
CREATE POLICY "Allow all operations for game_events" ON public.game_events FOR ALL USING (true);
