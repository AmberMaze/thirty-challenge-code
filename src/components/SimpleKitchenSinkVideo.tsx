import { useState, useCallback, useEffect } from 'react';
import {
  DailyProvider,
  useDaily,
  useParticipantIds,
  useParticipant,
  useMeetingState,
  useLocalParticipant,
  DailyVideo,
  DailyAudio,
} from '@daily-co/daily-react';
import DailyIframe, { type DailyCall } from '@daily-co/daily-js';
import { useGameState, useGameActions } from '@/hooks/useGameAtoms';
import { useTranslation } from '@/hooks/useTranslation';
import type { LobbyParticipant } from '@/state';

interface SimpleKitchenSinkVideoProps {
  gameId: string;
  myParticipant: LobbyParticipant;
  showAlertMessage: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  className?: string;
}

// Individual participant video component
function ParticipantVideo({ 
  sessionId, 
  index, 
  localParticipantId 
}: { 
  sessionId: string; 
  index: number; 
  localParticipantId?: string; 
}) {
  const participant = useParticipant(sessionId);
  const participantName = participant?.user_name || participant?.user_id || `مشارك ${index + 1}`;
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-600/50">
      <div className="aspect-[4/3] relative">
        <DailyVideo 
          sessionId={sessionId}
          type="video"
          automirror={sessionId === localParticipantId}
          className="w-full h-full object-cover"
        />
        
        {/* Participant name overlay - now shows actual name */}
        <div className="absolute bottom-1 left-1 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {participantName} {sessionId === localParticipantId ? '(أنت)' : ''}
        </div>
        
        {/* Video number indicator */}
        <div className="absolute top-1 right-1 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">
          {index + 1}
        </div>
      </div>
      
      {/* Player name below video - more compact */}
      <div className="p-2 bg-gray-800/80 text-center">
        <p className="text-white text-sm font-semibold">
          {participantName}
        </p>
        {participant?.user_id && participant.user_id !== participantName && (
          <p className="text-gray-400 text-xs mt-1">
            معرف: {participant.user_id}
          </p>
        )}
      </div>
    </div>
  );
}

// Video Content Component (inside DailyProvider)
function VideoContent({ 
  gameId,
  myParticipant, 
  showAlertMessage 
}: { 
  gameId: string;
  myParticipant: LobbyParticipant;
  showAlertMessage: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}) {
  const daily = useDaily();
  const participantIds = useParticipantIds();
  const meetingState = useMeetingState();
  const localParticipant = useLocalParticipant();
  const gameState = useGameState();
  const { generateDailyToken, createVideoRoom, checkVideoRoomExists, setHostConnected, updateVideoRoomState } = useGameActions();
  const { t } = useTranslation();
  
  const [roomUrl, setRoomUrl] = useState('');
  const [userName, setUserName] = useState(myParticipant.name);
  const [isJoining, setIsJoining] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [tokenGenerationAttempted, setTokenGenerationAttempted] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomCreationAttempted, setRoomCreationAttempted] = useState(false);
  const [lastRoomCreationAttempt, setLastRoomCreationAttempt] = useState<number>(0);

  // Auto-populate room URL when game state is loaded
  useEffect(() => {
    if (gameState.videoRoomUrl && roomUrl !== gameState.videoRoomUrl) {
      setRoomUrl(gameState.videoRoomUrl);
      showAlertMessage(t('roomUrlLoaded'), 'success');
      console.log('[VideoRoom] Loaded existing room URL from game state:', gameState.videoRoomUrl);
    }
  }, [gameState.videoRoomUrl, roomUrl, showAlertMessage, t]);

  // Reset creation flags when gameId changes
  useEffect(() => {
    setRoomCreationAttempted(false);
    setIsCreatingRoom(false);
    setTokenGenerationAttempted(false);
    setIsGeneratingToken(false);
    setLastRoomCreationAttempt(0);
    console.log('[VideoRoom] GameId changed, resetting room creation flags for:', gameId);
  }, [gameId]);

  // Auto-check for existing room and create if needed for host/controller
  useEffect(() => {
    console.log('[VideoRoom] Checking room creation conditions:', {
      participantType: myParticipant.type,
      gameStateGameId: gameState.gameId,
      currentGameId: gameId,
      hasVideoRoomUrl: !!gameState.videoRoomUrl,
      videoRoomCreated: gameState.videoRoomCreated,
      roomCreationAttempted,
      isCreatingRoom
    });

    // Only proceed if:
    // 1. We're a host or controller
    // 2. Game state is loaded (gameId matches our gameId)
    // 3. No room URL exists in game state
    // 4. We haven't attempted creation yet
    // 5. We're not currently creating a room
    // 6. We haven't attempted creation in the last 10 seconds (increased throttle)
    const now = Date.now();
    if (
      (myParticipant.type === 'host' || myParticipant.type === 'controller') &&
      gameState.gameId === gameId && // Ensure game state is loaded for this gameId
      !gameState.videoRoomUrl &&
      !roomCreationAttempted &&
      !isCreatingRoom &&
      (now - lastRoomCreationAttempt > 10000) // 10 second throttle (increased)
    ) {
      console.log('[VideoRoom] All conditions met - checking for existing room or creating new one for gameId:', gameId);
      
      // Update throttle timestamp immediately to prevent concurrent attempts
      setLastRoomCreationAttempt(now);
      setRoomCreationAttempted(true); // Set this immediately
      
      // Add a longer delay to ensure all state updates are processed
      const timeoutId = setTimeout(() => {
        const checkAndCreateRoom = async () => {
          // Capture the current functions to avoid stale closures
          const currentCheckVideoRoomExists = checkVideoRoomExists;
          const currentCreateVideoRoom = createVideoRoom;
          const currentShowAlertMessage = showAlertMessage;
          const currentUpdateVideoRoomState = updateVideoRoomState;
          
          setIsCreatingRoom(true);
          
          try {
            // First, check if a room already exists with the gameId (session ID like P21AU2)
            currentShowAlertMessage('Checking for existing video room...', 'info');
            console.log('[VideoRoom] Checking for existing room with name:', gameId);
            
            const checkResult = await currentCheckVideoRoomExists(gameId);
            
            if (checkResult.success && checkResult.exists && checkResult.url) {
              // Room exists, use it and update database
              setRoomUrl(checkResult.url);
              currentShowAlertMessage('Found existing video room!', 'success');
              console.log('[VideoRoom] Found existing room:', checkResult.url);
              
              // Update the database with the existing room URL if it's not already stored
              if (!gameState.videoRoomUrl) {
                console.log('[VideoRoom] Updating database with existing room URL');
                try {
                  if (currentUpdateVideoRoomState) {
                    const updateResult = await currentUpdateVideoRoomState(checkResult.url, true);
                    if (updateResult.success) {
                      console.log('[VideoRoom] Database and state updated with existing room URL');
                    } else {
                      console.error('[VideoRoom] Failed to update database:', updateResult.error);
                      currentShowAlertMessage('Warning: Room found but failed to save to database', 'warning');
                    }
                  } else {
                    console.warn('[VideoRoom] updateVideoRoomState function not available');
                  }
                } catch (updateError) {
                  console.error('[VideoRoom] Failed to update database with existing room URL:', updateError);
                  currentShowAlertMessage('Warning: Room found but failed to save to database', 'warning');
                }
              }
              
              return;
            }
            
            // Handle case where room exists but URL is missing (error state)
            if (checkResult.success && checkResult.exists && !checkResult.url) {
              const errorMsg = 'Room exists but URL is missing - this indicates an API issue';
              console.error('[VideoRoom]', errorMsg);
              currentShowAlertMessage(errorMsg, 'error');
              return;
            }
            
            // Room doesn't exist, create a new one
            console.log('[VideoRoom] No existing room found, creating new room with session ID:', gameId);
            currentShowAlertMessage('Creating video room...', 'info');
            const result = await currentCreateVideoRoom(gameId);
            
            if (result.success && result.roomUrl) {
              setRoomUrl(result.roomUrl);
              currentShowAlertMessage('Video room created successfully!', 'success');
              console.log('[VideoRoom] Room created successfully:', result.roomUrl);
              
              // Room creation also handles database update through useGameActions
            } else {
              currentShowAlertMessage(`Failed to create video room: ${result.error || 'Unknown error'}`, 'error');
              console.error('[VideoRoom] Room creation failed:', result);
            }
          } catch (error) {
            console.error('[VideoRoom] Failed to check/create video room:', error);
            currentShowAlertMessage('Error checking/creating video room', 'error');
          } finally {
            setIsCreatingRoom(false);
          }
        };
        
        checkAndCreateRoom();
      }, 2000); // 2 second delay to ensure state is stable (increased)
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    gameState.gameId,
    gameState.videoRoomUrl, 
    gameState.videoRoomCreated,
    myParticipant.type, 
    gameId, 
    roomCreationAttempted, 
    isCreatingRoom,
    lastRoomCreationAttempt,
    checkVideoRoomExists,
    createVideoRoom,
    showAlertMessage,
    updateVideoRoomState
  ]);

  // Auto-generate token when room URL is available
  useEffect(() => {
    if (gameState.videoRoomUrl && !preAuthToken && !isGeneratingToken && !tokenGenerationAttempted) {
      // Capture the current functions to avoid stale closures
      const currentGenerateDailyToken = generateDailyToken;
      const currentShowAlertMessage = showAlertMessage;
      const currentT = t;
      
      setIsGeneratingToken(true);
      setTokenGenerationAttempted(true);
      
      // Use the gameId as the room name for token generation (this should match the room name used in creation)
      // Use the participant's actual name or fallback to a proper name based on type
      const actualUserName = myParticipant.name || 
        (myParticipant.type === 'host' ? (gameState.hostName || 'Host') : 
         myParticipant.type === 'controller' ? (gameState.hostName || 'Controller') : 
         `Player ${myParticipant.id}`);
      
      console.log('[VideoRoom] Generating token for:', { 
        room: gameId, 
        user: actualUserName, 
        isHost: myParticipant.type.startsWith('host') || myParticipant.type === 'controller',
        participantType: myParticipant.type 
      });
      
      currentGenerateDailyToken(
        gameId, // Room name should match the room name used when creating the room
        actualUserName,
        myParticipant.type.startsWith('host') || myParticipant.type === 'controller',
        false // Not observer mode
      )
        .then((token) => {
          if (token) {
            setPreAuthToken(token);
            currentShowAlertMessage(currentT('tokenGenerated'), 'success');
            console.log('[VideoRoom] Token generated successfully for user:', actualUserName);
          } else {
            currentShowAlertMessage(currentT('failedGenerateToken'), 'warning');
            console.error('[VideoRoom] Token generation returned null');
          }
        })
        .catch((error) => {
          console.error('Failed to generate token:', error);
          currentShowAlertMessage(currentT('failedGenerateToken'), 'warning');
        })
        .finally(() => {
          setIsGeneratingToken(false);
        });
    }
  }, [gameState.videoRoomUrl, gameState.hostName, preAuthToken, isGeneratingToken, tokenGenerationAttempted, gameId, myParticipant.name, myParticipant.type, myParticipant.id, generateDailyToken, showAlertMessage, t]);

  // Track host connection status based on meeting state
  useEffect(() => {
    if (myParticipant.type === 'host' || myParticipant.type === 'controller') {
      // Capture the current function to avoid stale closures
      const currentSetHostConnected = setHostConnected;
      
      const isConnectedToCall = meetingState === 'joined-meeting';
      console.log('[VideoRoom] Host/Controller meeting state changed:', { 
        meetingState, 
        isConnectedToCall,
        participantType: myParticipant.type 
      });
      
      // Debounce connection status updates to prevent flapping
      const updateTimeout = setTimeout(() => {
        // Update host connection status in database
        currentSetHostConnected(isConnectedToCall).then((result) => {
          if (result.success) {
            console.log(`[VideoRoom] Host connection status updated to: ${isConnectedToCall}`);
          } else {
            console.error('[VideoRoom] Failed to update host connection status:', result.error);
          }
        }).catch((error) => {
          console.error('[VideoRoom] Error updating host connection status:', error);
        });
      }, 1000); // 1 second debounce
      
      return () => clearTimeout(updateTimeout);
    }
  }, [meetingState, myParticipant.type, setHostConnected]);

  // Join call function
  const joinCall = useCallback(async () => {
    if (!daily || !roomUrl.trim() || isJoining) return;

    // Capture current functions to avoid stale closures
    const currentShowAlertMessage = showAlertMessage;
    const currentT = t;

    setIsJoining(true);
    try {
      currentShowAlertMessage(currentT('joiningCallMsg'), 'info');
      
      // Use the same username logic as token generation
      const actualUserName = myParticipant.name || 
        (myParticipant.type === 'host' ? (gameState.hostName || 'Host') : 
         myParticipant.type === 'controller' ? (gameState.hostName || 'Controller') : 
         `Player ${myParticipant.id}`);
      
      // Prepare join options
      const joinOptions: {
        url: string;
        userName: string;
        token?: string;
      } = {
        url: roomUrl.trim(),
        userName: actualUserName,
      };

      // Add token if provided
      if (preAuthToken.trim()) {
        joinOptions.token = preAuthToken.trim();
      }

      console.log('[VideoRoom] Joining call with options:', { 
        url: joinOptions.url, 
        userName: joinOptions.userName, 
        hasToken: !!joinOptions.token 
      });

      // Join the call
      await daily.join(joinOptions);
      
      currentShowAlertMessage(currentT('joinedCallSuccessfully'), 'success');
      console.log('[VideoRoom] Successfully joined call as:', actualUserName);
    } catch (error) {
      console.error('Failed to join call:', error);
      currentShowAlertMessage(`${currentT('failedJoinCall')}: ${error instanceof Error ? error.message : currentT('unknownError')}`, 'error');
    } finally {
      setIsJoining(false);
    }
  }, [daily, roomUrl, userName, myParticipant.name, myParticipant.type, myParticipant.id, gameState.hostName, preAuthToken, isJoining, showAlertMessage, t]);

  // Leave call function
  const leaveCall = useCallback(async () => {
    if (!daily) return;

    // Capture current functions to avoid stale closures
    const currentShowAlertMessage = showAlertMessage;
    const currentT = t;

    try {
      await daily.leave();
      currentShowAlertMessage(currentT('leftCall'), 'info');
    } catch (error) {
      console.error('Failed to leave call:', error);
      currentShowAlertMessage(currentT('failedLeaveCall'), 'error');
    }
  }, [daily, showAlertMessage, t]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!daily) return;
    try {
      const isVideoOn = daily.localVideo();
      await daily.setLocalVideo(!isVideoOn);
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  }, [daily]);

  // Debug function to check/create room with session ID
  const debugCheckCreateRoom = useCallback(async () => {
    if (!gameId) {
      showAlertMessage('No session ID available', 'error');
      return;
    }

    try {
      showAlertMessage('Debug: Checking for room with session ID...', 'info');
      console.log('[Debug] Checking for room with session ID:', gameId);
      
      const checkResult = await checkVideoRoomExists(gameId);
      
      if (checkResult.success && checkResult.exists && checkResult.url) {
        // Room exists, prefill and auto-join
        setRoomUrl(checkResult.url);
        showAlertMessage('Debug: Found existing room, auto-joining...', 'success');
        console.log('[Debug] Found existing room, auto-joining:', checkResult.url);
        
        // Update database state
        try {
          await updateVideoRoomState(checkResult.url, true);
        } catch (updateError) {
          console.warn('[Debug] Failed to update database state:', updateError);
        }
        
        // Auto-join
        setTimeout(() => {
          joinCall();
        }, 1000);
        
      } else if (checkResult.success && !checkResult.exists) {
        // Room doesn't exist, create it
        showAlertMessage('Debug: No room found, creating new room...', 'info');
        console.log('[Debug] No room found, creating new room with session ID:', gameId);
        
        const createResult = await createVideoRoom(gameId);
        
        if (createResult.success && createResult.roomUrl) {
          setRoomUrl(createResult.roomUrl);
          showAlertMessage('Debug: Room created! Click Join to enter.', 'success');
          console.log('[Debug] Room created successfully:', createResult.roomUrl);
        } else {
          showAlertMessage(`Debug: Failed to create room: ${createResult.error}`, 'error');
          console.error('[Debug] Room creation failed:', createResult);
        }
        
      } else {
        // Error occurred
        showAlertMessage(`Debug: Error checking room: ${checkResult.error}`, 'error');
        console.error('[Debug] Error checking room:', checkResult);
      }
      
    } catch (error) {
      console.error('[Debug] Failed to check/create room:', error);
      showAlertMessage('Debug: Error occurred while checking/creating room', 'error');
    }
  }, [gameId, checkVideoRoomExists, createVideoRoom, updateVideoRoomState, showAlertMessage, joinCall]);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!daily) return;
    try {
      const isAudioOn = daily.localAudio();
      await daily.setLocalAudio(!isAudioOn);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }, [daily]);

  const isInCall = meetingState === 'joined-meeting';
  const canJoin = !isInCall && roomUrl.trim() && !isJoining;

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30 space-y-4">
      <h3 className="text-lg font-bold text-white text-center">
        {t('dailyVideoSystem')}
      </h3>

      {/* Control Panel - Compact Layout */}
      <div className="bg-gray-700/50 rounded-lg p-3 space-y-3">
        <h4 className="text-base font-semibold text-white">{t('connectionSettings')}</h4>
        
        {/* Side by side layout for larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Room URL and Name */}
          <div className="space-y-3">
            <div>
              <label className="block text-white text-sm mb-1">
                {t('roomUrl')} {gameState.videoRoomUrl ? t('roomUrlAutoLoaded') : '*'}
              </label>
              <input
                type="url"
                value={roomUrl}
                onChange={(e) => setRoomUrl(e.target.value)}
                placeholder="https://yourdomain.daily.co/room-name"
                disabled={isInCall}
                className="w-full px-2 py-1 text-sm bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-400 focus:outline-none disabled:opacity-50"
              />
              {gameState.videoRoomUrl && roomUrl === gameState.videoRoomUrl && (
                <p className="text-green-400 text-xs mt-1">
                  {t('roomUrlFromSession')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm mb-1">
                {t('userName')} {t('userNameFromSession')}
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={isInCall}
                className="w-full px-2 py-1 text-sm bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-400 focus:outline-none disabled:opacity-50"
              />
              <p className="text-green-400 text-xs mt-1">
                {t('userNameLoaded')}
              </p>
            </div>
          </div>

          {/* Token and Controls */}
          <div className="space-y-3">
            <div>
              <label className="block text-white text-sm mb-1">
                {t('preAuthToken')} {preAuthToken ? t('preAuthTokenAutoGenerated') : isGeneratingToken ? t('preAuthTokenGenerating') : t('preAuthTokenOptional')}
              </label>
              <input
                type="text"
                value={preAuthToken}
                onChange={(e) => setPreAuthToken(e.target.value)}
                placeholder={isGeneratingToken ? t('generatingToken') : "Meeting token (optional)"}
                disabled={isInCall || isGeneratingToken}
                className="w-full px-2 py-1 text-sm bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-400 focus:outline-none disabled:opacity-50"
              />
              {preAuthToken && (
                <p className="text-green-400 text-xs mt-1">
                  {t('tokenGenerated')}
                </p>
              )}
              {isGeneratingToken && (
                <p className="text-blue-400 text-xs mt-1">
                  {t('tokenGenerating')}
                </p>
              )}
            </div>

            {/* Call Controls */}
            <div className="flex gap-2 flex-wrap">
              {!isInCall ? (
                <button
                  onClick={joinCall}
                  disabled={!canJoin}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                >
                  {isJoining ? t('joiningCall') : t('joinCall')}
                </button>
              ) : (
                <>
                  <button
                    onClick={leaveCall}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    {t('leaveCall')}
                  </button>
                  <button
                    onClick={toggleCamera}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    {t('camera')}
                  </button>
                  <button
                    onClick={toggleMicrophone}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                  >
                    {t('microphone')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Meeting Status - Compact */}
      <div className="bg-blue-500/20 rounded-lg p-2 border border-blue-500/30 text-center">
        <div className="text-blue-300 text-sm">
          {t('meetingState')}: <span className="font-mono text-accent2">{meetingState}</span>
        </div>
        <div className="text-blue-200 text-xs mt-1">
          {t('participants')}: {participantIds.length}
        </div>
      </div>

      {/* Video Grid - Mobile-optimized, compact layout */}
      <div className="bg-gray-900/50 rounded-lg p-3 min-h-[300px]">
        <h4 className="text-white text-sm text-center mb-3">
          {t('videosTitle')}
        </h4>
        
        {isInCall && participantIds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {participantIds.slice(0, 3).map((id, index) => (
              <ParticipantVideo
                key={id}
                sessionId={id}
                index={index}
                localParticipantId={localParticipant?.session_id}
              />
            ))}
            
            {/* Fill remaining slots with placeholders */}
            {Array.from({ length: Math.max(0, 3 - participantIds.length) }).map((_, index) => (
              <div key={`placeholder-${index}`} className="bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-600">
                <div className="aspect-[4/3] flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-2xl mb-1">👤</div>
                    <div className="text-xs">{t('waitingForParticipant')} {participantIds.length + index + 1}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isInCall ? (
          <div className="text-center text-gray-400 py-10">
            <div className="text-2xl mb-2">⏳</div>
            <div className="text-sm">{t('connectedWaiting')}</div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-10">
            <div className="text-2xl mb-2">📹</div>
            <div className="text-sm">{t('enterRoomAndJoin')}</div>
          </div>
        )}
      </div>

      {/* Debug Section */}
      <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-600/30">
        <h4 className="text-yellow-400 text-sm font-semibold mb-2">🔧 Debug Tools</h4>
        <div className="space-y-2">
          <div className="text-yellow-300 text-xs">
            Session ID: <span className="font-mono">{gameId}</span>
          </div>
          <button
            onClick={debugCheckCreateRoom}
            disabled={!gameId}
            className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
          >
            Check/Create Room with Session ID
          </button>
          <div className="text-yellow-300 text-xs">
            This button will check for a room with the current session ID. If found, it will auto-join. If not found, it will create a room and let you join manually.
          </div>
        </div>
      </div>

      {/* Audio component for call audio */}
      {isInCall && <DailyAudio />}
    </div>
  );
}

// Main component
export default function SimpleKitchenSinkVideo({ 
  gameId,
  myParticipant, 
  showAlertMessage, 
  className = '' 
}: SimpleKitchenSinkVideoProps) {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const gameState = useGameState();
  const { t } = useTranslation();

  // Create call object only when we have a video room URL and gameId
  useEffect(() => {
    let isMounted = true;
    
    const createCallObject = async () => {
      // Only create call object if we have both gameId and room URL available
      if (!gameId || !gameState.videoRoomUrl) {
        return;
      }
      
      try {
        console.log('[VideoRoom] Creating Daily call object for room:', gameState.videoRoomUrl);
        const newCallObject = DailyIframe.createCallObject({
          iframeStyle: {
            position: 'relative',
            width: '100%',
            height: '100%',
            border: 'none',
          },
        });
        
        if (isMounted) {
          setCallObject(newCallObject);
          console.log('[VideoRoom] Daily call object created successfully');
        } else {
          // Component was unmounted, cleanup
          newCallObject.destroy();
        }
      } catch (error) {
        console.error('[VideoRoom] Failed to create Daily call object:', error);
        if (isMounted && showAlertMessage && t) {
          showAlertMessage(t('failedInitVideoComponents'), 'error');
        }
      }
    };

    // Only create if we don't have one yet and conditions are met
    if (!callObject && gameId && gameState.videoRoomUrl) {
      createCallObject();
    }

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [gameId, gameState.videoRoomUrl, callObject, showAlertMessage, t]);

  // Separate cleanup effect that only runs on unmount
  useEffect(() => {
    return () => {
      if (callObject) {
        try {
          console.log('[VideoRoom] Cleaning up Daily call object...');
          callObject.destroy();
        } catch (error) {
          console.warn('[VideoRoom] Error during call object cleanup:', error);
        }
      }
    };
  }, [callObject]);

  if (!callObject) {
    return (
      <div className={`bg-gray-500/20 border border-gray-500/30 rounded-xl p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-400 text-base font-bold mb-2">
            {t('loadingVideoComponents')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <DailyProvider callObject={callObject}>
        <VideoContent 
          gameId={gameId}
          myParticipant={myParticipant}
          showAlertMessage={showAlertMessage}
        />
      </DailyProvider>
    </div>
  );
}