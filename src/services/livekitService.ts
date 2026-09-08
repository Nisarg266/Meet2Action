/**
 * Front-side LiveKit connection helpers.
 *
 * The browser never touches LIVEKIT_API_KEY / LIVEKIT_API_SECRET — it asks the
 * backend endpoint `/api/livekit/token` for a short-lived participant token and
 * receives only `{ serverUrl, participantToken }`.
 * If the backend is unconfigured or unreachable we degrade gracefully to Demo
 * Mode so the full Live Meeting experience still works locally.
 */

export interface LiveKitTokenResponse {
  mode: 'live' | 'demo';
  serverUrl: string;
  participantToken: string;
  room: string;
  identity?: string;
  reason?: string;
}

const ADJECTIVES = ['swift', 'bright', 'calm', 'brave', 'nova', 'lunar', 'solar', 'atlas', 'orbit', 'zenith'];
const NOUNS = ['falcon', 'comet', 'harbor', 'summit', 'cipher', 'beacon', 'prism', 'vector', 'quasar', 'delta'];

/** Generates a friendly, unique room name, e.g. `meetflow-swift-falcon-42`. */
export function generateRoomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const number = Math.floor(Math.random() * 90) + 10;
  return `meetflow-${adjective}-${noun}-${number}`;
}

/** Stable per-tab participant identity (persisted for the session). */
export function getLocalIdentity(): string {
  let identity = sessionStorage.getItem('meetflow-live-identity');
  if (!identity) {
    identity = `alex-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('meetflow-live-identity', identity);
  }
  return identity;
}

export async function fetchLiveKitToken(params: {
  room: string;
  identity: string;
  name: string;
}): Promise<LiveKitTokenResponse> {
  try {
    const response = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      return {
        mode: 'demo',
        serverUrl: '',
        participantToken: '',
        room: params.room,
        reason: `Token endpoint returned ${response.status}`,
      };
    }

    const data = (await response.json()) as Partial<LiveKitTokenResponse>;
    if (data.mode === 'live' && data.serverUrl && data.participantToken) {
      return {
        mode: 'live',
        serverUrl: data.serverUrl,
        participantToken: data.participantToken,
        room: params.room,
        identity: data.identity,
      };
    }

    return {
      mode: 'demo',
      serverUrl: '',
      participantToken: '',
      room: params.room,
      reason: data.reason || 'LiveKit is not configured on the server.',
    };
  } catch {
    return {
      mode: 'demo',
      serverUrl: '',
      participantToken: '',
      room: params.room,
      reason: 'Token endpoint unreachable — running in Demo Mode.',
    };
  }
}

/** Cheap availability probe used by the lobby to show LiveKit vs Demo status. */
export async function probeLiveKitStatus(): Promise<'live' | 'demo'> {
  try {
    const response = await fetch('/api/livekit/status');
    if (!response.ok) return 'demo';
    const data = (await response.json()) as { mode?: 'live' | 'demo' };
    return data.mode === 'live' ? 'live' : 'demo';
  } catch {
    return 'demo';
  }
}
