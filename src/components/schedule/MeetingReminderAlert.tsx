import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Video, Clock, X, ArrowRight } from 'lucide-react';
import type { ScheduledMeeting } from '../../types';
import { formatMeetingTime, formatCountdown } from '../../utils/dateTime';

interface MeetingReminderAlertProps {
  meeting: ScheduledMeeting | null;
  isStartingNow?: boolean;
  onDismiss: () => void;
  onSnooze?: () => void;
}

export const MeetingReminderAlert: React.FC<MeetingReminderAlertProps> = ({
  meeting,
  isStartingNow = false,
  onDismiss,
  onSnooze,
}) => {
  const navigate = useNavigate();

  if (!meeting) return null;

  const handleJoin = () => {
    onDismiss();
    navigate(`/live-meeting/${meeting.roomId}?title=${encodeURIComponent(meeting.title)}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Header Accent Bar */}
          <div
            className={`absolute top-0 inset-x-0 h-1.5 ${
              isStartingNow ? 'bg-rose-500 animate-pulse' : 'bg-[#006194]'
            }`}
          />

          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isStartingNow ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-[#006194]'
                }`}
              >
                {isStartingNow ? <Video className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
              </span>
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  {isStartingNow ? '🚨 Meeting Starting Now' : '🔔 Upcoming Meeting Reminder'}
                </span>
                <h3 className="text-base font-bold text-slate-900 tracking-tight font-display mt-0.5 line-clamp-1">
                  {meeting.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 mb-5">
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Scheduled Time:
              </span>
              <span className="font-semibold text-slate-900">
                {formatMeetingTime(meeting.scheduledStart, meeting.timezone)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="text-slate-500">Status:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                  isStartingNow
                    ? 'bg-rose-100 text-rose-700 font-bold'
                    : 'bg-sky-100 text-[#006194]'
                }`}
              >
                {isStartingNow ? 'Starting right now' : formatCountdown(meeting.scheduledStart, meeting.status)}
              </span>
            </div>

            {meeting.participants && meeting.participants.length > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-700 pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Participants:</span>
                <span className="font-medium text-slate-800 text-[11px] max-w-[200px] truncate">
                  {meeting.participants.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleJoin}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span>Join Meeting</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onSnooze && !isStartingNow && (
              <button
                onClick={onSnooze}
                className="px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                title="Remind me again in 5 minutes"
              >
                Snooze 5m
              </button>
            )}

            <button
              onClick={onDismiss}
              className="px-3.5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
