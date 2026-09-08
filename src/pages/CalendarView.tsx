import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  Plus,
  Users,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Bot
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  platform: 'Google Meet' | 'Zoom' | 'MS Teams';
  status: 'completed' | 'scheduled' | 'live';
  attendees: string[];
  aiNotetaker: boolean;
  meetingId?: string;
}

const EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Q4 Product Strategy & Sprint Planning',
    date: '2026-09-08',
    time: '10:00 AM - 10:45 AM',
    duration: '45 mins',
    platform: 'Google Meet',
    status: 'completed',
    attendees: ['Alex Mercer', 'Rahul Patel', 'Amit Shah', 'Priya Mehta'],
    aiNotetaker: true,
    meetingId: 'meet-q4-strategy',
  },
  {
    id: 'ev-2',
    title: 'Weekly Product Sync & Sprint Blocker Review',
    date: '2026-09-08',
    time: '02:00 PM - 02:30 PM',
    duration: '30 mins',
    platform: 'Google Meet',
    status: 'completed',
    attendees: ['Alex Mercer', 'Rahul Patel', 'Amit Shah', 'Sarah Lin'],
    aiNotetaker: true,
    meetingId: 'meet-weekly-sync',
  },
  {
    id: 'ev-3',
    title: 'Executive Pricing Council & Legal Review',
    date: '2026-09-09',
    time: '11:00 AM - 11:45 AM',
    duration: '45 mins',
    platform: 'Zoom',
    status: 'scheduled',
    attendees: ['Alex Mercer', 'Jay Patel', 'Mark Vance'],
    aiNotetaker: true,
  },
  {
    id: 'ev-4',
    title: 'Landing Page V2 Design System Handoff',
    date: '2026-09-11',
    time: '03:00 PM - 03:45 PM',
    duration: '45 mins',
    platform: 'Google Meet',
    status: 'scheduled',
    attendees: ['Rahul Patel', 'Neha Shah', 'Alex Mercer'],
    aiNotetaker: true,
  },
  {
    id: 'ev-5',
    title: 'Payment API & Stripe Webhook Architecture Review',
    date: '2026-09-12',
    time: '04:00 PM - 04:30 PM',
    duration: '30 mins',
    platform: 'Google Meet',
    status: 'scheduled',
    attendees: ['Amit Shah', 'Jay Patel', 'David K.'],
    aiNotetaker: true,
  },
  {
    id: 'ev-6',
    title: 'Version 2.0 Staging Release Smoke Test',
    date: '2026-09-14',
    time: '09:00 AM - 10:00 AM',
    duration: '60 mins',
    platform: 'Google Meet',
    status: 'scheduled',
    attendees: ['Alex Mercer', 'Amit Shah', 'Priya Mehta', 'Neha Shah'],
    aiNotetaker: true,
  },
];

export const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState('September 2026');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [selectedDate, setSelectedDate] = useState('2026-09-08');

  // Days in calendar month
  const days = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-09-${dayNum.toString().padStart(2, '0')}`;
    const dayEvents = EVENTS.filter((e) => e.date === dateStr);
    return { dayNum, dateStr, dayEvents };
  });

  const selectedDayEvents = EVENTS.filter((e) => e.date === selectedDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
            <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
            AI Scheduled Syncs
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Meeting Calendar &amp; Audio Scribe Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Two-way sync with Google Meet and Zoom. MeetFlow AI bot auto-joins scheduled sessions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/schedule')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Session</span>
          </button>
        </div>
      </div>

      {/* Calendar Controls Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 font-display min-w-[170px]">
            {currentMonth}
          </h2>
          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['month', 'week', 'agenda'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                viewMode === mode
                  ? 'bg-sky-700 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Calendar Layout: Grid + Selected Day Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Grid */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          {/* Day Headers */}
          <div className="grid grid-cols-7 text-center pb-3 border-b border-slate-100 text-xs font-mono font-semibold text-slate-400">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 pt-3">
            {/* Offset for Sep 1, 2026 (Tuesday = 2 blanks) */}
            <div className="h-20 sm:h-24 p-1 rounded-xl bg-slate-50/50" />
            <div className="h-20 sm:h-24 p-1 rounded-xl bg-slate-50/50" />

            {days.map((day) => {
              const isSelected = day.dateStr === selectedDate;
              const isToday = day.dayNum === 8;

              return (
                <div
                  key={day.dayNum}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`h-20 sm:h-24 p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-400/20'
                      : isToday
                      ? 'border-sky-300 bg-slate-50/80'
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-sky-700 text-white shadow-2xs'
                          : isSelected
                          ? 'text-sky-800'
                          : 'text-slate-700'
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    {day.dayEvents.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                    )}
                  </div>

                  {/* Preview Pills */}
                  <div className="space-y-1 overflow-hidden">
                    {day.dayEvents.slice(0, 1).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 truncate"
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {day.dayEvents.length > 1 && (
                      <span className="text-[9px] font-mono text-slate-400 block px-1">
                        +{day.dayEvents.length - 1} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Date Timeline & Event Cards */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono uppercase text-slate-400 block">Selected Date</span>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  {selectedDate === '2026-09-08' ? 'Today, Sep 8, 2026' : selectedDate}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
                {selectedDayEvents.length} Sessions
              </span>
            </div>

            {/* Event Cards List */}
            <div className="space-y-3">
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase ${
                        ev.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {ev.status}
                    </span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {ev.time}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {ev.title}
                  </h4>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Video className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.platform}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-sky-700 font-medium">
                      <Bot className="w-3 h-3 text-sky-600" /> AI Notetaker
                    </span>
                  </div>

                  {ev.meetingId && (
                    <button
                      onClick={() => navigate(`/meetings/${ev.meetingId}`)}
                      className="w-full mt-2 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                    >
                      <span>Open Intelligence Studio</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {selectedDayEvents.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No meetings scheduled for this date.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
