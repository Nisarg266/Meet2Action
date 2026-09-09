import {
  EgressClient,
  EgressStatus,
  EncodedFileOutput,
  EncodedFileType,
  EncodingOptionsPreset,
  FileOutput,
  Output,
  RoomServiceClient,
  S3Upload,
  StartEgressRequest,
  StorageConfig,
  TemplateSource,
  type EgressInfo,
} from 'livekit-server-sdk';
import { resolveLiveKitEnv, isLiveKitEnvConfigured, type LiveKitEnv } from './tokenServer.js';
import {
  getActiveRecordingForRoom,
  getRecording,
  getRecordingByEgressId,
  randomRecordingId,
  upsertRecording,
  type RecordingRecord,
  type RecordingStatus,
} from './recordingStore.js';

/**
 * MeetFlow AI — LiveKit Egress recording service (server-side room recording).
 *
 * Architecture:
 *   LiveKit Room → LiveKit Egress (RoomComposite / TemplateSource, "speaker"
 *   layout) → MP4 (H.264) → S3-compatible object storage (R2 / S3) → MeetFlow
 *   recording metadata.
 *
 * The server — never the browser — controls Egress. No browser MediaRecorder,
 * no local-participant-only capture, no duplicate microphone streams.
 *
 * Env vars (server-side only, NEVER exposed to the client):
 *   RECORDING_STORAGE_PROVIDER      "s3" (default) — S3-compatible provider
 *   RECORDING_S3_ENDPOINT           e.g. https://<account>.r2.cloudflarestorage.com
 *   RECORDING_S3_REGION             e.g. auto (R2) / us-east-1
 *   RECORDING_S3_BUCKET             bucket name
 *   RECORDING_S3_ACCESS_KEY         access key id
 *   RECORDING_S3_SECRET_KEY         secret key
 *   RECORDING_S3_FORCE_PATH_STYLE   "true"/"false" (auto for R2)
 *   RECORDING_S3_PUBLIC_URL_BASE    optional public https base for playback URLs
 *   RECORDING_LAYOUT                room composite layout (default "speaker")
 */

// ---------------------------------------------------------------------------
// Environment / configuration
// ---------------------------------------------------------------------------

export interface RecordingEnv {
  provider: string;
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  forcePathStyle: boolean;
  publicUrlBase: string;
  layout: string;
}

export function resolveRecordingEnv(source: NodeJS.ProcessEnv = process.env): RecordingEnv {
  const endpoint = (source.RECORDING_S3_ENDPOINT || '').trim();
  return {
    provider: (source.RECORDING_STORAGE_PROVIDER || 's3').trim().toLowerCase(),
    endpoint,
    region: (source.RECORDING_S3_REGION || 'auto').trim(),
    bucket: (source.RECORDING_S3_BUCKET || '').trim(),
    accessKey: (source.RECORDING_S3_ACCESS_KEY || '').trim(),
    secretKey: (source.RECORDING_S3_SECRET_KEY || '').trim(),
    forcePathStyle: source.RECORDING_S3_FORCE_PATH_STYLE
      ? source.RECORDING_S3_FORCE_PATH_STYLE.trim().toLowerCase() === 'true'
      : endpoint.includes('r2.cloudflarestorage.com'),
    publicUrlBase: (source.RECORDING_S3_PUBLIC_URL_BASE || '').trim().replace(/\/+$/, ''),
    layout: (source.RECORDING_LAYOUT || 'speaker').trim() || 'speaker',
  };
}

export function isRecordingConfigured(env: RecordingEnv): boolean {
  return Boolean(env.bucket && env.accessKey && env.secretKey && env.provider === 's3');
}

export function recordingConfigSummary(env: RecordingEnv) {
  // Never returns secrets.
  return {
    configured: isRecordingConfigured(env),
    provider: env.provider,
    bucket: env.bucket || null,
    hasPublicBase: Boolean(env.publicUrlBase),
    layout: env.layout,
  };
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

function egressHost(livekitEnv: LiveKitEnv): string {
  return livekitEnv.url.replace('wss://', 'https://').replace('ws://', 'http://');
}

let cachedEgressClient: { key: string; client: EgressClient } | null = null;

function getEgressClient(livekitEnv: LiveKitEnv): EgressClient {
  const key = `${egressHost(livekitEnv)}:${livekitEnv.apiKey}`;
  if (cachedEgressClient && cachedEgressClient.key === key) return cachedEgressClient.client;
  const client = new EgressClient(egressHost(livekitEnv), livekitEnv.apiKey, livekitEnv.apiSecret);
  cachedEgressClient = { key, client };
  return client;
}

let cachedRoomClient: { key: string; client: RoomServiceClient } | null = null;

function getRoomServiceClient(livekitEnv: LiveKitEnv): RoomServiceClient {
  const key = `${egressHost(livekitEnv)}:${livekitEnv.apiKey}`;
  if (cachedRoomClient && cachedRoomClient.key === key) return cachedRoomClient.client;
  const client = new RoomServiceClient(egressHost(livekitEnv), livekitEnv.apiKey, livekitEnv.apiSecret);
  cachedRoomClient = { key, client };
  return client;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeId(value: string, fallback: string): string {
  const clean = (value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  return clean || fallback;
}

function buildFilepath(meetingId: string, roomName: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = Math.random().toString(36).slice(2, 6);
  return `meetings/${sanitizeId(meetingId, 'meeting')}/${sanitizeId(roomName, 'room')}-${stamp}-${rand}.mp4`;
}

function buildS3Upload(env: RecordingEnv): S3Upload {
  return new S3Upload({
    accessKey: env.accessKey,
    secret: env.secretKey,
    region: env.region,
    endpoint: env.endpoint,
    bucket: env.bucket,
    forcePathStyle: env.forcePathStyle,
  });
}

/** Resolves the browser-playable https URL for an uploaded recording file. */
export function resolvePublicFileUrl(env: RecordingEnv, filepath: string): string | undefined {
  if (env.publicUrlBase) return `${env.publicUrlBase}/${filepath}`;
  if (env.endpoint && env.bucket) {
    return `${env.endpoint.replace(/\/+$/, '')}/${env.bucket}/${filepath}`;
  }
  return undefined;
}

function egressStatusToRecordingStatus(status: EgressStatus): RecordingStatus {
  switch (status) {
    case EgressStatus.EGRESS_STARTING:
      return 'starting';
    case EgressStatus.EGRESS_ACTIVE:
      return 'recording';
    case EgressStatus.EGRESS_ENDING:
      return 'processing';
    case EgressStatus.EGRESS_COMPLETE:
      return 'ready';
    default:
      // EGRESS_FAILED, EGRESS_ABORTED, EGRESS_LIMIT_REACHED
      return 'failed';
  }
}

function applyEgressInfo(record: RecordingRecord, info: EgressInfo, env: RecordingEnv): RecordingRecord {
  const next: RecordingRecord = { ...record, egressId: info.egressId || record.egressId };
  const mapped = egressStatusToRecordingStatus(info.status);

  // Terminal results (file info) only become "ready" once the file actually exists.
  const fileResult = info.fileResults?.[0];
  if (mapped === 'ready' && fileResult) {
    next.status = 'ready';
    next.fileSize = fileResult.size ? Number(fileResult.size) : record.fileSize;
    next.duration = fileResult.duration ? Math.round(Number(fileResult.duration) / 1e9) : record.duration;
    next.storageLocation = fileResult.location || record.storageLocation;
    // fileResult.filename is the request filepath (object key) — resolve a
    // playable public URL from the configured public base.
    next.fileUrl = resolvePublicFileUrl(env, fileResult.filename || buildFilepathKey(record)) || record.fileUrl;
    next.endedAt = fileResult.endedAt
      ? new Date(Number(fileResult.endedAt) * 1000).toISOString()
      : record.endedAt;
    next.error = undefined;
  } else if (mapped === 'ready') {
    // COMPLETE without file results — keep processing until file info lands.
    next.status = 'processing';
  } else {
    next.status = mapped;
    if (mapped === 'failed') {
      next.error = info.error || 'Egress failed';
    }
  }

  next.updatedAt = new Date().toISOString();
  return upsertRecording(next);
}

function buildFilepathKey(record: RecordingRecord): string {
  // Used only when EgressInfo omits the filename — reconstruct from stored fields.
  return `meetings/${sanitizeId(record.meetingId, 'meeting')}/${sanitizeId(record.roomName, 'room')}-${record.id}.mp4`;
}

// ---------------------------------------------------------------------------
// Host authorization (room-level, based on participant identity)
// ---------------------------------------------------------------------------

const roomHosts = new Map<string, string>();

/** Verifies that `identity` is currently a participant in the LiveKit room. */
async function isParticipantInRoom(livekitEnv: LiveKitEnv, roomName: string, identity: string): Promise<boolean> {
  try {
    const participants = await getRoomServiceClient(livekitEnv).listParticipants(roomName);
    return participants.some((p) => p.identity === identity);
  } catch {
    // Room service unreachable — fail closed for starting NEW recordings.
    return false;
  }
}

// ---------------------------------------------------------------------------
// Start / stop / status
// ---------------------------------------------------------------------------

export interface StartRecordingInput {
  roomName: string;
  meetingId: string;
  meetingTitle?: string;
  requestedBy: string;
}

export interface StartRecordingResult {
  ok: true;
  recording: RecordingRecord;
  /** True when an active Egress already existed and was reused (no duplicate started). */
  reused: boolean;
}

export class RecordingError extends Error {
  status: number;
  code: string;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function startRoomRecording(input: StartRecordingInput): Promise<StartRecordingResult> {
  const livekitEnv = resolveLiveKitEnv();
  if (!isLiveKitEnvConfigured(livekitEnv)) {
    throw new RecordingError('livekit_not_configured', 'LiveKit is not configured on the server.', 503);
  }

  const recEnv = resolveRecordingEnv();
  if (!isRecordingConfigured(recEnv)) {
    throw new RecordingError(
      'storage_not_configured',
      'Recording storage is not configured (RECORDING_S3_* environment variables).',
      503
    );
  }

  // 1. Room-level host check: the requester must be a live participant of the room.
  const inRoom = await isParticipantInRoom(livekitEnv, input.roomName, input.requestedBy);
  if (!inRoom) {
    throw new RecordingError(
      'not_room_participant',
      'Only a participant of this room can start the recording.',
      403
    );
  }

  // 2. Never start duplicate Egress for the same room.
  const existingLocal = getActiveRecordingForRoom(input.roomName);
  if (existingLocal) {
    return { ok: true, recording: existingLocal, reused: true };
  }

  const egressClient = getEgressClient(livekitEnv);

  // Reconcile with LiveKit in case this server restarted (Render) while an
  // Egress is still active for the room — adopt it instead of starting a new one.
  try {
    const activeEgresses = await egressClient.listEgress({ roomName: input.roomName, active: true });
    const active = activeEgresses?.[0];
    if (active) {
      const adopted: RecordingRecord = upsertRecording({
        id: randomRecordingId(),
        meetingId: sanitizeId(input.meetingId, 'meeting'),
        meetingTitle: input.meetingTitle,
        roomName: input.roomName,
        egressId: active.egressId,
        status: egressStatusToRecordingStatus(active.status),
        startedBy: input.requestedBy,
        startedAt: active.startedAt
          ? new Date(Number(active.startedAt) * 1000).toISOString()
          : new Date().toISOString(),
        storageProvider: recEnv.provider,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      roomHosts.set(input.roomName, input.requestedBy);
      return { ok: true, recording: adopted, reused: true };
    }
  } catch {
    // Non-fatal — proceed to start a fresh Egress.
  }

  // 3. Build unique output path: meetings/{meetingId}/{roomName}-{timestamp}.mp4
  const filepath = buildFilepath(input.meetingId, input.roomName);

  // 4. Start Egress — unified StartEgress API with a RoomComposite TemplateSource
  //    (speaker-focused layout: active speaker large, others in thumbnails).
  let info: EgressInfo;
  try {
    const request = new StartEgressRequest({
      roomName: input.roomName,
      source: {
        case: 'template',
        value: new TemplateSource({
          layout: recEnv.layout,
          audioOnly: false,
          videoOnly: false,
        }),
      },
      encoding: { case: 'preset', value: EncodingOptionsPreset.H264_720P_30 },
      outputs: [
        new Output({
          config: {
            case: 'file',
            value: new FileOutput({
              fileType: EncodedFileType.MP4,
              filepath,
              disableManifest: false,
            }),
          },
        }),
      ],
      storage: new StorageConfig({
        provider: { case: 's3', value: buildS3Upload(recEnv) },
      }),
    });
    info = await egressClient.startEgress(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Older LiveKit deployments may not expose the unified v2 StartEgress RPC.
    // Fall back to the (non-deprecated, options-object) RoomComposite API with
    // an S3-encoded MP4 file output — still fully server-side Egress.
    if (/route|unimplemented|malformed|not found|unavailable/i.test(message)) {
      info = await egressClient.startRoomCompositeEgress(
        input.roomName,
        {
          file: new EncodedFileOutput({
            fileType: EncodedFileType.MP4,
            filepath,
            output: { case: 's3', value: buildS3Upload(recEnv) },
          }),
        },
        { layout: recEnv.layout, encodingOptions: EncodingOptionsPreset.H264_720P_30 }
      );
    } else {
      console.error('[MeetFlow Recording] Failed to start Egress:', message);
      throw new RecordingError('egress_start_failed', `Recording could not be started: ${message}`, 502);
    }
  }

  const record: RecordingRecord = upsertRecording({
    id: randomRecordingId(),
    meetingId: sanitizeId(input.meetingId, 'meeting'),
    meetingTitle: input.meetingTitle,
    roomName: input.roomName,
    egressId: info.egressId,
    status: egressStatusToRecordingStatus(info.status),
    startedBy: input.requestedBy,
    startedAt: info.startedAt
      ? new Date(Number(info.startedAt) * 1000).toISOString()
      : new Date().toISOString(),
    storageProvider: recEnv.provider,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  roomHosts.set(input.roomName, input.requestedBy);
  console.log(
    `[MeetFlow Recording] Egress ${record.egressId} started for room "${input.roomName}" (layout: ${recEnv.layout}, output: ${filepath})`
  );

  return { ok: true, recording: record, reused: false };
}

export interface StopRecordingInput {
  egressId: string;
  requestedBy: string;
}

export async function stopRoomRecording(input: StopRecordingInput): Promise<RecordingRecord> {
  const livekitEnv = resolveLiveKitEnv();
  if (!isLiveKitEnvConfigured(livekitEnv)) {
    throw new RecordingError('livekit_not_configured', 'LiveKit is not configured on the server.', 503);
  }

  const record = getRecordingByEgressId(input.egressId);
  if (!record) {
    throw new RecordingError('recording_not_found', 'No recording found for this egress id.', 404);
  }

  // Host authorization: only the participant who started the recording (the
  // registered room host) may stop it. Guests get 403.
  const host = roomHosts.get(record.roomName) || record.startedBy;
  if (input.requestedBy !== host && input.requestedBy !== record.startedBy) {
    throw new RecordingError('not_recording_host', 'Only the meeting host can stop the recording.', 403);
  }

  if (record.status === 'ready' || record.status === 'failed') {
    return record;
  }

  const egressClient = getEgressClient(livekitEnv);
  try {
    const info = await egressClient.stopEgress(record.egressId);
    const stopped = applyEgressInfo(record, info, resolveRecordingEnv());
    // EGRESS_ENDING → "processing": MP4 still needs to finalize + upload.
    const final: RecordingRecord =
      stopped.status === 'recording' || stopped.status === 'starting'
        ? upsertRecording({
            ...stopped,
            status: 'processing',
            endedAt: stopped.endedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        : stopped;
    watchEgressCompletion(final.id);
    console.log(`[MeetFlow Recording] Egress ${record.egressId} stopping → processing`);
    return final;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[MeetFlow Recording] Failed to stop Egress:', message);
    throw new RecordingError('egress_stop_failed', `Recording could not be stopped: ${message}`, 502);
  }
}

// ---------------------------------------------------------------------------
// Completion tracking (async polling + webhook + lazy reconciliation)
// ---------------------------------------------------------------------------

const watchers = new Set<string>();

/**
 * Asynchronously polls Egress until the MP4 is fully uploaded. Never blocks an
 * HTTP response — callers fire this and forget.
 */
export function watchEgressCompletion(recordingId: string): void {
  if (watchers.has(recordingId)) return;
  watchers.add(recordingId);

  const startedAtMs = Date.now();
  const MAX_WAIT_MS = 30 * 60 * 1000; // 30 minutes
  const POLL_INTERVAL_MS = 5000;

  const tick = async () => {
    const record = getRecording(recordingId);
    if (!record || record.status === 'ready' || record.status === 'failed') {
      watchers.delete(recordingId);
      return;
    }
    if (Date.now() - startedAtMs > MAX_WAIT_MS) {
      upsertRecording({
        ...record,
        status: 'failed',
        error: 'Timed out waiting for recording processing to complete.',
        updatedAt: new Date().toISOString(),
      });
      watchers.delete(recordingId);
      return;
    }

    try {
      await refreshRecordingFromEgress(record.id);
    } catch {
      // transient API error — keep polling
    }

    const latest = getRecording(recordingId);
    if (!latest || latest.status === 'ready' || latest.status === 'failed') {
      if (latest?.status === 'ready') {
        console.log(
          `[MeetFlow Recording] Recording ${latest.id} ready — ${latest.fileSize ?? '?'} bytes, ${latest.duration ?? '?'}s, url: ${latest.fileUrl ?? 'n/a'}`
        );
      }
      watchers.delete(recordingId);
      return;
    }
    setTimeout(() => void tick(), POLL_INTERVAL_MS);
  };

  setTimeout(() => void tick(), POLL_INTERVAL_MS);
}

/** Pulls current Egress state and merges it into the stored recording record. */
export async function refreshRecordingFromEgress(recordingId: string): Promise<RecordingRecord | null> {
  const livekitEnv = resolveLiveKitEnv();
  if (!isLiveKitEnvConfigured(livekitEnv)) return null;

  const record = getRecording(recordingId);
  if (!record) return null;
  if (record.status === 'ready' || record.status === 'failed') return record;

  const egressClient = getEgressClient(livekitEnv);
  const infos = await egressClient.listEgress({ egressId: record.egressId });
  const info = infos?.[0];
  if (!info) return record;

  const updated = applyEgressInfo(record, info, resolveRecordingEnv());

  // If Egress reports COMPLETE but file info hasn't landed yet, keep watching.
  if (updated.status === 'processing') {
    watchEgressCompletion(record.id);
  }
  return updated;
}

/** Handles inbound LiveKit webhook events for egress lifecycle. */
export function handleEgressWebhookEvent(event: { event?: string; egressInfo?: EgressInfo }): void {
  const info = event.egressInfo;
  if (!info?.egressId) return;
  const record = getRecordingByEgressId(info.egressId);
  if (!record) return;

  applyEgressInfo(record, info, resolveRecordingEnv());
  if (record.status === 'processing' || record.status === 'starting' || record.status === 'recording') {
    watchEgressCompletion(record.id);
  }
  console.log(`[MeetFlow Recording] Webhook ${event.event} → recording ${record.id} is ${getRecording(record.id)?.status}`);
}

export function getRecordingHost(roomName: string): string | undefined {
  return roomHosts.get(roomName);
}
