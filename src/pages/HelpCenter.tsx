import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/appStore';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Sparkles,
  Command,
  BookOpen,
  Send,
  MessageSquare,
  ShieldCheck,
  Zap,
  Waves
} from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  category: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'AI Pipeline',
    question: 'How does MeetFlow AI extract action items and deadlines?',
    answer:
      'MeetFlow processes raw meeting transcripts through dual-stage neural models. Stage 1 executes multi-speaker diarization to distinguish who is speaking. Stage 2 runs intent and commitment classification to extract tasks, assignees, and dates (e.g. "by Friday" auto-normalizes to "Sep 11, 2026"). Each task is awarded a confidence score between 0% and 100%.',
  },
  {
    id: 'faq-2',
    category: 'AI Pipeline',
    question: 'What does the Confidence Score (%) represent?',
    answer:
      'The Confidence Score evaluates semantic ambiguity. If a speaker explicitly commits ("I will finish the landing page by Friday"), confidence exceeds 92%. If someone hesitates or the owner is ambiguous ("someone should check pricing"), confidence drops below 70%, automatically flagging the deliverable with "Needs Review" so human oversight can confirm.',
  },
  {
    id: 'faq-3',
    category: 'Governance',
    question: 'How does the Decision Ledger differ from Action Items?',
    answer:
      'Action items represent actionable deliverables assigned to an individual engineer or designer. Decisions represent policy or architectural agreements that require collective alignment, lead quorum, or sign-offs (e.g. "Launch Version 2 next Monday"). Confirmed decisions are locked with cryptographic timestamps.',
  },
  {
    id: 'faq-4',
    category: 'Integrations',
    question: 'How do I synchronize tasks with Jira and Linear?',
    answer:
      'Navigate to the "Exports" or "Integrations" tab. You can enable 1-click Jira Cloud Sync or export a formatted Jira CSV/Markdown table. Confirmed items automatically map to summary, assignee, due date, and sprint milestone.',
  },
  {
    id: 'faq-5',
    category: 'Security',
    question: 'Where is audio and transcript data stored?',
    answer:
      'All ingested audio and transcripts are encrypted in transit (TLS 1.3) and at rest (AES-256). MeetFlow AI does not train public models on proprietary corporate transcripts, fully adhering to SOC2 Type II and GDPR standards.',
  },
];

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Global Search', desc: 'Search transcripts, tasks & decisions' },
  { keys: ['⌘', 'J'], label: 'Join Meeting', desc: 'Quick jump to active live session' },
  { keys: ['⌘', 'N'], label: 'New Meeting', desc: 'Schedule or provision a new session' },
  { keys: ['⌘', 'A'], label: 'Analyze Meeting', desc: 'Paste or upload transcript pipeline' },
  { keys: ['Esc'], label: 'Close Modals', desc: 'Dismiss any open modal or search box' },
];

export const HelpCenter: React.FC = () => {
  const [search, setSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [feedbackText, setFeedbackText] = useState('');
  const { addToast } = useAppStore();

  const filteredFaqs = FAQS.filter(
    (f) =>
      !search.trim() ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    addToast('Feedback submitted to MeetFlow engineering team. Thank you!', 'success');
    setFeedbackText('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            Knowledge Base &amp; Documentation
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Help Center &amp; AI Intelligence Guide
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Documentation on neural diarization, confidence thresholds, export pipelines, and keyboard shortcuts.
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-xl">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions, extraction algorithms, keyboard shortcuts..."
          className="w-full text-sm pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
        />
      </div>

      {/* Keyboard Shortcuts Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 font-display">
          <Command className="w-4 h-4 text-sky-600" />
          Productivity Keyboard Shortcuts
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2"
            >
              <div>
                <span className="text-xs font-semibold text-slate-800 block">{s.label}</span>
                <span className="text-[11px] text-slate-400">{s.desc}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {s.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="px-2 py-1 text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 rounded-md shadow-2xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs Accordion */}
      <div className="space-y-3">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-500">
          Frequently Asked Questions
        </h2>

        <div className="space-y-2.5">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;

            return (
              <div
                key={faq.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm sm:text-base text-slate-900 hover:text-sky-700 transition-colors"
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-sky-600' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100/80">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support & Feedback Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-display">
            Need custom AI integration or have suggestions?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Our team continuously tunes the Gemini 2.5 voice intelligence pipeline for enterprise compliance and custom dialects.
          </p>
        </div>

        <form
          onSubmit={handleFeedbackSubmit}
          className="flex items-center gap-2 w-full md:w-auto"
        >
          <input
            type="text"
            required
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Share feedback or report an issue..."
            className="text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 min-w-[240px]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-2xs cursor-pointer shrink-0 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </motion.div>
  );
};
