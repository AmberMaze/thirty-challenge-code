import DailyIframe, {
  DailyCall,
  DailyEventObjectParticipant,
  DailyParticipant,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  DailyEventObjectAppMessage, // handy generic event type
} from '@daily-co/daily-js';
import { useEffect, useRef, useState } from 'react';

/* ---------------- factory helpers --------------- */

export const createCall = (): DailyCall =>
  DailyIframe.createCallObject({}); // no userName param—set it after join

export async function joinRoom(
  call: DailyCall,
  roomUrl: string,
  token?: string,
  userName?: string,
) {
  if (!roomUrl) throw new Error('[dailyClient] joinRoom: roomUrl missing');
  await call.join({ url: roomUrl, token });
  if (userName) call.setUserName(userName); // <- officially supported
}

export const leaveRoom = async (call: DailyCall) => {
  await call.leave();
  call.destroy();
};

/* -------------- React convenience hook ----------- */

export const useDaily = (
  roomUrl: string,
  token?: string,
  userName?: string,
) => {
  const callRef = useRef<DailyCall>(null);
  const [meetingState, setMeetingState] = useState<string>('new');
  const [participants, setParticipants] = useState<
    Record<string, DailyParticipant>
  >({});

  useEffect(() => {
    const call = createCall();
    callRef.current = call;

    /* meeting state */
    const onMeetingStateChanged = () =>
      setMeetingState(call.meetingState()); // returns string union
    call
      .on('joining-meeting', onMeetingStateChanged)
      .on('joined-meeting', onMeetingStateChanged)
      .on('left-meeting', onMeetingStateChanged)
      .on('error', onMeetingStateChanged);

    /* participants */
    const upsert = (p: DailyParticipant) =>
      setParticipants((prev) => ({ ...prev, [p.session_id]: p }));

    call
      .on('participant-joined', (e: DailyEventObjectParticipant) =>
        upsert(e.participant),
      )
      .on('participant-updated', (e: DailyEventObjectParticipant) =>
        upsert(e.participant),
      )
      .on('participant-left', (e: import('@daily-co/daily-js').DailyEventObjectParticipantLeft) =>
        setParticipants((prev) => {
          const copy = { ...prev };
          delete copy[e.participant.session_id];
          return copy;
        }),
      );

    /* join immediately */
    joinRoom(call, roomUrl, token, userName).catch(console.error);

    return () => {
      leaveRoom(call).catch(console.error);
    };
  }, [roomUrl, token, userName]);

  return { call: callRef.current, meetingState, participants };
};
