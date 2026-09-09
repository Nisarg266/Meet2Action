import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import type { ScheduledMeeting } from '../types';
import { fetchScheduledMeetings } from '../services/scheduleService';

// In-memory set of fired reminder keys to strictly prevent duplicate alerts
const firedReminderKeys = new Set<string>();

export function useMeetingReminders() {
  const scheduledMeetings = useAppStore((s) => s.scheduledMeetings);
  const updateScheduledMeetingStatus = useAppStore((s) => s.updateScheduledMeetingStatus);
  const setScheduledMeetings = useAppStore((s) => s.setScheduledMeetings);

  const [activeAlert, setActiveAlert] = useState<ScheduledMeeting | null>(null);
  const [isStartingNow, setIsStartingNow] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const snoozedUntilRef = useRef<Map<string, number>>(new Map());

  // 1. Initial hydration and background sync from server
  useEffect(() => {
    let mounted = true;
    void fetchScheduledMeetings().then((meetings) => {
      if (mounted && meetings.length > 0) {
        setScheduledMeetings(meetings);
      }
    });

    const syncInterval = setInterval(() => {
      void fetchScheduledMeetings().then((meetings) => {
        if (mounted && meetings.length > 0) {
          setScheduledMeetings(meetings);
        }
      });
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(syncInterval);
    };
  }, [setScheduledMeetings]);

  // 2. Periodic Reminder and Lifecycle Checker (Runs every 10s without busy-looping)
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();

      for (const meeting of scheduledMeetings) {
        if (meeting.status === 'cancelled' || meeting.status === 'completed') {
          continue;
        }

        const startTime = new Date(meeting.scheduledStart).getTime();
        const reminderMinutes = meeting.reminderMinutes ?? 10;
        const reminderMs = reminderMinutes * 60 * 1000;
        const reminderTime = startTime - reminderMs;
        const dedupeKey = `${meeting.id}-${reminderMinutes}-${meeting.scheduledStart}`;
        const snoozedUntil = snoozedUntilRef.current.get(meeting.id) || 0;

        // Auto-transition to 'starting' if start time reached
        if (now >= startTime && meeting.status === 'scheduled') {
          updateScheduledMeetingStatus(meeting.id, 'starting');
        }

        // Start alert: when within 45 seconds of start time
        if (now >= startTime && now <= startTime + 2 * 60 * 1000) {
          const startingKey = `${meeting.id}-starting-now`;
          if (!firedReminderKeys.has(startingKey) && now > snoozedUntil) {
            firedReminderKeys.add(startingKey);
            setActiveAlert(meeting);
            setIsStartingNow(true);

            // Trigger browser notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                const notif = new Notification('MeetFlow AI', {
                  body: `"${meeting.title}" is starting now! Click to join.`,
                  icon: '/favicon.ico',
                });
                notif.onclick = () => {
                  window.focus();
                  window.location.href = meeting.meetingUrl;
                };
              } catch (e) {
                console.warn('[MeetFlow Notification] Failed to show browser notification:', e);
              }
            }
            break;
          }
        }

        // Pre-meeting reminder window
        if (now >= reminderTime && now < startTime) {
          if (!firedReminderKeys.has(dedupeKey) && now > snoozedUntil) {
            firedReminderKeys.add(dedupeKey);
            setActiveAlert(meeting);
            setIsStartingNow(false);

            // Trigger browser notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                const notif = new Notification('MeetFlow AI', {
                  body: `"${meeting.title}" starts in ${reminderMinutes} minutes. Click to join.`,
                  icon: '/favicon.ico',
                });
                notif.onclick = () => {
                  window.focus();
                  window.location.href = meeting.meetingUrl;
                };
              } catch (e) {
                console.warn('[MeetFlow Notification] Failed to show browser notification:', e);
              }
            }
            break;
          }
        }
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [scheduledMeetings, updateScheduledMeetingStatus]);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  const snoozeAlert = useCallback(() => {
    if (activeAlert) {
      // Snooze for 5 minutes
      snoozedUntilRef.current.set(activeAlert.id, Date.now() + 5 * 60 * 1000);
      setActiveAlert(null);
    }
  }, [activeAlert]);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied' as NotificationPermission;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      return perm;
    } catch {
      return 'default' as NotificationPermission;
    }
  }, []);

  return {
    activeAlert,
    isStartingNow,
    dismissAlert,
    snoozeAlert,
    notificationPermission,
    requestNotificationPermission,
  };
}
