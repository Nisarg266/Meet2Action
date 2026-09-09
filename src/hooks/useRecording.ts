import React from 'react';
import type { MeetingRecording } from '../types';
import { fetchRecording } from '../services/recordingService';

/**
 * Polls the server for a recording's lifecycle while it is in a non-terminal
 * state (starting / recording / processing). Stops once ready or failed.
 */
export function useRecordingPoll(recording: MeetingRecording | null | undefined): MeetingRecording | null {
  const [current, setCurrent] = React.useState<MeetingRecording | null>(recording ?? null);

  React.useEffect(() => {
    setCurrent(recording ?? null);
  }, [recording?.id, recording?.status, recording?.fileUrl]);

  const isLive =
    Boolean(current) && (current!.status === 'starting' || current!.status === 'recording' || current!.status === 'processing');

  React.useEffect(() => {
    if (!current || !isLive) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const fresh = await fetchRecording(current.id);
        if (cancelled) return;
        if (fresh.status !== current.status || fresh.fileUrl !== current.fileUrl) {
          setCurrent(fresh);
        }
      } catch {
        // transient — keep polling
      }
    }, 6000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [current?.id, current?.status, current?.fileUrl, isLive]);

  return current;
}

/** Parses an "hh:mm:ss(:ss)" wall-clock timestamp into a seconds offset from an ISO start time. */
export function transcriptSecondsOffset(
  message: { timestamp?: string; seconds?: number },
  startedAtIso?: string
): number | null {
  if (typeof message.seconds === 'number' && message.seconds >= 0) return message.seconds;
  if (!message.timestamp || !startedAtIso) return null;

  // Supports "HH:MM:SS" (24h) and "HH:MM:SS AM/PM" (12h, from toLocaleTimeString).
  const match = message.timestamp.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const meridiem = match[4]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  const start = new Date(startedAtIso);
  if (Number.isNaN(start.getTime())) return null;
  const startSeconds = start.getHours() * 3600 + start.getMinutes() * 60 + start.getSeconds();
  let offset = hours * 3600 + minutes * 60 + seconds - startSeconds;
  if (offset < 0) offset += 24 * 3600; // crossed midnight
  return offset;
}
