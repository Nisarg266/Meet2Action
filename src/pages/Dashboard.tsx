import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppStore } from '../store/appStore';
import { PriorityBadge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import {
  CheckSquare,
  MessageSquare,
  Video,
  Sparkles,
  ArrowRight,
  Clock,
  AlertTriangle,
  FileDown,
  CalendarPlus,
  TrendingUp,
  ShieldCheck,
  Zap,
  Users,
  CircleDot
} from 'lucide-react';
import { exportTasksToCSV, exportTasksToMarkdown } from '../utils/exportUtils';

export const Dashboard: React.FC = () => {
  const { meetings, actionItems, decisions, addToast } = useAppStore();
  const navigate = useNavigate();

  const openActionItems = actionItems.filter((i) => i.status !== 'done');
  const highPriorityTasks = actionItems.filter((i) => i.priority === 'High' && i.status !== 'done');
  const confirmedDecisions = decisions.filter((d) => d.status === 'confirmed');
  const pendingDecisions = decisions.filter((d) => d.status === 'pending' || d.status === 'open');
  const recordedMeetings = meetings.filter((m) => m.recording);
  const needsAttentionTasks = actionItems.filter(
    (i) => i.confidence < 70 || !i.assignee || !i.isConfirmed
  );

  const avgConfidence = (
    actionItems.reduce((acc, curr) => acc + curr.confidence, 0) / (actionItems.length || 1)
  ).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Top Banner / Welcome Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            AI Operations Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            MeetFlow Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time synchronization across meeting transcripts, action items, and governance consensus.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze New Meeting</span>
          </button>
          <button
            onClick={() => navigate('/schedule')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4 text-slate-500" />
            <span>Schedule</span>
          </button>
          <button
            onClick={() => exportTasksToCSV(actionItems)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            title="Export CSV"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Row (Animated Entrance & Hover Lift) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Action Items */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          onClick={() => navigate('/action-items')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Open Action Items
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-700 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-display">
              {openActionItems.length}
            </span>
            <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              {highPriorityTasks.length} High Priority
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{actionItems.filter((i) => i.status === 'done').length} completed</span>
            <span className="text-sky-700 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
              View all &rarr;
            </span>
          </div>
        </motion.div>

        {/* Card 2: Decisions */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          onClick={() => navigate('/decisions')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Validated Consensus
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-display">
              {confirmedDecisions.length}
            </span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {pendingDecisions.length} Pending / Debates
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>100% Sign-off locked</span>
            <span className="text-sky-700 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Open matrix &rarr;
            </span>
          </div>
        </motion.div>

        {/* Card 3: Meetings Analyzed */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          onClick={() => navigate('/meetings')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Meetings Analyzed
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 group-hover:scale-110 transition-transform">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-display">
              {meetings.length}
            </span>
            <span className="text-xs font-medium text-slate-500">
              across 4 teams
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>160 mins captured</span>
            <span className="text-sky-700 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Directory &rarr;
            </span>
          </div>
        </motion.div>

      {/* Card 4: Cloud Recordings */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          onClick={() => navigate('/recordings')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Recorded Meetings
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700 group-hover:scale-110 transition-transform">
              <CircleDot className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-display">{recordedMeetings.length}</span>
            <span className="text-xs font-medium text-slate-500">
              {recordedMeetings.filter((m) => m.recording?.status === 'ready').length} ready
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Cloud MP4 via LiveKit Egress</span>
            <span className="text-sky-700 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Library &rarr;
            </span>
          </div>
        </motion.div>

        {/* Card 5: AI Extraction Accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Extraction Precision
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-display">
              {avgConfidence}%
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              High Precision
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Normalized entities</span>
            <span className="font-mono text-emerald-600 font-semibold">&plusmn;1.2% delta</span>
          </div>
        </motion.div>
      </div>

      {/* Two Column Layout: Recent Meetings & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Meetings (with Staggered scroll animation) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">
                Recent Meetings
              </h3>
              <p className="text-xs text-slate-500">
                Transcripts processed with speaker attribution and automated primitives.
              </p>
            </div>
            <button
              onClick={() => navigate('/meetings')}
              className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
            >
              View all ({meetings.length}) &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {meetings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-[#006194]">
                  <Video className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 font-display">Your meetings will appear here</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Start a Live Meeting with real audio, video, and screen sharing, or analyze a meeting transcript to extract action items.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/live-meeting')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Start Live Meeting
                  </button>
                </div>
              </div>
            ) : (
              meetings.map((meeting, index) => (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                  whileHover={{ scale: 1.008, transition: { duration: 0.15 } }}
                  onClick={() => navigate(`/meetings/${meeting.id}`)}
                  className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <h4 className="text-sm sm:text-base font-semibold text-slate-900 truncate group-hover:text-sky-700 transition-colors">
                          {meeting.title}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span>{meeting.date}</span>
                        <span>·</span>
                        <span className="font-mono">{meeting.durationFormatted || `${meeting.duration} mins`}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {meeting.participants.length} attendees
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                        {meeting.actionItems.length} tasks
                      </span>
                      <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Analyzed
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  {meeting.summary && (
                    <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 line-clamp-2 leading-relaxed">
                      {meeting.summary}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Right 1 Col: Needs Attention & Action Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              Needs Attention
            </h3>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              {needsAttentionTasks.length + pendingDecisions.length} items
            </span>
          </div>

          <div className="space-y-3">
            {needsAttentionTasks.length === 0 && pendingDecisions.length === 0 ? (
              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs text-center space-y-1.5">
                <ShieldCheck className="w-7 h-7 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-800">All clear — no items need attention</p>
                <p className="text-[11px] text-slate-400">Tasks with low confidence or pending review will show here.</p>
              </div>
            ) : (
              <>
                {/* Pending Decisions notice */}
                {pendingDecisions.slice(0, 1).map((dec) => (
                  <motion.div
                    key={dec.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => navigate('/decisions')}
                    className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50/70 transition-all cursor-pointer space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
                        Voting Sign-off Required
                      </span>
                      <span className="text-xs font-mono text-amber-700 font-semibold">48h left</span>
                    </div>
                    <h5 className="text-xs font-semibold text-slate-900 leading-snug">
                      {dec.text}
                    </h5>
                  </motion.div>
                ))}

                {/* Low confidence or unconfirmed tasks */}
                {needsAttentionTasks.slice(0, 3).map((task) => (
                  <motion.div
                    key={task.id}
                    whileHover={{ scale: 1.01 }}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-slate-900 line-clamp-1">
                        {task.task}
                      </span>
                      <PriorityBadge priority={task.priority} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={task.assignee || 'Unassigned'} size="xs" src={task.assigneeAvatar} />
                        <span>{task.assignee || 'Unassigned'}</span>
                      </div>
                      <span className="font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                        {task.confidence}% Needs Review
                      </span>
                    </div>
                  </motion.div>
                ))}

                <button
                  onClick={() => navigate('/action-items?filter=review')}
                  className="w-full text-center py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Review all pending items &rarr;
                </button>
              </>
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};
