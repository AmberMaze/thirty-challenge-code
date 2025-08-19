-- Add cleanup and maintenance functions
-- Migration: 20241201000002_add_maintenance_functions.sql

-- Cleanup function for old games
CREATE OR REPLACE FUNCTION cleanup_old_games(older_than_hours INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    cutoff_time TIMESTAMPTZ;
    deleted_count INTEGER;
BEGIN
    cutoff_time := NOW() - (older_than_hours || ' hours')::INTERVAL;
    
    DELETE FROM public.games 
    WHERE created_at < cutoff_time 
      AND phase IN ('ENDED', 'CONFIG');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get game statistics
CREATE OR REPLACE FUNCTION get_game_stats()
RETURNS TABLE(
    total_games BIGINT,
    active_games BIGINT,
    total_players BIGINT,
    games_last_24h BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.games) as total_games,
        (SELECT COUNT(*) FROM public.games WHERE phase NOT IN ('ENDED')) as active_games,
        (SELECT COUNT(*) FROM public.players) as total_players,
        (SELECT COUNT(*) FROM public.games WHERE created_at > NOW() - INTERVAL '24 hours') as games_last_24h;
END;
$$ LANGUAGE plpgsql;

-- Function to validate game state consistency
CREATE OR REPLACE FUNCTION validate_game_consistency(game_id_param TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    issues TEXT[]
) AS $$
DECLARE
    game_exists BOOLEAN;
    player_count INTEGER;
    issues_array TEXT[] := '{}';
BEGIN
    -- Check if game exists
    SELECT EXISTS(SELECT 1 FROM public.games WHERE id = game_id_param) INTO game_exists;
    
    IF NOT game_exists THEN
        issues_array := array_append(issues_array, 'Game does not exist');
        RETURN QUERY SELECT false, issues_array;
        RETURN;
    END IF;
    
    -- Check player count
    SELECT COUNT(*) FROM public.players WHERE game_id = game_id_param INTO player_count;
    
    -- Validate player roles
    IF (SELECT COUNT(DISTINCT role) FROM public.players WHERE game_id = game_id_param AND role IN ('playerA', 'playerB')) < 2 
       AND (SELECT phase FROM public.games WHERE id = game_id_param) IN ('QUIZ', 'RESULTS') THEN
        issues_array := array_append(issues_array, 'Missing required player roles for quiz phase');
    END IF;
    
    -- Check for orphaned players
    IF player_count = 0 AND (SELECT phase FROM public.games WHERE id = game_id_param) != 'CONFIG' THEN
        issues_array := array_append(issues_array, 'Game has no players but is not in CONFIG phase');
    END IF;
    
    RETURN QUERY SELECT (array_length(issues_array, 1) IS NULL), issues_array;
END;
$$ LANGUAGE plpgsql;
