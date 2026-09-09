import type { ScheduledMeeting } from '../types';

const STORAGE_KEY = 'meetflow_scheduled_meetings';

function loadLocalScheduled(): ScheduledMeeting[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('[MeetFlow Schedule] Failed to read localStorage:', err);
  }
  return [];
}

function saveLocalScheduled(list: ScheduledMeeting[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[MeetFlow Schedule] Failed to save localStorage:', err);
  }
}

/**
 * Fetches all scheduled meetings from server API with automatic localStorage fallback.
 */
export async function fetchScheduledMeetings(): Promise<ScheduledMeeting[]> {
  try {
    const res = await fetch('/api/schedule');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.meetings)) {
        // Merge with local storage to retain offline items
        const local = loadLocalScheduled();
        const map = new Map<string, ScheduledMeeting>();
        local.forEach((m) => map.set(m.id, m));
        data.meetings.forEach((m: ScheduledMeeting) => map.set(m.id, m));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
        );
        saveLocalScheduled(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('[MeetFlow Schedule] API offline, using localStorage fallback:', err);
  }
  return loadLocalScheduled();
}

/**
 * Creates a scheduled meeting on server and saves locally.
 */
export async function createScheduledMeeting(meeting: ScheduledMeeting): Promise<ScheduledMeeting> {
  // Always update local storage first for instant responsiveness
  const local = loadLocalScheduled();
  const updated = [...local.filter((m) => m.id !== meeting.id), meeting];
  saveLocalScheduled(updated);

  try {
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meeting),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.meeting) return data.meeting;
    }
  } catch (err) {
    console.warn('[MeetFlow Schedule] Failed to sync new meeting to server:', err);
  }
  return meeting;
}

/**
 * Updates a scheduled meeting on server and saves locally.
 */
export async function updateScheduledMeetingApi(
  id: string,
  updates: Partial<ScheduledMeeting>
): Promise<ScheduledMeeting | undefined> {
  const local = loadLocalScheduled();
  const existing = local.find((m) => m.id === id);
  if (!existing) return undefined;

  const merged: ScheduledMeeting = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  const updated = local.map((m) => (m.id === id ? merged : m));
  saveLocalScheduled(updated);

  try {
    const res = await fetch(`/api/schedule/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.meeting) return data.meeting;
    }
  } catch (err) {
    console.warn('[MeetFlow Schedule] Failed to sync updated meeting to server:', err);
  }
  return merged;
}

/**
 * Cancels a scheduled meeting on server and saves locally.
 */
export async function cancelScheduledMeetingApi(id: string): Promise<boolean> {
  const local = loadLocalScheduled();
  const updated = local.map((m) =>
    m.id === id ? { ...m, status: 'cancelled' as const, updatedAt: new Date().toISOString() } : m
  );
  saveLocalScheduled(updated);

  try {
    const res = await fetch(`/api/schedule/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[MeetFlow Schedule] Failed to sync cancellation to server:', err);
    return false;
  }
}
