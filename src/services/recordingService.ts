/**
 * Frontend recording API — talks ONLY to MeetFlow server endpoints.
 *
 * The browser never sees LiveKit API keys or S3 credentials: Egress is fully
 * server-controlled (server/egressService.ts) and this client only exchanges
 * recording ids / statuses / public playback URLs.
 */

import type { MeetingRecording } from '../types';

export interface StartRecordingResponse {
  ok: boolean;
  recordingId: string;
  egressId: string;
  status: MeetingRecording['status'];
  startedAt?: string;
  reused?: boolean;
}

export interface RecordingApiError {
  ok: false;
  error: string;
  message: string;
}

export class RecordingRequestError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = data as RecordingApiError;
    throw new RecordingRequestError(err.error || 'recording_error', err.message || `Recording request failed (${response.status}).`);
  }
  return data as T;
}

/** Ask the server to start LiveKit Egress for a room (idempotent — no duplicate jobs). */
export async function startRoomRecording(params: {
  roomName: string;
  meetingId: string;
  meetingTitle?: string;
  requestedBy: string;
}): Promise<StartRecordingResponse> {
  return postJson<StartRecordingResponse>('/api/livekit/recording/start', params);
}

/** Ask the server to stop an Egress. Only the recording host may stop it. */
export async function stopRoomRecording(params: {
  egressId: string;
  requestedBy: string;
}): Promise<{ ok: boolean; recordingId: string; egressId: string; status: string }> {
  return postJson('/api/livekit/recording/stop', params);
}

/** Fetch recording lifecycle state (starting → recording → processing → ready/failed). */
export async function fetchRecording(recordingId: string): Promise<MeetingRecording> {
  const response = await fetch(`/api/livekit/recording/${encodeURIComponent(recordingId)}`);
  if (!response.ok) {
    throw new RecordingRequestError('recording_not_found', `Recording ${recordingId} could not be found.`);
  }
  return response.json();
}

export async function fetchRecordings(): Promise<MeetingRecording[]> {
  const response = await fetch('/api/recordings');
  if (!response.ok) return [];
  const data = await response.json().catch(() => ({ recordings: [] }));
  return Array.isArray(data.recordings) ? (data.recordings as MeetingRecording[]) : [];
}

/** Safe configuration probe — shows whether the server can record (no secrets). */
export async function probeRecordingStatus(): Promise<{
  configured: boolean;
  provider: string;
  bucket: string | null;
  hasPublicBase: boolean;
  layout: string;
}> {
  try {
    const response = await fetch('/api/livekit/recording/status');
    if (!response.ok) throw new Error('unreachable');
    return await response.json();
  } catch {
    return { configured: false, provider: 's3', bucket: null, hasPublicBase: false, layout: 'speaker' };
  }
}

export function formatRecordingDuration(totalSeconds?: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '--:--';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
}

export function formatRecordingSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const RECORDING_STATUS_LABELS: Record<MeetingRecording['status'], string> = {
  starting: 'Recording · Starting',
  recording: 'Recording · Live',
  processing: 'Recording · Processing',
  ready: 'Recording · Ready',
  failed: 'Recording · Failed',
};
