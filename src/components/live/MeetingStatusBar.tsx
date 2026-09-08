import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Users, Radio, Sparkles, PhoneOff, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { useLiveMeetingStore, formatDuration, type LiveConnectionState, type AiStatus, type LiveMode } from '../../store/liveMeetingStore';
import { useAppStore } from '../../store/appStore';

interface MeetingStatusBarProps {
  roomName: string;
  title: string;
  participantCount: number;
  connection: LiveConnectionState;
  mode: LiveMode;
  aiStatus: AiStatus;
  onEndMeeting: () => void;
}

export const MeetingStatusBar: React.FC<MeetingStatusBarProps> = ({
  roomName,
  title,
  participantCount,
  connection,
  mode,
  aiStatus,
  onEndMeeting,
}) => {
  const elapsedSeconds = useLiveMeetingStore((s) => s.elapsedSeconds);
  const aiSource = useLiveMeetingStore((s) => s.aiSource);
  const transcriptStatus = useLiveMeetingStore((s) => s.transcriptStatus);
  const addToast = useAppStore((s) => s.addToast);
  const navigate = useNavigate();

  const copyInvite = async () => {
    const link = `${window.location.origin}/live-meeting/${roomName}`;
    try {
      await navigator.clipboard.writeText(link);
      addToast('Invite link copied to clipboard', 'success');
    } catch {
      addToast(`Invite link: ${link}`, 'info');
    }
  };

  const connectionLabel =
    mode === 'demo'
      ? 'DEMO MODE'
      : connection === 'connected'
        ? 'LIVEKIT · CONNECTED'
        : connection === 'reconnecting'
          ? 'RECONNECTING…'
          : 'OFFLINE';

  return (
    <header className="h-14 shrink-0 bg-slate-950 border-b border-slate-800 px-3 sm:px-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate('/meetings')}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          title="Back to meetings"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0284C7] to-[#006194] flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
          M
        </div>

        <div className="min-w-0 hidden sm:block">
          <div className="text-sm font-display font-bold text-slate-100 leading-tight truncate max-w-[220px]">
            {title}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-mono font-semibold text-slate-400">
              Room: <span className="text-sky-400">{roomName}</span>
            </span>
            <button
              onClick={copyInvite}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-700 transition-colors cursor-pointer"
              title="Copy shareable meeting link"
            >
              <Copy className="w-3 h-3 text-sky-400" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-bold tracking-wider">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-400" />
          </span>
          LIVE
        </span>

        <span className="font-mono text-xs text-slate-300 tabular-nums">
          {formatDuration(elapsedSeconds)}
        </span>

        <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          {participantCount}
        </span>

        <span
          className={`hidden lg:inline-flex items-center gap-1.5 text-[10px] font-mono ${
            transcriptStatus === 'error'
              ? 'text-rose-300'
              : transcriptStatus === 'reconnecting'
                ? 'text-amber-300'
                : 'text-emerald-300/90'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              transcriptStatus === 'error'
                ? 'bg-rose-400'
                : transcriptStatus === 'reconnecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-400 animate-pulse'
            }`}
          />
          {mode === 'demo'
            ? 'Transcript · Demo'
            : transcriptStatus === 'connecting'
              ? 'Transcript · Connecting'
              : transcriptStatus === 'reconnecting'
                ? 'Transcript · Reconnecting'
                : transcriptStatus === 'error'
                  ? 'Transcript · Error'
                  : 'Transcript · Live'}
        </span>

        <span
          className={`hidden lg:inline-flex items-center gap-1.5 text-[10px] font-mono ${
            aiStatus === 'error'
              ? 'text-rose-300'
              : aiStatus === 'analyzing'
                ? 'text-sky-300/90'
                : aiSource === 'gemini'
                  ? 'text-sky-300/90'
                  : aiSource === 'fallback'
                    ? 'text-amber-300/90'
                    : 'text-slate-400'
          }`}
        >
          <Sparkles
            className={`w-3 h-3 ${aiStatus === 'analyzing' ? 'animate-pulse' : ''} ${
              aiStatus === 'error' ? 'text-rose-400' : aiSource === 'fallback' ? 'text-amber-400' : ''
            }`}
          />
          AI ·{' '}
          {aiStatus === 'analyzing'
            ? 'Analyzing'
            : aiStatus === 'error'
              ? 'Error'
              : aiSource === 'gemini'
                ? 'Gemini'
                : aiSource === 'fallback'
                  ? 'Fallback'
                  : 'Waiting'}
        </span>

        <span
          className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-mono font-semibold tracking-wider ${
            mode === 'demo'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : connection === 'connected'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : connection === 'reconnecting'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
          }`}
          title={mode === 'demo' ? 'Simulated media — LiveKit server not configured' : 'LiveKit WebRTC connection'}
        >
          {mode === 'demo' ? <Radio className="w-3 h-3" /> : connection === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connectionLabel}
        </span>

        <button
          onClick={onEndMeeting}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-all"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">End Meeting</span>
          <span className="sm:hidden">End</span>
        </button>
      </div>
    </header>
  );
};
