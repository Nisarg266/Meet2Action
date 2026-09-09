import React from 'react';
import { Modal } from '../common/Modal';
import { PhoneOff, ShieldCheck, Sparkles, CircleDot } from 'lucide-react';

interface EndMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stats: { transcriptCount: number; actionCount: number; decisionCount: number };
  /** True when a real Egress recording is active for this meeting. */
  hasRecording?: boolean;
}

export const EndMeetingModal: React.FC<EndMeetingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  stats,
  hasRecording = false,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={hasRecording ? 'End Meeting & Save Recording?' : 'End this meeting?'}
    subtitle={
      hasRecording
        ? 'The meeting recording and transcript will be saved.'
        : 'MeetFlow AI will save the transcript and generate the full analysis.'
    }
    maxWidth="sm"
  >
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
          On end, MeetFlow will automatically:
        </p>
        {[
          ...(hasRecording
            ? [
                {
                  icon: CircleDot,
                  text: 'Stop the cloud recording and finalize the MP4 (continues processing in the background)',
                },
              ]
            : []),
          { icon: ShieldCheck, text: `Save the live transcript (${stats.transcriptCount} segments)` },
          { icon: Sparkles, text: `Run final AI analysis — ${stats.actionCount} action items & ${stats.decisionCount} decisions detected so far` },
          { icon: Sparkles, text: 'Generate executive summary, action items, decisions & open discussions' },
        ].map((row, i) => (
          <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
            <row.icon className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
            <span>{row.text}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <PhoneOff className="w-4 h-4" />
          {hasRecording ? 'End & Save' : 'End Meeting'}
        </button>
      </div>
    </div>
  </Modal>
);
