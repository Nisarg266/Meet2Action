import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, FileText, CheckSquare, ShieldCheck, MessageCircleQuestion, AudioLines, AlertCircle, ChevronUp, RefreshCw } from 'lucide-react';
import type { TranscriptMessage } from '../../types';
import { Avatar } from '../common/Avatar';
import { useLiveMeetingStore, type InsightTab } from '../../store/liveMeetingStore';
import { ActionDetectionCard, DecisionDetectionCard, DiscussionCard } from './DetectionCards';

const ENTITY_STYLES: Record<string, { mark: string; chip: string; label: string }> = {
  assignee: {
    mark: 'bg-purple-50 text-purple-800 decoration-purple-400',
    chip: 'bg-purple-50 text-purple-700 border-purple-200',
    label: 'Assignee',
  },
  task: {
    mark: 'bg-sky-50 text-sky-800 decoration-sky-400',
    chip: 'bg-sky-50 text-sky-700 border-sky-200',
    label: 'Task',
  },
  deadline: {
    mark: 'bg-amber-50 text-amber-800 decoration-amber-400',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Deadline',
  },
  decision: {
    mark: 'bg-emerald-50 text-emerald-800 decoration-emerald-400',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Decision',
  },
};

function renderHighlightedText(message: TranscriptMessage): React.ReactNode {
  const entities = (message.highlightEntities || []).filter((e) => e.text && message.text.includes(e.text));
  if (entities.length === 0) return message.text;

  const indexed = entities
    .map((e) => ({ ...e, index: message.text.indexOf(e.text) }))
    .filter((e) => e.index >= 0)
    .sort((a, b) => a.index - b.index);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const entity of indexed) {
    if (entity.index < cursor) continue;
    if (entity.index > cursor) {
      nodes.push(<span key={`t-${key++}`}>{message.text.slice(cursor, entity.index)}</span>);
    }
    const style = ENTITY_STYLES[entity.type] || ENTITY_STYLES.task;
    nodes.push(
      <mark key={`e-${key++}`} className={`underline decoration-2 underline-offset-2 rounded-sm px-0.5 ${style.mark}`}>
        {entity.text}
      </mark>
    );
    cursor = entity.index + entity.text.length;
  }
  if (cursor < message.text.length) {
    nodes.push(<span key={`t-${key++}`}>{message.text.slice(cursor)}</span>);
  }
  return nodes;
}

const TranscriptFeed: React.FC = () => {
  const transcript = useLiveMeetingStore((s) => s.meeting.transcript);
  const currentInterim = useLiveMeetingStore((s) => s.currentInterim);
  const transcriptStatus = useLiveMeetingStore((s) => s.transcriptStatus);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [transcript.length, currentInterim?.text]);

  if (transcript.length === 0 && !currentInterim?.text) {
    const handleRetryDispatch = () => {
      const store = useLiveMeetingStore.getState();
      store.setTranscriptStatus('connecting');
      const roomName = store.meeting.roomName;
      if (roomName) {
        void fetch('/api/livekit/dispatch-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName, force: true }),
        }).catch(() => {});
      }
    };

    return (
      <div className="flex flex-col items-center justify-center gap-3 py-14 text-center px-6">
        <AudioLines className="w-6 h-6 text-sky-500 animate-pulse" />
        <p className="text-sm font-semibold text-slate-700">
          {transcriptStatus === 'connecting'
            ? 'Connecting STT agent…'
            : transcriptStatus === 'error'
              ? 'STT agent connecting…'
              : 'Listening to the conversation…'}
        </p>
        <p className="text-xs text-slate-400 leading-relaxed max-w-[250px]">
          Transcript segments stream in here the moment speech is detected, with entities highlighted live.
        </p>
        {(transcriptStatus === 'connecting' || transcriptStatus === 'error') && (
          <button
            type="button"
            onClick={handleRetryDispatch}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold border border-sky-200 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reconnect STT Agent</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="px-3.5 py-4 space-y-4">
      <AnimatePresence initial={false}>
        {transcript.map((message) => {
          const entities = message.highlightEntities || [];
          return (
            <motion.div
              key={message.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl border p-3 ${
                message.associatedActionItemId || message.associatedDecisionId
                  ? 'bg-sky-50/50 border-sky-200/70'
                  : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar name={message.speaker} src={message.avatar} size="xs" />
                <span className="text-xs font-bold" style={{ color: message.color || '#0284C7' }}>
                  {message.speaker}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{message.timestamp}</span>
              </div>

              <p className="text-[13px] text-slate-700 leading-relaxed">"{renderHighlightedText(message)}"</p>

              {entities.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1">
                  {entities.map((entity, i) => {
                    const style = ENTITY_STYLES[entity.type] || ENTITY_STYLES.task;
                    return (
                      <div key={`${entity.text}-${i}`} className="flex items-center gap-2 text-[10px] font-mono">
                        <span className={`px-1.5 py-0.5 rounded border font-semibold ${style.chip}`}>{entity.text}</span>
                        <span className="text-slate-300">→</span>
                        <span className="text-slate-500 uppercase tracking-wide">{style.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })}

        {currentInterim && currentInterim.text.trim() && (
          <motion.div
            key="current-interim-card"
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-dashed border-sky-400/80 bg-sky-50/50 p-3"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-sky-900">{currentInterim.speaker}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-sky-600">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                Speaking…
              </span>
            </div>
            <p className="text-[13px] text-slate-700 italic leading-relaxed">
              "{currentInterim.text}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TABS: { id: InsightTab; label: string; icon: React.ElementType }[] = [
  { id: 'transcript', label: 'Transcript', icon: FileText },
  { id: 'actions', label: 'Actions', icon: CheckSquare },
  { id: 'decisions', label: 'Decisions', icon: ShieldCheck },
  { id: 'discussions', label: 'Discussions', icon: MessageCircleQuestion },
];

export const AiInsightsPanel: React.FC = () => {
  const meeting = useLiveMeetingStore((s) => s.meeting);
  const activeTab = useLiveMeetingStore((s) => s.activeTab);
  const setActiveTab = useLiveMeetingStore((s) => s.setActiveTab);
  const aiStatus = useLiveMeetingStore((s) => s.aiStatus);
  const aiSource = useLiveMeetingStore((s) => s.aiSource);
  const mode = useLiveMeetingStore((s) => s.mode);
  const unread = useLiveMeetingStore((s) => s.unread);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const actionItems = meeting.actionItems;
  const decisions = meeting.decisions.filter((d) => d.status !== 'open');
  const discussions = meeting.decisions.filter((d) => d.status === 'open');

  const counts: Record<InsightTab, number> = {
    transcript: meeting.transcript.length,
    actions: actionItems.length,
    decisions: decisions.length,
    discussions: discussions.length,
  };

  const totalUnread =
    (activeTab === 'transcript' ? 0 : unread.transcript) +
    (activeTab === 'actions' ? 0 : unread.actions) +
    (activeTab === 'decisions' ? 0 : unread.decisions) +
    (activeTab === 'discussions' ? 0 : unread.discussions);

  const emptyStates: Record<InsightTab, { title: string; hint: string }> = {
    transcript: { title: 'Listening…', hint: 'Transcript appears here in real time.' },
    actions: {
      title: 'No action items yet',
      hint: 'MeetFlow AI detects commitments like "I\'ll finish the redesign by Friday" as they are spoken.',
    },
    decisions: {
      title: 'No decisions yet',
      hint: 'Decisive statements ("We\'ve decided to…") are extracted and logged here for sign-off.',
    },
    discussions: {
      title: 'No open discussions',
      hint: 'Uncertain threads are kept open — never auto-classified as confirmed decisions.',
    },
  };

  return (
    <aside
      className={`w-full lg:w-[400px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col min-h-0
        fixed lg:static inset-x-0 bottom-0 z-40 h-[74vh] lg:h-auto shadow-2xl lg:shadow-none
        transition-transform duration-300 ease-out ${
          isMobileOpen ? 'translate-y-0' : 'translate-y-[calc(100%-2.75rem)]'
        } lg:translate-y-0`}
    >
      {/* Mobile drawer handle — the insights never permanently cover the main video */}
      <button
        onClick={() => setIsMobileOpen((v) => !v)}
        className="lg:hidden h-11 shrink-0 w-full flex items-center justify-between px-4 border-b border-slate-100 cursor-pointer"
        aria-expanded={isMobileOpen}
        aria-label={isMobileOpen ? 'Collapse AI insights' : 'Expand AI insights'}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span className="text-xs font-bold font-display text-slate-900 tracking-tight truncate">Live AI Insights</span>
          <span className="text-[10px] font-mono text-slate-400">
            {counts.transcript} tx · {counts.actions} act · {counts.decisions} dec
          </span>
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {totalUnread > 0 && (
            <span className="min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
          <ChevronUp
            className={`w-4 h-4 text-slate-500 transition-transform ${isMobileOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      <div className="hidden lg:block px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            </span>
            <div>
              <h2 className="text-sm font-bold font-display text-slate-900 tracking-tight leading-tight">
                Live AI Insights
              </h2>
              <span className="text-[10px] font-mono text-slate-400">MEETFLOW ASSISTANT · {mode === 'demo' ? 'DEMO PIPELINE' : 'LIVE PIPELINE'}</span>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
              aiStatus === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : aiStatus === 'analyzing'
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                aiStatus === 'error' ? 'bg-rose-500' : aiStatus === 'analyzing' ? 'bg-sky-500' : 'bg-emerald-500'
              }`}
            />
            {aiStatus === 'error' ? 'Error' : aiStatus === 'analyzing' ? 'Analyzing' : 'Listening'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-2.5">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider border ${
              aiSource === 'gemini'
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : aiSource === 'fallback'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
            title={
              aiSource === 'gemini'
                ? 'Detections produced by real Gemini calls (gemini-3.6-flash)'
                : aiSource === 'fallback'
                  ? 'Gemini unavailable — detections produced by the heuristic fallback engine'
                  : 'Waiting for the first analysis result'
            }
          >
            {aiSource === 'gemini' ? 'GEMINI' : aiSource === 'fallback' ? 'FALLBACK' : 'AI READY'}
          </span>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            {aiSource === 'gemini'
              ? 'gemini-3.6-flash'
              : aiSource === 'fallback'
                ? 'heuristic engine'
                : 'gemini-3.6-flash'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 px-2 pt-2 border-b border-slate-100 shrink-0 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {counts[tab.id]}
                </span>
              )}
              {!isActive && unread[tab.id] > 0 && (
                <span className="absolute top-1 right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'transcript' && <TranscriptFeed />}

        {activeTab === 'actions' && (
          <div className="p-3.5 space-y-3">
            {actionItems.length === 0 ? (
              <EmptyState {...emptyStates.actions} icon={CheckSquare} />
            ) : (
              actionItems.map((item) => <ActionDetectionCard key={item.id} item={item} />)
            )}
          </div>
        )}

        {activeTab === 'decisions' && (
          <div className="p-3.5 space-y-3">
            {decisions.length === 0 ? (
              <EmptyState {...emptyStates.decisions} icon={ShieldCheck} />
            ) : (
              decisions.map((decision) => <DecisionDetectionCard key={decision.id} decision={decision} />)
            )}
          </div>
        )}

        {activeTab === 'discussions' && (
          <div className="p-3.5 space-y-3">
            {discussions.length === 0 ? (
              <EmptyState {...emptyStates.discussions} icon={MessageCircleQuestion} />
            ) : (
              discussions.map((discussion) => <DiscussionCard key={discussion.id} discussion={discussion} />)
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100 shrink-0">
        <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
          <AudioLines className={`w-3 h-3 ${aiSource === 'fallback' ? 'text-amber-400' : 'text-sky-400'}`} />
          {aiSource === 'fallback'
            ? 'Heuristic fallback — Gemini unavailable'
            : aiSource === 'gemini'
              ? 'LiveKit audio → STT → Gemini 3.6 Flash'
              : 'LiveKit audio → STT → MeetFlow AI extraction'}
          {mode === 'demo' && <span className="text-amber-500">· simulated transcript</span>}
        </p>
      </div>
    </aside>
  );
};

const EmptyState: React.FC<{ title: string; hint: string; icon: React.ElementType }> = ({ title, hint, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center px-4">
    <span className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
      <Icon className="w-4.5 h-4.5 text-slate-400" />
    </span>
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    <p className="text-xs text-slate-400 leading-relaxed max-w-[260px]">{hint}</p>
  </div>
);
