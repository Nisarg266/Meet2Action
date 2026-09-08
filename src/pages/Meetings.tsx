import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/appStore';
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
  ExternalLink,
  Disc,
  Radio
} from 'lucide-react';

export const Meetings: React.FC = () => {
  const { meetings } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const navigate = useNavigate();

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      !search.trim() ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.participants.some((p) => p.toLowerCase().includes(search.toLowerCase())) ||
      m.summary.toLowerCase().includes(search.toLowerCase());

    const matchesPlatform = filterPlatform === 'all' || m.platform === filterPlatform;

    return matchesSearch && matchesPlatform;
  });

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
            Session Archive
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Meeting Directory &amp; Recordings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access recordings, full transcripts, extracted deliverables, and decision logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/live-meeting')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            <span>Start Live Meeting</span>
          </button>
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze New Meeting</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings by title, participant, or summary..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium"
          >
            <option value="all">All Platforms</option>
            <option value="Google Meet">Google Meet</option>
            <option value="Zoom">Zoom</option>
            <option value="MS Teams">MS Teams</option>
            <option value="LiveKit">MeetFlow Live</option>
          </select>
        </div>
      </div>

      {/* Meeting Cards List with Staggered Scroll Animations */}
      {filteredMeetings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-[#006194]">
            <Video className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              {search.trim() || filterPlatform !== 'all' ? 'No matching meetings found' : 'Your meetings will appear here'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search.trim() || filterPlatform !== 'all'
                ? 'Try adjusting your search keywords or platform filters.'
                : 'Host a real LiveKit video meeting or analyze a meeting transcript to generate intelligence.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/live-meeting')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Radio className="w-3.5 h-3.5" />
              Start Live Meeting
            </button>
            <button
              onClick={() => navigate('/analyze')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Analyze Transcript
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeetings.map((m, idx) => (
            <motion.div
              key={m.id}
              id={`meeting-card-${m.id}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              onClick={() => navigate(`/meetings/${m.id}`)}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-sky-300/80 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-500">
                      {m.platform || 'Google Meet'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Analyzed
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display group-hover:text-sky-700 transition-colors">
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

              {/* Footer metrics */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
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
                  View Studio &rarr;
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>

  );
};
