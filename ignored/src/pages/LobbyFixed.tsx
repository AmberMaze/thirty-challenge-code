import AlertBanner from '@/components/AlertBanner';
import LanguageToggle from '@/components/LanguageToggle';
import SimpleKitchenSinkVideoLazy from '@/components/SimpleKitchenSinkVideoLazy';
import {
  useGameActions,
  useGameState,
  useGameSync,
  useLobbyActions,
} from '@/hooks/useGameAtoms';
import { useTranslation } from '@/hooks/useTranslation';
import { gameSyncInstanceAtom, lobbyParticipantsAtom } from '@/state';
import { debugLog } from '@/utils/debugLog';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { LobbyParticipant } from '@/state/syncAtoms';

export default function Lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const state = useGameState();
  const { loadGameState, setHostConnected, startSession } = useGameActions();
  const { myParticipant, setParticipant } = useLobbyActions();
  const { t, language } = useTranslation();

  // Initialize game sync
  useGameSync();

  // Get sync instance for cleanup
  const gameSyncInstance = useAtomValue(gameSyncInstanceAtom);

  // Alert state
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<
    'info' | 'success' | 'warning' | 'error'
  >('info');
  const [showAlert, setShowAlert] = useState(false);

  // Refs to prevent stale closures
  const initializationRef = useRef<{
    hasInitialized: boolean;
    isInitializing: boolean;
  }>({
    hasInitialized: false,
    isInitializing: false,
  });

  // Get lobby participants to properly count connections
  const lobbyParticipants = useAtomValue(lobbyParticipantsAtom);

  const connectedPlayers = useMemo(() => {
    const gamePlayersCount = Object.values(state.players).filter(
      (p) => p.isConnected && (p.id === 'playerA' || p.id === 'playerB'),
    ).length;

    const lobbyPlayersCount = lobbyParticipants.filter(
      (p) => p.isConnected && p.type === 'player',
    ).length;

    return Math.max(gamePlayersCount, lobbyPlayersCount);
  }, [state.players, lobbyParticipants]);

  // Function to show alerts
  const showAlertMessage = useCallback(
    (
      message: string,
      type: 'info' | 'success' | 'warning' | 'error' = 'info',
    ) => {
      setAlertMessage(message);
      setAlertType(type);
      setShowAlert(true);
    },
    [],
  );

  // Memoize search params to avoid re-parsing on every render
  const searchParamsObj = useMemo(
    () => ({
      role: searchParams.get('role'),
      name: searchParams.get('name'),
      flag: searchParams.get('flag'),
      club: searchParams.get('club'),
      hostName: searchParams.get('hostName'),
    }),
    [searchParams],
  );

  // Game initialization effect - runs once when gameId changes
  useEffect(() => {
    if (
      !gameId ||
      initializationRef.current.hasInitialized ||
      initializationRef.current.isInitializing
    ) {
      return;
    }

    const initializeGame = async () => {
      if (state.gameId === gameId) {
        initializationRef.current.hasInitialized = true;
        return;
      }

      initializationRef.current.isInitializing = true;

      try {
        debugLog('Lobby', 'initializing_game', { gameId });
        const result = await loadGameState(gameId);

        if (!result.success) {
          // If no game exists and user is a host, create a new one
          const { role, hostName: urlHostName } = searchParamsObj;
          if (role === 'host') {
            try {
              await startSession(
                gameId,
                'HOST',
                urlHostName || (language === 'ar' ? 'المقدم' : 'Host'),
                { WSHA: 4, AUCT: 4, BELL: 10, SING: 10, REMO: 4 },
              );
              showAlertMessage(t('sessionCreatedSuccessfully'), 'success');
            } catch (createError) {
              console.error('Failed to create new game:', createError);
              showAlertMessage(t('failedCreateSession'), 'error');
            }
          } else {
            console.error('Failed to load game state:', result.error);
            showAlertMessage(
              `${t('failedLoadSessionData')}: ${result.error}`,
              'error',
            );
          }
        }

        initializationRef.current.hasInitialized = true;
      } catch (error) {
        console.error('Error loading game state:', error);
        showAlertMessage('خطأ في تحميل بيانات الجلسة', 'error');
      } finally {
        initializationRef.current.isInitializing = false;
      }
    };

    // Small delay to avoid race conditions
    const timeoutId = setTimeout(initializeGame, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    gameId,
    state.gameId,
    loadGameState,
    startSession,
    searchParamsObj,
    language,
    showAlertMessage,
    t,
  ]);

  // Participant setup effect - runs when URL params change
  useEffect(() => {
    const { role, name, flag, club, hostName } = searchParamsObj;

    if (!role) return;

    let participant: LobbyParticipant | null = null;

    if (role === 'controller') {
      participant = {
        id: 'controller',
        name: hostName || state.hostName || 'Controller',
        type: 'controller',
        isConnected: true,
      };
    } else if (role === 'host') {
      participant = {
        id: 'host',
        name: hostName || state.hostName || 'Host',
        type: 'host',
        isConnected: true,
      };
    } else if (role === 'playerA' || role === 'playerB') {
      participant = {
        id: role,
        name: name || 'لاعب',
        type: 'player',
        playerId: role,
        flag: flag || undefined,
        club: club || undefined,
        isConnected: true,
      };
    }

    if (participant) {
      setParticipant(participant);
    }
  }, [searchParamsObj, state.hostName, setParticipant]);

  // Host connection effect - separate from participant setup
  useEffect(() => {
    const { role } = searchParamsObj;

    if (role === 'controller' || role === 'host') {
      const timeoutId = setTimeout(() => {
        setHostConnected(true);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [searchParamsObj, setHostConnected]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (
        myParticipant &&
        (myParticipant.type === 'controller' || myParticipant.type === 'host')
      ) {
        // Debounced cleanup to prevent flapping
        setTimeout(() => {
          setHostConnected(false);
        }, 1000);
      }
    };
  }, [myParticipant, setHostConnected]);

  // Page unload cleanup effect
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (
        myParticipant &&
        myParticipant.type === 'player' &&
        myParticipant.playerId
      ) {
        // Log for debugging - actual cleanup would require serverless function
        console.log(
          'Page unloading, player will be marked disconnected by presence timeout',
        );
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        myParticipant &&
        myParticipant.type === 'player' &&
        myParticipant.playerId
      ) {
        console.log(
          'Tab hidden, heartbeat will continue but presence may timeout',
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [myParticipant]);

  // Heartbeat effect for players
  useEffect(() => {
    if (
      myParticipant &&
      myParticipant.type === 'player' &&
      myParticipant.playerId &&
      gameSyncInstance &&
      typeof gameSyncInstance.startHeartbeat === 'function'
    ) {
      console.log(`Starting heartbeat for player ${myParticipant.playerId}`);
      gameSyncInstance.startHeartbeat(myParticipant.playerId);
    }
  }, [myParticipant, gameSyncInstance]);

  // Loading state
  if (!myParticipant || !gameId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#10102a] to-blue-900 flex items-center justify-center">
        <div
          className={`text-white text-center ${language === 'ar' ? 'font-arabic' : ''}`}
        >
          <div className="w-8 h-8 border-2 border-accent2 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg mb-2">
            {language === 'ar' ? t('loadingLobby') : 'Loading lobby...'}
          </p>
          {!gameId && (
            <p className="text-sm text-white/70">
              {language === 'ar' ? t('noGameIdFound') : 'No game ID found'}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#10102a] to-blue-900 p-4">
      {/* Language Toggle */}
      <LanguageToggle />

      {/* Alert Banner */}
      <AlertBanner
        message={alertMessage}
        type={alertType}
        isVisible={showAlert}
        onClose={() => setShowAlert(false)}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className={`text-4xl font-bold text-white mb-2 ${language === 'ar' ? 'font-arabic' : ''}`}
          >
            {t('waitingLobby')}
          </h1>
          <div className="space-y-2">
            <p
              className={`text-accent2 ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              {t('lobbySessionCode')}:{' '}
              <span className="font-mono text-2xl">{gameId}</span>
            </p>
            <p
              className={`text-white/70 ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              {t('connectedPlayers')}: {connectedPlayers}/2
            </p>
          </div>
        </div>

        {/* User Info - Compact */}
        <div className="mb-6 bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span
              className={`text-white bg-blue-600/30 px-3 py-1 rounded-full ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              {t('participantType')}: {myParticipant.type}
            </span>
            <span
              className={`text-white bg-blue-600/30 px-3 py-1 rounded-full ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              {t('participantName')}: {myParticipant.name}
            </span>
            <span
              className={`text-white bg-blue-600/30 px-3 py-1 rounded-full ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              {t('participantId')}: {myParticipant.id}
            </span>
          </div>
        </div>

        {/* Simple Kitchen Sink Video - Optimized for mobile */}
        <div className="mb-6">
          {gameId && (
            <SimpleKitchenSinkVideoLazy
              gameId={gameId}
              myParticipant={myParticipant}
              showAlertMessage={showAlertMessage}
              className="w-full"
            />
          )}
        </div>

        {/* Navigation and Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4 justify-center">
          {/* Controller: Return to Control Room */}
          {myParticipant.type === 'controller' && (
            <button
              onClick={() => {
                navigate('/control-room', {
                  state: {
                    gameId: gameId,
                    hostCode: state.hostCode,
                    hostName: state.hostName || 'Controller',
                  },
                });
              }}
              className={`px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              {language === 'ar'
                ? 'العودة إلى غرفة التحكم'
                : 'Return to Control Room'}
            </button>
          )}

          {/* Host: Go to Control Room */}
          {myParticipant.type === 'host' && (
            <button
              onClick={() => {
                navigate('/control-room', {
                  state: {
                    gameId: gameId,
                    hostCode: state.hostCode,
                    hostName: state.hostName || 'Host',
                  },
                });
              }}
              className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              {language === 'ar'
                ? 'الذهاب إلى غرفة التحكم'
                : 'Go to Control Room'}
            </button>
          )}

          {/* Leave Session Button for all participants */}
          <button
            onClick={() => {
              const confirmMessage =
                language === 'ar'
                  ? 'هل أنت متأكد من مغادرة هذه الجلسة؟'
                  : 'Are you sure you want to leave this session?';
              if (window.confirm(confirmMessage)) {
                navigate('/');
              }
            }}
            className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}
          >
            {language === 'ar' ? 'مغادرة الجلسة' : 'Leave Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
