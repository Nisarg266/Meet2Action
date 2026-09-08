import React from 'react';
import { motion } from 'motion/react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import type { ProcessingStep } from '../../services/aiService';

interface FinalAnalysisOverlayProps {
  steps: ProcessingStep[];
  meetingTitle: string;
}

export const FinalAnalysisOverlay: React.FC<FinalAnalysisOverlayProps> = ({ steps, meetingTitle }) => (
  <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
    >
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-sky-600 animate-pulse" />
          </span>
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900 tracking-tight">
              Generating Meeting Analysis
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-[260px]">{meetingTitle}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-3.5">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                step.status === 'done'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : step.status === 'processing'
                    ? 'bg-sky-50 border-sky-200 text-sky-600'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {step.status === 'done' ? (
                <Check className="w-3.5 h-3.5" />
              ) : step.status === 'processing' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              )}
            </span>
            <span
              className={`text-sm ${
                step.status === 'done'
                  ? 'text-slate-700 font-medium'
                  : step.status === 'processing'
                    ? 'text-sky-700 font-semibold'
                    : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
            {step.status === 'processing' && (
              <span className="ml-auto text-[10px] font-mono text-sky-500">RUNNING</span>
            )}
            {step.status === 'done' && index === steps.length - 1 && (
              <span className="ml-auto text-[10px] font-mono text-emerald-600">DONE</span>
            )}
          </div>
        ))}
      </div>

      <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100">
        <p className="text-[10px] font-mono text-slate-400 text-center">
          Saving transcript · Extracting deliverables · Preparing analysis workspace
        </p>
      </div>
    </motion.div>
  </div>
);
