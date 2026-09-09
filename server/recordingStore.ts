import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * MeetFlow AI — Recording metadata store.
 *
 * Tracks server-side recording (Egress) metadata so any device can query
 * recording lifecycle state via /api/livekit/recording/:id and /api/recordings.
 *
 * The MP4 files themselves NEVER touch this server's filesystem — they are
 * uploaded by LiveKit Egress directly to S3-compatible object storage
 * (Cloudflare R2 / AWS S3). This store keeps metadata only.
 *
 * Persistence: best-effort JSON file next to this module. Render's filesystem
 * is ephemeral, so after a server restart the in-memory map may be empty —
 * `reconcileFromEgress` in egressService can re-adopt active egresses, and
 * clients re-attach metadata from their own persistence (localStorage).
 */

export type RecordingStatus = 'starting' | 'recording' | 'processing' | 'ready' | 'failed';

export interface RecordingRecord {
  /** MeetFlow recording id (rec-xxxxxxxx). */
  id: string;
  meetingId: string;
  meetingTitle?: string;
  roomName: string;
  egressId: string;
  status: RecordingStatus;
  /** LiveKit participant identity that started the recording (the host). */
  startedBy: string;
  startedAt: string; // ISO
  endedAt?: string; // ISO
  duration?: number; // seconds
  fileSize?: number; // bytes
  /** Browser-playable https URL (public bucket / public base URL). */
  fileUrl?: string;
  /** Raw storage location reported by Egress (e.g. s3://bucket/key). */
  storageLocation?: string;
  storageProvider: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.resolve(__dirname, '.recordings.json');

const recordings = new Map<string, RecordingRecord>();
let loaded = false;

function loadFromDisk(): void {
  if (loaded) return;
  loaded = true;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')) as RecordingRecord[];
      for (const rec of raw) recordings.set(rec.id, rec);
      console.log(`[MeetFlow Recording] Loaded ${recordings.size} recording record(s) from disk`);
    }
  } catch (err) {
    console.warn('[MeetFlow Recording] Could not load recording store:', err instanceof Error ? err.message : err);
  }
}

function persistToDisk(): void {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(Array.from(recordings.values()), null, 2));
  } catch {
    // Ephemeral filesystem (Render) — metadata loss on restart is acceptable.
  }
}

export function randomRecordingId(): string {
  return `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function upsertRecording(record: RecordingRecord): RecordingRecord {
  loadFromDisk();
  recordings.set(record.id, record);
  persistToDisk();
  return record;
}

export function getRecording(id: string): RecordingRecord | undefined {
  loadFromDisk();
  return recordings.get(id);
}

export function getRecordingByEgressId(egressId: string): RecordingRecord | undefined {
  loadFromDisk();
  for (const rec of recordings.values()) {
    if (rec.egressId === egressId) return rec;
  }
  return undefined;
}

export function getRecordingsForRoom(roomName: string): RecordingRecord[] {
  loadFromDisk();
  return Array.from(recordings.values())
    .filter((r) => r.roomName === roomName)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getActiveRecordingForRoom(roomName: string): RecordingRecord | undefined {
  loadFromDisk();
  for (const rec of recordings.values()) {
    if (rec.roomName === roomName && (rec.status === 'starting' || rec.status === 'recording')) {
      return rec;
    }
  }
  return undefined;
}

export function listRecordings(): RecordingRecord[] {
  loadFromDisk();
  return Array.from(recordings.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Public-safe view of a recording — never includes storage credentials. */
export function toPublicRecording(record: RecordingRecord) {
  return {
    id: record.id,
    meetingId: record.meetingId,
    meetingTitle: record.meetingTitle,
    roomName: record.roomName,
    egressId: record.egressId,
    status: record.status,
    startedAt: record.startedAt,
    endedAt: record.endedAt,
    duration: record.duration,
    fileSize: record.fileSize,
    fileUrl: record.fileUrl,
    thumbnailUrl: undefined as string | undefined,
    storageProvider: record.storageProvider,
    storage: record.storageProvider ? 'Cloud' : undefined,
    error: record.error,
  };
}
