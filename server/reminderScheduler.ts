import {
  listScheduledMeetings,
  updateScheduledMeeting,
  type ServerScheduledMeeting,
} from './scheduleStore.js';

export interface ActiveServerReminder {
  id: string;
  meetingId: string;
  meetingTitle: string;
  roomId: string;
  meetingUrl: string;
  scheduledStart: string;
  reminderMinutes: number;
  firedAt: string;
  status: string;
}

// Track fired reminder keys: meetingId-reminderMinutes-scheduledStart
const firedKeys = new Set<string>();

// Keep recent fired reminders for polling clients (TTL: 15 minutes)
const activeReminders = new Map<string, ActiveServerReminder>();

let sweepInterval: NodeJS.Timeout | null = null;

function getReminderDedupeKey(meeting: ServerScheduledMeeting): string {
  return `${meeting.id}-${meeting.reminderMinutes || 10}-${meeting.scheduledStart}`;
}

/**
 * Checks all scheduled meetings and fires reminders when the reminder window is reached.
 * Also automatically marks meetings as 'starting' when start time arrives.
 */
export function checkAndTriggerReminders(): void {
  const now = Date.now();
  const meetings = listScheduledMeetings();

  for (const m of meetings) {
    if (m.status === 'cancelled' || m.status === 'completed') {
      continue;
    }

    const startTime = new Date(m.scheduledStart).getTime();
    const reminderMs = (m.reminderMinutes || 10) * 60 * 1000;
    const reminderTargetTime = startTime - reminderMs;
    const dedupeKey = getReminderDedupeKey(m);

    // 1. Auto-transition to 'starting' if scheduled start is reached and meeting is still 'scheduled'
    if (now >= startTime && m.status === 'scheduled') {
      console.log(`[MeetFlow Scheduler] Meeting "${m.title}" (${m.roomId}) reached start time -> status: starting`);
      updateScheduledMeeting(m.id, { status: 'starting' });
    }

    // 2. Pre-meeting reminder check
    if (now >= reminderTargetTime && now < startTime) {
      if (!firedKeys.has(dedupeKey)) {
        firedKeys.add(dedupeKey);
        const reminderEvent: ActiveServerReminder = {
          id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          meetingId: m.id,
          meetingTitle: m.title,
          roomId: m.roomId,
          meetingUrl: m.meetingUrl,
          scheduledStart: m.scheduledStart,
          reminderMinutes: m.reminderMinutes || 10,
          firedAt: new Date().toISOString(),
          status: m.status,
        };

        activeReminders.set(reminderEvent.id, reminderEvent);
        updateScheduledMeeting(m.id, { remindedAt: reminderEvent.firedAt });

        console.log(
          `[MeetFlow Scheduler] 🔔 Reminder triggered for "${m.title}" (${m.roomId}) — starts in ${m.reminderMinutes || 10}m`
        );

        // Expire active reminder after 15 minutes
        setTimeout(() => {
          activeReminders.delete(reminderEvent.id);
        }, 15 * 60 * 1000);
      }
    }
  }

  // Clean up very old keys (older than 24 hours) to prevent unbounded memory growth
  if (firedKeys.size > 500) {
    firedKeys.clear();
  }
}

/**
 * Initializes the reminder scheduler service. Recovers after server restarts.
 * Uses a clean 30-second sweep (no busy-looping).
 */
export function initReminderScheduler(): void {
  if (sweepInterval) return;

  console.log('[MeetFlow Scheduler] Initializing reminder scheduler service (30s interval)...');
  checkAndTriggerReminders();

  sweepInterval = setInterval(() => {
    try {
      checkAndTriggerReminders();
    } catch (err) {
      console.error('[MeetFlow Scheduler] Error during reminder sweep:', err);
    }
  }, 30000);
}

export function stopReminderScheduler(): void {
  if (sweepInterval) {
    clearInterval(sweepInterval);
    sweepInterval = null;
  }
}

export function getActiveServerReminders(): ActiveServerReminder[] {
  return Array.from(activeReminders.values());
}
