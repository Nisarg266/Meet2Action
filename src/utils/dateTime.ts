import type { ScheduledMeeting, ScheduledMeetingStatus } from '../types';

/**
 * Returns the user's actual local timezone (e.g. "Asia/Kolkata", "America/New_York").
 * Defaults gracefully to "Asia/Kolkata" if unavailable.
 */
export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

/**
 * Formats an ISO 8601 UTC timestamp into a human-friendly date string.
 * Examples: "Today · Sep 9, 2026", "Tomorrow · Sep 10, 2026", "Wed, Sep 16, 2026".
 */
export function formatMeetingDate(isoString: string, timeZone: string = getLocalTimezone()): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    // Compare dates in the specified timezone
    const dateFmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });

    const isToday =
      date.toLocaleDateString('en-US', { timeZone }) ===
      now.toLocaleDateString('en-US', { timeZone });

    const tomorrow = new Date(now.getTime() + 86400000);
    const isTomorrow =
      date.toLocaleDateString('en-US', { timeZone }) ===
      tomorrow.toLocaleDateString('en-US', { timeZone });

    const timeStr = date.toLocaleDateString('en-US', {
      timeZone,
      month: 'short',
      day: 'numeric',
    });

    if (isToday) return `Today · ${timeStr}`;
    if (isTomorrow) return `Tomorrow · ${timeStr}`;
    return dateFmt.format(date);
  } catch {
    return isoString;
  }
}

/**
 * Formats an ISO 8601 UTC timestamp into a localized time string with timezone.
 * Example: "4:30 PM (Asia/Kolkata)".
 */
export function formatMeetingTime(
  isoString: string,
  timeZone: string = getLocalTimezone(),
  includeTimezone: boolean = true
): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid time';

    const formattedTime = date.toLocaleTimeString('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (!includeTimezone) return formattedTime;
    return `${formattedTime} (${timeZone})`;
  } catch {
    return isoString;
  }
}

export interface TimeUntilMeeting {
  diffMs: number;
  isPast: boolean;
  totalMinutes: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Calculates remaining duration between Date.now() and scheduled start time.
 */
export function getTimeUntilMeeting(scheduledStartIso: string): TimeUntilMeeting {
  const target = new Date(scheduledStartIso).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const isPast = diffMs <= 0;
  const absDiff = Math.abs(diffMs);

  const totalSeconds = Math.floor(absDiff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  return {
    diffMs,
    isPast,
    totalMinutes,
    days,
    hours,
    minutes,
    seconds,
  };
}

/**
 * Formats a live countdown for an upcoming meeting.
 * Examples: "Starts in 28 min", "Starts in 45 sec", "Starting now", "Live now", "Ended".
 */
export function formatCountdown(
  scheduledStartIso: string,
  status: ScheduledMeetingStatus = 'scheduled'
): string {
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'completed') return 'Completed';
  if (status === 'live') return 'Live now';

  const { diffMs, isPast, days, hours, minutes, seconds } = getTimeUntilMeeting(scheduledStartIso);

  if (isPast) {
    // If started within the last 60 minutes and host hasn't ended yet
    if (Math.abs(diffMs) < 60 * 60 * 1000) {
      return status === 'starting' ? 'Starting now' : 'Scheduled start passed';
    }
    return 'Past scheduled time';
  }

  if (diffMs < 60 * 1000) {
    return `Starts in ${Math.max(1, seconds)} sec`;
  }
  if (diffMs < 60 * 60 * 1000) {
    return `Starts in ${minutes} min`;
  }
  if (diffMs < 24 * 60 * 60 * 1000) {
    return `Starts in ${hours}h ${minutes}m`;
  }
  return `Starts in ${days}d ${hours}h`;
}

/**
 * Checks if a meeting is within the starting threshold window (e.g. starts in <= 2 mins or started <= 10 mins ago).
 */
export function isMeetingStarting(scheduledStartIso: string, windowMinutes: number = 3): boolean {
  const { diffMs } = getTimeUntilMeeting(scheduledStartIso);
  const windowMs = windowMinutes * 60 * 1000;
  // Starting if within 3 minutes before start or up to 10 minutes past start
  return diffMs <= windowMs && diffMs >= -10 * 60 * 1000;
}

/**
 * Checks if a scheduled meeting is still upcoming in the future.
 */
export function isMeetingUpcoming(scheduledStartIso: string): boolean {
  const target = new Date(scheduledStartIso).getTime();
  return target > Date.now();
}

/**
 * Helper to convert a Date into an iCalendar format timestamp: YYYYMMDDTHHMMSSZ (UTC).
 */
function toIcsUtcString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Generates and triggers download of a standard RFC 5545 .ics calendar event file.
 * Compatible with Google Calendar, Apple Calendar, Microsoft Outlook, and Yahoo.
 */
export function generateIcsCalendarEvent(meeting: ScheduledMeeting): void {
  try {
    const startDate = new Date(meeting.scheduledStart);
    const endDate = new Date(meeting.scheduledEnd);
    const now = new Date();

    const dtStart = toIcsUtcString(startDate);
    const dtEnd = toIcsUtcString(endDate);
    const dtStamp = toIcsUtcString(now);

    const description = [
      `MeetFlow AI Meeting: ${meeting.title}`,
      `Join Live Video: ${meeting.meetingUrl}`,
      `Duration: ${meeting.durationMinutes} minutes`,
      `Host: ${meeting.hostName || 'Organizer'}`,
      meeting.participants && meeting.participants.length > 0
        ? `Participants: ${meeting.participants.join(', ')}`
        : '',
      '',
      'AI Note-taking, Live Transcription & Action Item Extraction provided by MeetFlow AI.',
    ]
      .filter(Boolean)
      .join('\\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MeetFlow AI//Meeting Scheduler//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${meeting.id}-${startDate.getTime()}@meetflow.ai`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${meeting.title.replace(/[,;]/g, ' ')}`,
      `DESCRIPTION:${description}`,
      `URL;VALUE=URI:${meeting.meetingUrl}`,
      `LOCATION:${meeting.meetingUrl}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${meeting.title}`,
      `TRIGGER:-PT${meeting.reminderMinutes || 10}M`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = meeting.title.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);
    link.download = `${sanitizedTitle || 'meeting'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to generate ICS file:', err);
  }
}
