import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { LiveMeetingIntelligence } from '../components/meeting/LiveMeetingIntelligence';
import { MeetingRecordingCard } from '../components/meeting/MeetingRecordingCard';
import { ActionItemCard } from '../components/action-items/ActionItemCard';
import { DecisionCard } from '../components/decisions/DecisionCard';
import { TranscriptViewer } from '../components/transcript/TranscriptViewer';
import {
  Video,
  CheckSquare,
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Share2,
  FileDown
} from 'lucide-react';
import { exportTasksToCSV, exportTasksToMarkdown, exportDecisionsDigest } from '../utils/exportUtils';

export const MeetingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { meetings, actionItems, decisions } = useAppStore();
  const [activeTab, setActiveTab] = useState<'studio' | 'actions' | 'decisions' | 'transcript' | 'summary'>('studio');
  const [highlightedTranscriptMsgId, setHighlightedTranscriptMsgId] = useState<string | undefined>(undefined);

  const meeting = meetings.find((m) => m.id === id);

  if (!meeting) {
    return (
      <div className="p-12 max-w-lg mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-[#006194]">
          <Video className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 font-display">Meeting Not Found</h3>
        <p className="text-xs text-slate-500">
          No meeting session was found with ID "{id}". It may have been cleared or not yet saved.
        </p>
        <button
          onClick={() => navigate('/meetings')}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Meetings
        </button>
      </div>
    );
  }

  const meetingActions = actionItems.filter((i) => i.meetingId === meeting.id);
  const meetingDecisions = decisions.filter((d) => d.meetingId === meeting.id);

  const handleJumpToTranscript = (actionItemId: string) => {
    setHighlightedTranscriptMsgId(actionItemId);
    setActiveTab('transcript');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Back Button & Meeting Header */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/meetings')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Meetings</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {meeting.platform || 'Google Meet'}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {meeting.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
              {meeting.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {meeting.date}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {meeting.durationFormatted || `${meeting.duration} mins`}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {meeting.participants.join(', ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportTasksToCSV(meetingActions)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Tasks</span>
            </button>
            <button
              onClick={() => exportDecisionsDigest(meetingDecisions)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Decisions</span>
            </button>
          </div>
        </div>
      </div>

      {/* MEETING RECORDING card (real Egress recording when available) */}
      <MeetingRecordingCard meeting={meeting} />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'studio'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Video className="w-4 h-4" />
          Live Studio Intelligence
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'actions'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Action Items ({meetingActions.length})
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'decisions'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Decisions ({meetingDecisions.length})
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'transcript'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Full Transcript
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'summary'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Executive Synthesis
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'studio' && (
        <LiveMeetingIntelligence meeting={meeting} />
      )}

      {activeTab === 'actions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Extracted Action Items
            </h3>
            <span className="text-xs text-slate-500">
              Click &ldquo;Why AI extracted this&rdquo; to view quote evidence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetingActions.map((item) => (
              <ActionItemCard
                key={item.id}
                item={item}
                onJumpToTranscript={handleJumpToTranscript}
              />
            ))}
          </div>

          {meetingActions.length === 0 && (
            <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
              No action items for this meeting yet.
            </div>
          )}
        </div>
      )}

      {activeTab === 'decisions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Consensus &amp; Debate Matrix
            </h3>
            <span className="text-xs text-slate-500">
              Classified by quorum status and lead signatures
            </span>
          </div>

          <div className="space-y-4">
            {meetingDecisions.map((dec) => (
              <DecisionCard key={dec.id} decision={dec} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'transcript' && (
        <div className="h-[680px]">
          <TranscriptViewer
            messages={meeting.transcriptMessages || []}
            highlightedMessageId={highlightedTranscriptMsgId}
          />
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Executive Synthesis
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 font-display mb-2">
              Strategic Takeaways &amp; Alignment
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {meeting.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Key Deliverables
              </h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                {meetingActions.map((a) => (
                  <li key={a.id}>
                    <strong>{a.task}</strong> — {a.assignee} (Due {a.deadline})
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Governance Outcomes
              </h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                {meetingDecisions.map((d) => (
                  <li key={d.id}>
                    <strong>{d.text}</strong> ({d.status.toUpperCase()})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
