import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export type ServerScheduledStatus = 'scheduled' | 'starting' | 'live' | 'completed' | 'cancelled';

export interface ServerScheduledMeeting {
  id: string;
  title: string;
  roomId: string;
  meetingUrl: string;
  scheduledStart: string; // ISO 8601 UTC
  scheduledEnd: string;   // ISO 8601 UTC
  durationMinutes: number;
  timezone: string;
  hostId: string;
  hostName: string;
  participants: string[];
  status: ServerScheduledStatus;
  reminderMinutes: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  remindedAt?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.resolve(__dirname, '.scheduled_meetings.json');

const meetings = new Map<string, ServerScheduledMeeting>();
let loaded = false;

function loadFromDisk(): void {
  if (loaded) return;
  loaded = true;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')) as ServerScheduledMeeting[];
      for (const m of raw) {
        meetings.set(m.id, m);
      }
      console.log(`[MeetFlow Schedule] Loaded ${meetings.size} scheduled meeting(s) from disk`);
    }
  } catch (err) {
    console.warn('[MeetFlow Schedule] Could not load schedule store:', err instanceof Error ? err.message : err);
  }
}

function persistToDisk(): void {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(Array.from(meetings.values()), null, 2));
  } catch (err) {
    console.warn('[MeetFlow Schedule] Could not persist schedule store:', err instanceof Error ? err.message : err);
  }
}

export function saveScheduledMeeting(meeting: ServerScheduledMeeting): ServerScheduledMeeting {
  loadFromDisk();
  const now = new Date().toISOString();
  const record: ServerScheduledMeeting = {
    ...meeting,
    createdAt: meeting.createdAt || now,
    updatedAt: now,
  };
  meetings.set(record.id, record);
  persistToDisk();
  return record;
}

export function getScheduledMeeting(id: string): ServerScheduledMeeting | undefined {
  loadFromDisk();
  return meetings.get(id);
}

export function findScheduledMeetingByRoom(roomName: string): ServerScheduledMeeting | undefined {
  loadFromDisk();
  const normalized = (roomName || '').toLowerCase().trim();
  for (const m of meetings.values()) {
    if (m.roomId.toLowerCase() === normalized) return m;
  }
  return undefined;
}

export function listScheduledMeetings(): ServerScheduledMeeting[] {
  loadFromDisk();
  return Array.from(meetings.values()).sort(
    (a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
  );
}

export function updateScheduledMeeting(
  id: string,
  updates: Partial<ServerScheduledMeeting>
): ServerScheduledMeeting | undefined {
  loadFromDisk();
  const existing = meetings.get(id);
  if (!existing) return undefined;

  const updated: ServerScheduledMeeting = {
    ...existing,
    ...updates,
    id: existing.id,
    roomId: updates.roomId || existing.roomId,
    updatedAt: new Date().toISOString(),
  };
  meetings.set(id, updated);
  persistToDisk();
  return updated;
}

export function cancelScheduledMeeting(id: string): ServerScheduledMeeting | undefined {
  return updateScheduledMeeting(id, { status: 'cancelled' });
}

export function deleteScheduledMeeting(id: string): boolean {
  loadFromDisk();
  const existed = meetings.delete(id);
  if (existed) persistToDisk();
  return existed;
}
