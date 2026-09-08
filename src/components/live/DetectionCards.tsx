import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Pencil, X, CalendarClock, ShieldCheck, MessageCircleQuestion, Sparkles, CheckCircle2 } from 'lucide-react';
import type { ActionItem, Decision } from '../../types';
import { Avatar } from '../common/Avatar';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { useLiveMeetingStore } from '../../store/liveMeetingStore';
import { useAppStore } from '../../store/appStore';

const CardButton: React.FC<{
  onClick: () => void;
  variant: 'confirm' | 'edit' | 'dismiss' | 'ghost';
  children: React.ReactNode;
}> = ({ onClick, variant, children }) => {
  const styles: Record<string, string> = {
    confirm: 'text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-600',
    edit: 'text-slate-700 bg-white hover:bg-slate-50 border border-slate-200',
    dismiss: 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent',
    ghost: 'text-sky-700 bg-white hover:bg-sky-50 border border-sky-200',
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${styles[variant]}`}
    >
      {children}
    </button>
  );
};

export const ActionDetectionCard: React.FC<{ item: ActionItem }> = ({ item }) => {
  const confirmLiveAction = useLiveMeetingStore((s) => s.confirmLiveAction);
  const dismissLiveAction = useLiveMeetingStore((s) => s.dismissLiveAction);
  const editLiveAction = useLiveMeetingStore((s) => s.editLiveAction);
  const addToast = useAppStore((s) => s.addToast);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState({ task: item.task, assignee: item.assignee || '', deadline: item.deadline || '' });

  React.useEffect(() => {
    setDraft({ task: item.task, assignee: item.assignee || '', deadline: item.deadline || '' });
  }, [item.task, item.assignee, item.deadline]);

  const handleConfirm = () => {
    confirmLiveAction(item.id);
    addToast(`Action confirmed — "${item.task}" synced to workspace`, 'success');
  };

  const handleDismiss = () => {
    dismissLiveAction(item.id);
    addToast('Action item dismissed', 'info');
  };

  const handleSave = () => {
    editLiveAction(item.id, {
      task: draft.task.trim() || item.task,
      assignee: draft.assignee.trim() || item.assignee,
      deadline: draft.deadline.trim() || item.deadline,
    });
    setIsEditing(false);
    addToast('Action item updated', 'success');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-3.5 transition-all ${
        item.isConfirmed
          ? 'bg-emerald-50/40 border-emerald-200'
          : 'bg-white border-slate-200 hover:border-sky-300/80 shadow-2xs'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            item.isConfirmed
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {item.isConfirmed ? <CheckCircle2 className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
          {item.isConfirmed ? 'Action Item · Confirmed' : 'Action Item Detected'}
        </span>
        <ConfidenceIndicator confidence={item.confidence} size="sm" />
      </div>

      {isEditing ? (
        <div className="space-y-2 mb-3">
          <input
            value={draft.task}
            onChange={(e) => setDraft({ ...draft, task: e.target.value })}
            placeholder="Task"
            className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={draft.assignee}
              onChange={(e) => setDraft({ ...draft, assignee: e.target.value })}
              placeholder="Assignee"
              className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
            <input
              value={draft.deadline}
              onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
              placeholder="Deadline"
              className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <CardButton onClick={handleSave} variant="confirm">
              <Check className="w-3.5 h-3.5" /> Save
            </CardButton>
            <CardButton onClick={() => setIsEditing(false)} variant="dismiss">
              Cancel
            </CardButton>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-900 leading-snug mb-2.5">{item.task}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 mb-2.5">
            <span className="flex items-center gap-1.5">
              <Avatar name={item.assignee || 'Unassigned'} src={item.assigneeAvatar} size="xs" />
              <span className="font-medium text-slate-800">{item.assignee || 'Unassigned'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono text-[11px]">{item.deadline || 'TBD'}</span>
              {item.originalDeadlinePhrase && (
                <span className="text-slate-400 italic text-[11px]">"{item.originalDeadlinePhrase}"</span>
              )}
            </span>
          </div>

          {item.sourceText && (
            <blockquote className="border-l-2 border-slate-200 pl-2.5 text-[11px] text-slate-500 italic mb-3 leading-snug">
              {item.sourceText}
            </blockquote>
          )}

          <div className="flex items-center gap-2">
            {item.isConfirmed ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirmed — will sync to Kanban
              </span>
            ) : (
              <>
                <CardButton onClick={handleConfirm} variant="confirm">
                  <Check className="w-3.5 h-3.5" /> Confirm
                </CardButton>
                <CardButton onClick={() => setIsEditing(true)} variant="edit">
                  <Pencil className="w-3 h-3" /> Edit
                </CardButton>
                <CardButton onClick={handleDismiss} variant="dismiss">
                  <X className="w-3.5 h-3.5" /> Dismiss
                </CardButton>
              </>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export const DecisionDetectionCard: React.FC<{ decision: Decision }> = ({ decision }) => {
  const confirmLiveDecision = useLiveMeetingStore((s) => s.confirmLiveDecision);
  const dismissLiveDecision = useLiveMeetingStore((s) => s.dismissLiveDecision);
  const addToast = useAppStore((s) => s.addToast);
  const isConfirmed = decision.status === 'confirmed' && decision.quorumStatus === '100% Consensus';

  const handleConfirm = () => {
    confirmLiveDecision(decision.id);
    addToast('Decision confirmed and logged to the decision record', 'success');
  };

  const handleDismiss = () => {
    dismissLiveDecision(decision.id);
    addToast('Decision dismissed', 'info');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-3.5 transition-all ${
        isConfirmed ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-300/80 shadow-2xs'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
          <ShieldCheck className="w-3 h-3" />
          Decision Detected
        </span>
        <ConfidenceIndicator confidence={decision.confidence} size="sm" />
      </div>

      <p className="text-sm font-semibold text-slate-900 leading-snug mb-1.5">"{decision.text}"</p>

      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 mb-2.5">
        {decision.citationSpeaker && <span>{decision.citationSpeaker}</span>}
        {decision.timestamp && <span>· {decision.timestamp}</span>}
        {decision.targetDate && <span className="text-amber-600">· target {decision.targetDate}</span>}
      </div>

      <div className="flex items-center gap-2">
        {isConfirmed ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed · Consensus logged
          </span>
        ) : (
          <>
            <CardButton onClick={handleConfirm} variant="confirm">
              <Check className="w-3.5 h-3.5" /> Confirm
            </CardButton>
            <CardButton onClick={handleDismiss} variant="dismiss">
              <X className="w-3.5 h-3.5" /> Dismiss
            </CardButton>
          </>
        )}
      </div>
    </motion.div>
  );
};

export const DiscussionCard: React.FC<{ discussion: Decision }> = ({ discussion }) => {
  const dismissLiveDecision = useLiveMeetingStore((s) => s.dismissLiveDecision);
  const addToast = useAppStore((s) => s.addToast);
  const navigate = useNavigate();

  const handleDismiss = () => {
    dismissLiveDecision(discussion.id);
    addToast('Discussion removed', 'info');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 border-l-4 border-l-rose-500 bg-white p-3.5 shadow-2xs"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
          <MessageCircleQuestion className="w-3 h-3" />
          Open Discussion
        </span>
        <ConfidenceIndicator confidence={discussion.confidence} size="sm" />
      </div>

      <p className="text-sm font-semibold text-slate-900 leading-snug mb-1.5">"{discussion.text}"</p>

      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 mb-2">
        {discussion.citationSpeaker && <span>{discussion.citationSpeaker}</span>}
        {discussion.timestamp && <span>· {discussion.timestamp}</span>}
      </div>

      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1.5 mb-2">
        Uncertain language detected — kept open, not classified as a confirmed decision.
      </p>

      {discussion.aiSuggestion && (
        <div className="bg-sky-50/70 border border-sky-200/80 rounded-lg px-2.5 py-2 mb-2.5 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-sky-800 leading-snug">{discussion.aiSuggestion}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <CardButton onClick={() => navigate('/schedule')} variant="ghost">
          <CalendarClock className="w-3.5 h-3.5" /> Schedule Follow-up
        </CardButton>
        <CardButton onClick={handleDismiss} variant="dismiss">
          <X className="w-3.5 h-3.5" /> Dismiss
        </CardButton>
      </div>
    </motion.div>
  );
};
