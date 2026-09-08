import React, { useState } from 'react';
import { Decision } from '../../types';
import { useAppStore } from '../../store/appStore';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  Volume2,
  ExternalLink,
  Calendar,
  Check,
  X,
  MessageCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DecisionCardProps {
  decision: Decision;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({ decision }) => {
  const { confirmDecision, rejectDecision, addToast } = useAppStore();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const navigate = useNavigate();

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    addToast(`Playing audio snippet: "${decision.text.slice(0, 40)}..."`, 'info');
    setTimeout(() => setIsPlayingAudio(false), 3000);
  };

  // Section 1: Confirmed
  if (decision.status === 'confirmed') {
    return (
      <div
        id={`decision-${decision.id}`}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {decision.category?.toUpperCase() || 'CONSENSUS'}
            </span>
            <span className="font-mono text-xs text-slate-400 font-medium">
              {decision.timestamp || 'Sep 8, 2026'}
            </span>
          </div>

          <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
            {decision.confidence}% CONFIDENCE
          </span>
        </div>

        <div>
          <h4 className="text-base font-bold text-slate-900 tracking-tight font-display">
            {decision.text}
          </h4>
          {decision.details && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {decision.details}
            </p>
          )}
        </div>

        {/* Verbatim Transcript Citation & Audio Snippet Player */}
        {decision.sourceText && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                Verbatim Transcript Evidence
              </span>
              <button
                onClick={handlePlayAudio}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:text-sky-800 transition-colors"
              >
                {isPlayingAudio ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                    <span>Playing snippet (0:03)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-sky-600 fill-sky-600" />
                    <span>Play audio snippet</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-700 italic border-l-2 border-sky-500 pl-2.5">
              &ldquo;{decision.sourceText}&rdquo;
            </p>
          </div>
        )}

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {decision.quorumStatus && (
              <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                {decision.quorumStatus}
              </span>
            )}
            {decision.signaturesCount && (
              <span className="font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                {decision.signaturesCount}
              </span>
            )}
            {decision.owner && (
              <span className="font-medium text-slate-600">
                Owner: <strong>{decision.owner}</strong>
              </span>
            )}
          </div>

          {decision.triggeredIntegration && (
            <span className="text-sky-700 font-medium flex items-center gap-1 text-[11px]">
              <ExternalLink className="w-3 h-3" />
              {decision.triggeredIntegration}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Section 2: Pending Approval
  if (decision.status === 'pending') {
    return (
      <div
        id={`decision-${decision.id}`}
        className="bg-white border border-amber-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-3.5 bg-amber-50/10"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              {decision.category?.toUpperCase() || 'SIGN-OFF REQUIRED'}
            </span>
            <span className="font-mono text-xs text-slate-400 font-medium">
              {decision.timestamp || 'Pending Vote'}
            </span>
          </div>

          <span className="font-mono text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            {decision.confidence}% CONFIDENCE
          </span>
        </div>

        <div>
          <h4 className="text-base font-bold text-slate-900 tracking-tight font-display">
            {decision.text}
          </h4>
          {decision.details && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {decision.details}
            </p>
          )}
        </div>

        {/* Quorum Progress Bar */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Quorum Status</span>
            <span className="font-mono font-medium text-slate-600">
              {decision.quorumStatus || '3 In Favor · 1 In Review'}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full w-3/4" title="In Favor (75%)" />
            <div className="bg-amber-400 h-full w-1/4" title="In Review (25%)" />
          </div>
          {decision.aiSuggestion && (
            <p className="text-xs text-amber-800 font-medium flex items-center gap-1 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              {decision.aiSuggestion}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => rejectDecision(decision.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reject Proposal
          </button>
          <button
            onClick={() => confirmDecision(decision.id)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg shadow-2xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Confirm &amp; Sign-off
          </button>
        </div>
      </div>
    );
  }

  // Section 3: Open Discussions / Unresolved Debates
  return (
    <div
      id={`decision-${decision.id}`}
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-3.5 border-l-4 border-l-rose-500"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            UNRESOLVED DEBATE
          </span>
          <span className="font-mono text-xs text-slate-400 font-medium">
            {decision.timestamp || 'Detected in meeting'}
          </span>
        </div>

        <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
          {decision.confidence}% DETECTED
        </span>
      </div>

      <div>
        <h4 className="text-base font-bold text-slate-900 tracking-tight font-display">
          {decision.text}
        </h4>
        {decision.details && (
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {decision.details}
          </p>
        )}
      </div>

      {decision.sourceText && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Dialogue Excerpt
          </div>
          <p className="text-xs text-slate-700 italic">
            &ldquo;{decision.sourceText}&rdquo;
          </p>
        </div>
      )}

      {decision.aiSuggestion && (
        <div className="bg-sky-50/70 border border-sky-200/80 rounded-lg p-3 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs text-sky-900 leading-relaxed">
            <strong className="block font-semibold mb-0.5">AI Action Recommendation:</strong>
            {decision.aiSuggestion}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
          Status: Unresolved
        </span>

        <button
          onClick={() => navigate('/schedule')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#006194] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
          Schedule 30-min Follow-up
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
