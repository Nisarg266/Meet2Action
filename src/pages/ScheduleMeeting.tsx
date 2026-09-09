import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppStore } from '../store/appStore';
import type { ScheduledMeeting } from '../types';
import {
  getLocalTimezone,
  formatMeetingDate,
  formatMeetingTime,
  generateIcsCalendarEvent,
} from '../utils/dateTime';
import { createScheduledMeeting, updateScheduledMeetingApi } from '../services/scheduleService';
import {
  Calendar,
  Clock,
  Video,
  Sparkles,
  Users,
  Link as LinkIcon,
  Plus,
  X,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Share2,
  CalendarPlus,
  Globe,
  Bell,
  Radio,
} from 'lucide-react';

const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST · GMT+5:30)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT · GMT-5)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT · GMT-8)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT · GMT-6)' },
  { value: 'Europe/London', label: 'Europe/London (BST/GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CEST · GMT+1)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST · GMT+4)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT · GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST · GMT+9)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST · GMT+10)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

const REMINDER_OPTIONS = [
  { value: 0, label: 'At time of meeting' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before (Default)' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 mins' },
  { value: 30, label: '30 mins' },
  { value: 45, label: '45 mins' },
  { value: 60, label: '60 mins (1 hour)' },
  { value: 90, label: '90 mins (1.5 hours)' },
  { value: 120, label: '120 mins (2 hours)' },
];

function generateUniqueRoomId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `meetflow-${rand}`;
}

function getDefaultDateTime(): { defaultDate: string; defaultTime: string } {
  const now = new Date();
  // Round forward to next 15-minute chunk + 15 mins
  const ms = 1000 * 60 * 15;
  const rounded = new Date(Math.ceil((now.getTime() + 15 * 60 * 1000) / ms) * ms);

  const defaultDate = rounded.toISOString().split('T')[0];
  const hours = rounded.getHours().toString().padStart(2, '0');
  const minutes = rounded.getMinutes().toString().padStart(2, '0');
  const defaultTime = `${hours}:${minutes}`;

  return { defaultDate, defaultTime };
}

export const ScheduleMeeting: React.FC = () => {
  const { scheduledMeetings, addScheduledMeeting, updateScheduledMeeting, addToast } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const { defaultDate, defaultTime } = useMemo(getDefaultDateTime, []);

  const [title, setTitle] = useState('Product Roadmap & Sprint Sync');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [duration, setDuration] = useState(30);
  const [timezone, setTimezone] = useState(getLocalTimezone());
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [invitees, setInvitees] = useState<string[]>([
    'Alex Mercer',
    'Rahul Patel',
    'Sophia Chen',
  ]);
  const [inviteInput, setInviteInput] = useState('');
  const [description, setDescription] = useState(
    'Real-time LiveKit meeting with autonomous MeetFlow AI transcription, task extraction, and decision tracking.'
  );

  const [existingRoomId, setExistingRoomId] = useState<string | null>(null);
  const [savedMeeting, setSavedMeeting] = useState<ScheduledMeeting | null>(null);
  const [allowConflictOverride, setAllowConflictOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load meeting if in edit mode
  useEffect(() => {
    if (!editId) return;
    const existing = scheduledMeetings.find((m) => m.id === editId);
    if (existing) {
      setTitle(existing.title);
      setDuration(existing.durationMinutes);
      setTimezone(existing.timezone || getLocalTimezone());
      setReminderMinutes(existing.reminderMinutes ?? 10);
      setInvitees(existing.participants || []);
      setDescription(existing.description || '');
      setExistingRoomId(existing.roomId);

      try {
        const start = new Date(existing.scheduledStart);
        setDate(start.toISOString().split('T')[0]);
        const h = start.getHours().toString().padStart(2, '0');
        const m = start.getMinutes().toString().padStart(2, '0');
        setTime(`${h}:${m}`);
      } catch {}
    }
  }, [editId, scheduledMeetings]);

  const handleAddInvitee = () => {
    const val = inviteInput.trim();
    if (val && !invitees.includes(val)) {
      setInvitees([...invitees, val]);
      setInviteInput('');
    }
  };

  const handleRemoveInvitee = (name: string) => {
    setInvitees(invitees.filter((i) => i !== name));
  };

  const handleAutoTitle = (suggestion: string) => {
    setTitle(suggestion);
    addToast('Updated meeting title', 'info');
  };

  // Convert chosen date & time into ISO 8601 UTC string
  const scheduledStartIso = useMemo(() => {
    if (!date || !time) return '';
    try {
      // Parse with user's local date/time input
      const localDate = new Date(`${date}T${time}:00`);
      return localDate.toISOString();
    } catch {
      return '';
    }
  }, [date, time]);

  const scheduledEndIso = useMemo(() => {
    if (!scheduledStartIso) return '';
    try {
      const start = new Date(scheduledStartIso);
      const end = new Date(start.getTime() + duration * 60 * 1000);
      return end.toISOString();
    } catch {
      return '';
    }
  }, [scheduledStartIso, duration]);

  // Conflict Detection: check if any other scheduled meeting overlaps
  const conflictingMeeting = useMemo(() => {
    if (!scheduledStartIso || !scheduledEndIso) return null;
    const startMs = new Date(scheduledStartIso).getTime();
    const endMs = new Date(scheduledEndIso).getTime();

    return scheduledMeetings.find((other) => {
      if (other.id === editId) return false;
      if (other.status === 'cancelled' || other.status === 'completed') return false;

      const otherStart = new Date(other.scheduledStart).getTime();
      const otherEnd = new Date(other.scheduledEnd).getTime();

      // Overlap condition: start < otherEnd && end > otherStart
      return startMs < otherEnd && endMs > otherStart;
    });
  }, [scheduledStartIso, scheduledEndIso, scheduledMeetings, editId]);

  // Validation
  const isPastTime = useMemo(() => {
    if (!scheduledStartIso) return false;
    return new Date(scheduledStartIso).getTime() < Date.now() - 60000;
  }, [scheduledStartIso]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Please enter a meeting title', 'warning');
      return;
    }
    if (isPastTime) {
      addToast('Please choose a future date and time', 'warning');
      return;
    }
    if (conflictingMeeting && !allowConflictOverride) {
      addToast('Conflict detected with an existing meeting. Review schedule or click "Schedule Anyway".', 'warning');
      return;
    }

    setIsSubmitting(true);
    const roomId = existingRoomId || generateUniqueRoomId();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://meet2action.onrender.com';
    const meetingUrl = `${origin}/live-meeting/${roomId}`;

    const hostName =
      (typeof window !== 'undefined' ? localStorage.getItem('meetflow_user_name') : null) || 'Alex Mercer';

    const meetingRecord: ScheduledMeeting = {
      id: editId || `sched-${Date.now().toString(36)}`,
      title: title.trim(),
      roomId,
      meetingUrl,
      scheduledStart: scheduledStartIso,
      scheduledEnd: scheduledEndIso,
      durationMinutes: duration,
      timezone,
      hostId: 'host-local',
      hostName,
      participants: invitees,
      status: 'scheduled',
      reminderMinutes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description,
    };

    if (editId) {
      updateScheduledMeeting(editId, meetingRecord);
      await updateScheduledMeetingApi(editId, meetingRecord);
      addToast('Meeting schedule updated', 'success');
    } else {
      addScheduledMeeting(meetingRecord);
      await createScheduledMeeting(meetingRecord);
      addToast('Meeting scheduled successfully!', 'success');
    }

    setIsSubmitting(false);
    setSavedMeeting(meetingRecord);
  };

  const copyMeetingLink = (url: string) => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      addToast('Meeting invite link copied to clipboard!', 'success');
    }
  };

  const shareMeeting = (meeting: ScheduledMeeting) => {
    if (navigator.share) {
      void navigator.share({
        title: meeting.title,
        text: `Join our MeetFlow AI meeting: "${meeting.title}" on ${formatMeetingDate(meeting.scheduledStart, meeting.timezone)} at ${formatMeetingTime(meeting.scheduledStart, meeting.timezone)}.`,
        url: meeting.meetingUrl,
      });
    } else {
      copyMeetingLink(meeting.meetingUrl);
    }
  };

  // SUCCESS STATE CARD
  if (savedMeeting) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
              Meeting Provisioned &amp; Scheduled
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display mt-3">
              {savedMeeting.title}
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              A dedicated LiveKit video room has been provisioned. MeetFlow AI autonomous scribe is set to listen and extract action items.
            </p>
          </div>

          {/* Key Schedule Information Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 max-w-lg mx-auto text-left space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <Calendar className="w-4 h-4 text-sky-600" /> Date:
              </span>
              <span className="font-semibold text-slate-900">
                {formatMeetingDate(savedMeeting.scheduledStart, savedMeeting.timezone)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <Clock className="w-4 h-4 text-sky-600" /> Time:
              </span>
              <span className="font-semibold text-slate-900">
                {formatMeetingTime(savedMeeting.scheduledStart, savedMeeting.timezone)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <Globe className="w-4 h-4 text-sky-600" /> Timezone:
              </span>
              <span className="font-semibold text-slate-900">{savedMeeting.timezone}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <Bell className="w-4 h-4 text-amber-500" /> Reminder:
              </span>
              <span className="font-semibold text-slate-900">
                {savedMeeting.reminderMinutes > 0 ? `${savedMeeting.reminderMinutes} min before` : 'At start time'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-700 pt-2 border-t border-slate-200">
              <span className="font-medium text-slate-500">Room ID:</span>
              <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                {savedMeeting.roomId}
              </span>
            </div>
          </div>

          {/* Shareable Link Input */}
          <div className="max-w-lg mx-auto">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 text-left">
              Shareable Meeting URL
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-1.5">
              <input
                readOnly
                value={savedMeeting.meetingUrl}
                className="flex-1 bg-transparent px-2.5 text-xs text-slate-800 font-mono focus:outline-hidden"
              />
              <button
                onClick={() => copyMeetingLink(savedMeeting.meetingUrl)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(`/live-meeting/${savedMeeting.roomId}?title=${encodeURIComponent(savedMeeting.title)}`)}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>Join Meeting Lobby Now</span>
            </button>

            <button
              onClick={() => generateIcsCalendarEvent(savedMeeting)}
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <CalendarPlus className="w-4 h-4 text-slate-500" />
              <span>Add to Calendar (.ics)</span>
            </button>

            <button
              onClick={() => shareMeeting(savedMeeting)}
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>Share Invite</span>
            </button>

            <button
              onClick={() => navigate('/meetings')}
              className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <span>View All Meetings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          {editId ? 'Edit Scheduled Session' : 'Meeting Provisioning'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
          {editId ? 'Reschedule Meeting' : 'Schedule a Future Meeting'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure meeting start time, duration, timezone, and participants. A unique LiveKit room will be automatically created.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Configuration */}
        <div className="lg:col-span-2 space-y-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* Conflict Alert Warning */}
          {conflictingMeeting && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-amber-950">Schedule Overlap Detected</div>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  You already have another meeting scheduled during this window:{' '}
                  <span className="font-semibold">{conflictingMeeting.title}</span> (
                  {formatMeetingTime(conflictingMeeting.scheduledStart, conflictingMeeting.timezone)}).
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <label className="flex items-center gap-2 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowConflictOverride}
                      onChange={(e) => setAllowConflictOverride(e.target.checked)}
                      className="rounded border-amber-400 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Schedule anyway despite the overlap</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Past Time Warning */}
          {isPastTime && (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-rose-900 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Please choose a future date and time. Selected start time has already passed.</span>
            </div>
          )}

          {/* Meeting Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Meeting Title *
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Suggestions:</span>
                <button
                  type="button"
                  onClick={() => handleAutoTitle('Q4 Architecture & Security Review')}
                  className="text-[11px] text-sky-600 hover:text-sky-800 hover:underline cursor-pointer"
                >
                  Architecture Review
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => handleAutoTitle('Sprint Planning & Backlog Grooming')}
                  className="text-[11px] text-sky-600 hover:text-sky-800 hover:underline cursor-pointer"
                >
                  Sprint Planning
                </button>
              </div>
            </div>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Executive Governance & Product Alignment"
              className="w-full text-sm font-medium px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Date and Time Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <div className="relative">
                <input
                  required
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm font-medium px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Time *
              </label>
              <div className="relative">
                <input
                  required
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-sm font-medium px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Duration and Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full text-sm font-medium px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full text-sm font-medium px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reminder Timing */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Pre-Meeting Reminder Notification
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
              className="w-full text-sm font-medium px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              {REMINDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              You will receive an in-app reminder alert and a browser notification when this time arrives.
            </p>
          </div>

          {/* Participants Tag Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Participants &amp; Guest Names / Emails
            </label>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInvitee();
                  }
                }}
                placeholder="e.g. Priya Mehta or priya@acme.com"
                className="flex-1 text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAddInvitee}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {invitees.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInvitee(name)}
                    className="p-0.5 hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                    aria-label={`Remove ${name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Meeting Description / Agenda */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Agenda / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/meetings')}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isPastTime || (Boolean(conflictingMeeting) && !allowConflictOverride)}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>{editId ? 'Save Changes' : 'Schedule Meeting'}</span>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Live Preview Card */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Live Preview
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white space-y-3">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                LiveKit Meeting
              </span>

              <h3 className="text-base font-bold text-slate-900 tracking-tight font-display line-clamp-2">
                {title || 'Untitled Meeting'}
              </h3>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formatMeetingDate(scheduledStartIso || new Date().toISOString(), timezone)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {formatMeetingTime(scheduledStartIso || new Date().toISOString(), timezone)} ({duration} mins)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Reminder: {reminderMinutes > 0 ? `${reminderMinutes} min before` : 'At start'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{invitees.length} participant{invitees.length === 1 ? '' : 's'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI Scribe autonomously provisions on join</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
