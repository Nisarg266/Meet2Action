import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/appStore';
import type { ScheduledMeeting, ScheduledMeetingStatus } from '../types';
import {
  formatMeetingDate,
  formatMeetingTime,
  formatCountdown,
  generateIcsCalendarEvent,
} from '../utils/dateTime';
import { cancelScheduledMeetingApi } from '../services/scheduleService';
import {
  Video,
  Search,
  Plus,
  Calendar,
  Clock,
  Users,
  CheckSquare,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Radio,
  CalendarPlus,
  Copy,
  Share2,
  Bell,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

type DirectoryTab = 'upcoming' | 'live' | 'past' | 'cancelled';

const LiveCountdownBadge: React.FC<{ startIso: string; status: ScheduledMeetingStatus }> = ({
  startIso,
  status,
}) => {
  const [text, setText] = useState(() => formatCountdown(startIso, status));

  useEffect(() => {
    setText(formatCountdown(startIso, status));
    const timer = setInterval(() => {
      setText(formatCountdown(startIso, status));
    }, 4000);
    return () => clearInterval(timer);
  }, [startIso, status]);

  const isLive = status === 'live' || text === 'Live now';
  const isStarting = status === 'starting' || text === 'Starting now';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isLive
          ? 'bg-rose-100 text-rose-700 animate-pulse'
          : isStarting
          ? 'bg-amber-100 text-amber-800 animate-pulse'
          : 'bg-sky-100 text-[#006194]'
      }`}
    >
      <Clock className="w-3 h-3" />
      <span>{text}</span>
    </span>
  );
};

export const Meetings: React.FC = () => {
  const { meetings, scheduledMeetings, cancelScheduledMeeting, deleteScheduledMeeting, addToast } =
    useAppStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DirectoryTab>('upcoming');
  const [search, setSearch] = useState('');
  const [cancellingMeeting, setCancellingMeeting] = useState<ScheduledMeeting | null>(null);

  // Groupings
  const upcomingList = useMemo(() => {
    return scheduledMeetings
      .filter((m) => m.status === 'scheduled' || m.status === 'starting')
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
  }, [scheduledMeetings]);

  const liveList = useMemo(() => {
    return scheduledMeetings.filter((m) => m.status === 'live');
  }, [scheduledMeetings]);

  const pastList = useMemo(() => {
    const completedSched = scheduledMeetings.filter((m) => m.status === 'completed');
    return { meetings, completedSched };
  }, [meetings, scheduledMeetings]);

  const cancelledList = useMemo(() => {
    return scheduledMeetings.filter((m) => m.status === 'cancelled');
  }, [scheduledMeetings]);

  // Filtered lists by search
  const filteredUpcoming = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return upcomingList;
    return upcomingList.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.roomId.toLowerCase().includes(q) ||
        m.participants?.some((p) => p.toLowerCase().includes(q))
    );
  }, [upcomingList, search]);

  const filteredPast = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pastList.meetings;
    return pastList.meetings.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.participants?.some((p) => p.toLowerCase().includes(q)) ||
        m.summary?.toLowerCase().includes(q)
    );
  }, [pastList, search]);

  const filteredCancelled = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cancelledList;
    return cancelledList.filter((m) => m.title.toLowerCase().includes(q) || m.roomId.toLowerCase().includes(q));
  }, [cancelledList, search]);

  const handleCopyLink = (url: string) => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      addToast('Meeting link copied to clipboard!', 'success');
    }
  };

  const handleShare = (m: ScheduledMeeting) => {
    if (navigator.share) {
      void navigator.share({
        title: m.title,
        text: `Join our MeetFlow AI meeting: "${m.title}" on ${formatMeetingDate(m.scheduledStart, m.timezone)}.`,
        url: m.meetingUrl,
      });
    } else {
      handleCopyLink(m.meetingUrl);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingMeeting) return;
    cancelScheduledMeeting(cancellingMeeting.id);
    await cancelScheduledMeetingApi(cancellingMeeting.id);
    setCancellingMeeting(null);
    addToast('Scheduled meeting cancelled.', 'info');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
            <Video className="w-3.5 h-3.5 text-sky-600" />
            Meeting Directory &amp; Sessions
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            All Meetings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage upcoming scheduled sessions, join live rooms, and review AI-synthesized past deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/schedule')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
          <button
            onClick={() => navigate('/live-meeting')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            <span>Instant Live Meeting</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'bg-[#006194] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Upcoming</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'upcoming' ? 'bg-sky-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {upcomingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'live'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Live Now</span>
            {liveList.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-800 text-white animate-pulse">
                {liveList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'past'
                ? 'bg-[#006194] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Past / Analyzed</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'past' ? 'bg-sky-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {meetings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'cancelled'
                ? 'bg-[#006194] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
            <span>Cancelled</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'cancelled' ? 'bg-sky-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {cancelledList.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter meetings..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
      </div>

      {/* 1. UPCOMING TAB */}
      {activeTab === 'upcoming' && (
        <div>
          {filteredUpcoming.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-[#006194]">
                <CalendarPlus className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">No Upcoming Meetings</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Schedule your team syncs, roadmap reviews, or architecture discussions in advance.
                </p>
              </div>
              <button
                onClick={() => navigate('/schedule')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Schedule a Meeting</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUpcoming.map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <LiveCountdownBadge startIso={m.scheduledStart} status={m.status} />
                      <span className="text-[11px] font-mono font-medium text-slate-500">
                        {m.reminderMinutes > 0 ? `Reminder: ${m.reminderMinutes}m before` : 'Reminder at start'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-display line-clamp-1">{m.title}</h3>

                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="font-medium text-slate-800">
                          {formatMeetingDate(m.scheduledStart, m.timezone)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>
                          {formatMeetingTime(m.scheduledStart, m.timezone)} ({m.durationMinutes} mins)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{m.participants?.length || 1} participants</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyLink(m.meetingUrl)}
                        className="p-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                        title="Copy Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => generateIcsCalendarEvent(m)}
                        className="p-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                        title="Add to Calendar (.ics)"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleShare(m)}
                        className="p-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                        title="Share Invite"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => navigate(`/schedule?edit=${m.id}`)}
                        className="p-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                        title="Edit Meeting"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setCancellingMeeting(m)}
                        className="p-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                        title="Cancel Meeting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => navigate(`/live-meeting/${m.roomId}?title=${encodeURIComponent(m.title)}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Join Meeting</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. LIVE TAB */}
      {activeTab === 'live' && (
        <div>
          {liveList.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
                <Radio className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">No Active Live Meetings</h3>
                <p className="text-xs text-slate-500 mt-1">
                  When a host enters a meeting room, it will appear here as live.
                </p>
              </div>
              <button
                onClick={() => navigate('/live-meeting')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Radio className="w-4 h-4" />
                <span>Start Instant Meeting</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {liveList.map((m) => (
                <div
                  key={m.id}
                  className="bg-white border-2 border-rose-500/80 rounded-2xl p-5 shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 animate-pulse">
                      <Radio className="w-3.5 h-3.5" /> Live Now
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-display">{m.title}</h3>
                    <p className="text-xs text-slate-600">Room: {m.roomId}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => navigate(`/live-meeting/${m.roomId}?title=${encodeURIComponent(m.title)}`)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Join Live Session</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. PAST / ANALYZED TAB */}
      {activeTab === 'past' && (
        <div>
          {filteredPast.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-[#006194]">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display">No Completed Meetings Yet</h3>
              <p className="text-xs text-slate-500">
                End a LiveKit meeting to automatically generate Gemini analysis, action items, and transcripts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPast.map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  onClick={() => navigate(`/meetings/${m.id}`)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-slate-500">{m.platform || 'LiveKit'}</span>
                      </div>
                      <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Analyzed
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-display group-hover:text-sky-700 transition-colors">
                      {m.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {m.date}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {m.durationFormatted || `${m.duration} mins`}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {m.participants.length} attendees
                      </span>
                    </div>

                    {m.summary && (
                      <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 line-clamp-2 leading-relaxed">
                        {m.summary}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
                        {m.actionItems.length} tasks
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {m.decisions.length} decisions
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-sky-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Summary &rarr;
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. CANCELLED TAB */}
      {activeTab === 'cancelled' && (
        <div>
          {filteredCancelled.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display">No Cancelled Meetings</h3>
              <p className="text-xs text-slate-500">Any meetings you cancel will be archived here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCancelled.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 opacity-80 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Cancelled
                    </span>
                    <h4 className="text-base font-bold text-slate-700 line-clamp-1">{m.title}</h4>
                    <p className="text-xs text-slate-500">
                      Originally scheduled for {formatMeetingDate(m.scheduledStart, m.timezone)}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/schedule?edit=${m.id}`)}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => deleteScheduledMeeting(m.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 font-display">Cancel Scheduled Meeting?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel <span className="font-semibold text-slate-900">{cancellingMeeting.title}</span>?
              All future pre-meeting reminders for this session will be halted.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCancellingMeeting(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Keep Meeting
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
