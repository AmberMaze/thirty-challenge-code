-- Database seed data for development and testing
-- This file provides sample data for the Thirty Challenge Quiz App

-- Sample games for testing
INSERT INTO public.games (id, host_code, host_name, phase, segment_settings, video_room_created) VALUES
('ABC123', 'ABC123-HOST', 'Test Host', 'LOBBY', '{"WSHA": 4, "AUCT": 4, "BELL": 10, "SING": 10, "REMO": 4}', false),
('XYZ789', 'XYZ789-HOST', 'Demo Host', 'CONFIG', '{"WSHA": 6, "AUCT": 6, "BELL": 12, "SING": 12, "REMO": 6}', false),
('DEV001', 'DEV001-HOST', 'Development', 'QUIZ', '{"WSHA": 2, "AUCT": 2, "BELL": 5, "SING": 5, "REMO": 2}', true);

-- Sample players for testing
INSERT INTO public.players (id, game_id, name, flag, club, role, score, is_ready) VALUES
('player1', 'ABC123', 'أحمد محمد', '🇸🇦', 'الهلال', 'playerA', 150, true),
('player2', 'ABC123', 'فاطمة علي', '🇦🇪', 'الأهلي', 'playerB', 120, true),
('host1', 'ABC123', 'Test Host', NULL, NULL, 'host', 0, true),

('player3', 'XYZ789', 'خالد أحمد', '🇰🇼', 'النصر', 'playerA', 80, false),
('player4', 'XYZ789', 'مريم سالم', '🇧🇭', 'الزمالك', 'playerB', 95, false),

('dev_player1', 'DEV001', 'Dev Player A', NULL, 'Test Club', 'playerA', 200, true),
('dev_player2', 'DEV001', 'Dev Player B', NULL, 'Test Club', 'playerB', 180, true),
('dev_host', 'DEV001', 'Development', NULL, NULL, 'controller', 0, true);

-- Sample game events for testing
INSERT INTO public.game_events (game_id, event_type, event_data, player_id) VALUES
('ABC123', 'game_created', '{"host_name": "Test Host", "created_at": "2024-12-01T10:00:00Z"}', 'host1'),
('ABC123', 'player_joined', '{"player_name": "أحمد محمد", "role": "playerA"}', 'player1'),
('ABC123', 'player_joined', '{"player_name": "فاطمة علي", "role": "playerB"}', 'player2'),
('ABC123', 'phase_changed', '{"from": "CONFIG", "to": "LOBBY"}', 'host1'),

('DEV001', 'game_created', '{"host_name": "Development", "created_at": "2024-12-01T09:00:00Z"}', 'dev_host'),
('DEV001', 'video_room_created', '{"room_url": "https://thirty.daily.co/DEV001"}', 'dev_host'),
('DEV001', 'player_joined', '{"player_name": "Dev Player A", "role": "playerA"}', 'dev_player1'),
('DEV001', 'player_joined', '{"player_name": "Dev Player B", "role": "playerB"}', 'dev_player2'),
('DEV001', 'quiz_started', '{"segment": "WSHA", "question_count": 2}', 'dev_host'),
('DEV001', 'player_answer', '{"question_id": 1, "answer": "correct", "time_taken": 3.5}', 'dev_player1'),
('DEV001', 'player_answer', '{"question_id": 1, "answer": "incorrect", "time_taken": 4.2}', 'dev_player2');

-- Update video room for development game
UPDATE public.games 
SET video_room_url = 'https://thirty.daily.co/DEV001'
WHERE id = 'DEV001';
