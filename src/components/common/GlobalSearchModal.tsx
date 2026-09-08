import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Search, Calendar, CheckSquare, MessageSquare, User, ArrowRight, X } from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchModalOpen, setSearchModalOpen, meetings, actionItems, decisions } = useAppStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut listener ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(!isSearchModalOpen);
      } else if (e.key === 'Escape' && isSearchModalOpen) {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setSearchModalOpen]);

  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredMeetings = q
    ? meetings.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.summary.toLowerCase().includes(q) ||
          m.participants.some((p) => p.toLowerCase().includes(q))
      )
    : meetings.slice(0, 3);

  const filteredTasks = q
    ? actionItems.filter(
        (t) =>
          t.task.toLowerCase().includes(q) ||
          (t.assignee && t.assignee.toLowerCase().includes(q)) ||
          (t.originalDeadlinePhrase && t.originalDeadlinePhrase.toLowerCase().includes(q))
      )
    : actionItems.slice(0, 4);

  const filteredDecisions = q
    ? decisions.filter(
        (d) =>
          d.text.toLowerCase().includes(q) ||
          (d.details && d.details.toLowerCase().includes(q)) ||
          (d.sourceText && d.sourceText.toLowerCase().includes(q))
      )
    : decisions.slice(0, 3);

  const handleSelect = (path: string) => {
    navigate(path);
    setSearchModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setSearchModalOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-white">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcripts, decisions, tasks, people..."
            className="w-full text-base text-slate-900 placeholder:text-slate-400 outline-hidden bg-transparent"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Stream */}
        <div className="overflow-y-auto p-3 divide-y divide-slate-100">
          {/* Action Items */}
          {filteredTasks.length > 0 && (
            <div className="py-2 first:pt-0">
              <div className="px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
                Action Items
              </div>
              <div className="mt-1 space-y-1">
                {filteredTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect('/action-items')}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                      <span className="text-sm font-medium text-slate-800 truncate group-hover:text-sky-700">
                        {t.task}
                      </span>
                      {t.assignee && (
                        <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {t.assignee}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400 shrink-0 group-hover:text-slate-600 flex items-center gap-1">
                      {t.deadline || 'No deadline'}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-sky-600" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meetings */}
          {filteredMeetings.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Meetings
              </div>
              <div className="mt-1 space-y-1">
                {filteredMeetings.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(`/meetings/${m.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-sm font-medium text-slate-800 truncate group-hover:text-emerald-700">
                        {m.title}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">{m.date}</span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                      {m.actionItems.length} tasks
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Decisions */}
          {filteredDecisions.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                Decisions & Topics
              </div>
              <div className="mt-1 space-y-1">
                {filteredDecisions.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect('/decisions')}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          d.status === 'confirmed'
                            ? 'bg-emerald-500'
                            : d.status === 'pending'
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                        }`}
                      />
                      <span className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-700">
                        {d.text}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-400 shrink-0 capitalize">
                      {d.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredTasks.length === 0 && filteredMeetings.length === 0 && filteredDecisions.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">
              No results found for &ldquo;<span className="font-semibold text-slate-800">{query}</span>&rdquo;
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="font-mono bg-white px-1.5 py-0.5 border border-slate-200 rounded">↑</kbd> <kbd className="font-mono bg-white px-1.5 py-0.5 border border-slate-200 rounded">↓</kbd></span>
            <span>Select: <kbd className="font-mono bg-white px-1.5 py-0.5 border border-slate-200 rounded">↵</kbd></span>
          </div>
          <span>MeetFlow Neural Search</span>
        </div>
      </div>
    </div>
  );
};
