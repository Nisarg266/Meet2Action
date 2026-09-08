import React, { useState, useRef, useEffect } from 'react';
import { TranscriptMessage } from '../../types';
import { Avatar } from '../common/Avatar';
import {
  Search,
  Volume2,
  Play,
  Pause,
  Filter,
  SlidersHorizontal,
  Sparkles,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface TranscriptViewerProps {
  messages: TranscriptMessage[];
  highlightedMessageId?: string;
  onMessageClick?: (msg: TranscriptMessage) => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  messages,
  highlightedMessageId,
  onMessageClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(632); // 10:32
  const [copied, setCopied] = useState(false);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { addToast } = useAppStore();

  const speakers = Array.from(new Set(messages.map((m) => m.speaker)));

  // Scroll into view if highlighted
  useEffect(() => {
    if (highlightedMessageId && messageRefs.current[highlightedMessageId]) {
      messageRefs.current[highlightedMessageId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedMessageId]);

  // Audio player simulation timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const filteredMessages = messages.filter((msg) => {
    const matchesSpeaker = selectedSpeaker === 'all' || msg.speaker === selectedSpeaker;
    const matchesSearch =
      !searchQuery.trim() ||
      msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.speaker.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpeaker && matchesSearch;
  });

  const handleCopyTranscript = () => {
    const text = messages
      .map((m) => `${m.speaker} (${m.timestamp}):\n${m.text}\n`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('Full transcript copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full">
      {/* Top Controls Toolbar */}
      <div className="p-4 border-b border-slate-200/90 bg-slate-50/70 space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search within transcript */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcript text or speaker..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Speaker Filter & Copy */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSpeaker}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-hidden cursor-pointer text-xs"
              >
                <option value="all">All Speakers ({speakers.length})</option>
                {speakers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCopyTranscript}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Audio Scrubber & Timeline Player Bar */}
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-900 text-white rounded-xl shadow-inner text-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-7 h-7 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center transition-colors shadow-xs"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-sky-400 font-semibold">
                {formatSeconds(currentTime)}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">/ 42:15</span>
            </div>
          </div>

          <div className="flex-1 mx-3 hidden sm:block">
            <div className="relative w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (currentTime / (42 * 60)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <Volume2 className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden md:inline">Studio Audio 1080p</span>
          </div>
        </div>

        {/* Entity Highlights Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
          <span className="font-mono text-slate-400 uppercase font-semibold">Entity Map:</span>
          <span className="px-2 py-0.5 rounded-sm bg-purple-100/90 text-purple-900 border border-purple-200 font-medium">
            Assignee
          </span>
          <span className="px-2 py-0.5 rounded-sm bg-sky-100 text-sky-900 border border-sky-200 font-medium">
            Action / Task
          </span>
          <span className="px-2 py-0.5 rounded-sm bg-amber-100 text-amber-900 border border-amber-200 font-medium">
            Deadline
          </span>
          <span className="px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-900 border border-emerald-200 font-medium">
            Decision / Policy
          </span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {filteredMessages.map((msg) => {
          const isTargeted = highlightedMessageId === msg.id || highlightedMessageId === msg.associatedActionItemId;

          return (
            <div
              key={msg.id}
              ref={(el) => (messageRefs.current[msg.id] = el)}
              id={`transcript-${msg.id}`}
              onClick={() => onMessageClick && onMessageClick(msg)}
              className={`p-3.5 sm:p-4 rounded-xl transition-all border ${
                isTargeted
                  ? 'bg-sky-50/80 border-sky-300 shadow-md ring-2 ring-sky-400/30'
                  : 'bg-white hover:bg-slate-50 border-slate-200/80'
              }`}
            >
              {/* Speaker Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name={msg.speaker} src={msg.avatar} size="xs" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{msg.speaker}</span>
                    {msg.speakerRole && (
                      <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                        · {msg.speakerRole}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs font-mono font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {msg.timestamp}
                </span>
              </div>

              {/* Text with Entity Highlights */}
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal pl-8">
                {renderHighlightedText(msg.text, msg.highlightEntities)}
              </p>

              {/* Connected Primitives Indicator */}
              {(msg.associatedActionItemId || msg.associatedDecisionId) && (
                <div className="mt-2.5 pl-8 flex items-center gap-2">
                  {msg.associatedActionItemId && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                      <Sparkles className="w-3 h-3 text-sky-600" />
                      Extracted Action Item
                    </span>
                  )}
                  {msg.associatedDecisionId && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Extracted Decision
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredMessages.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm">
            No transcript utterances found matching filters.
          </div>
        )}
      </div>
    </div>
  );
};

function renderHighlightedText(
  text: string,
  highlights?: { text: string; type: 'assignee' | 'task' | 'deadline' | 'decision' }[]
) {
  if (!highlights || highlights.length === 0) {
    return text;
  }

  const highlightStyles = {
    assignee: 'bg-purple-100 text-purple-900 border-b-2 border-purple-400 font-medium px-1 rounded-xs',
    task: 'bg-sky-100 text-sky-900 border-b-2 border-sky-500 font-medium px-1 rounded-xs',
    deadline: 'bg-amber-100 text-amber-900 border-b-2 border-amber-500 font-medium px-1 rounded-xs',
    decision: 'bg-emerald-100 text-emerald-900 border-b-2 border-emerald-500 font-medium px-1 rounded-xs',
  };

  let parts: { text: string; isHighlight: boolean; type?: keyof typeof highlightStyles }[] = [
    { text, isHighlight: false },
  ];

  highlights.forEach(({ text: phrase, type }) => {
    const nextParts: typeof parts = [];
    parts.forEach((p) => {
      if (p.isHighlight) {
        nextParts.push(p);
      } else {
        const regex = new RegExp(`(${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const split = p.text.split(regex);
        split.forEach((sub) => {
          if (sub.toLowerCase() === phrase.toLowerCase()) {
            nextParts.push({ text: sub, isHighlight: true, type });
          } else if (sub) {
            nextParts.push({ text: sub, isHighlight: false });
          }
        });
      }
    });
    parts = nextParts;
  });

  return parts.map((part, idx) => {
    if (part.isHighlight && part.type) {
      return (
        <mark key={idx} className={highlightStyles[part.type]}>
          {part.text}
        </mark>
      );
    }
    return <React.Fragment key={idx}>{part.text}</React.Fragment>;
  });
}
