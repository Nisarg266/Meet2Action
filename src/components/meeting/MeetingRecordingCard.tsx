import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Download, CircleDot, Loader2, Cloud, Clock } from 'lucide-react';
import type { Meeting } from '../../types';
import { useRecordingPoll } from '../../hooks/useRecording';
import { formatRecordingDuration } from '../../services/recordingService';

/**
 * MEETING RECORDING card — shows the real Egress recording lifecycle for a
 * meeting, with Watch / Download actions once the MP4 is ready.
 */
export const MeetingRecordingCard: React.FC<{ meeting: Meeting }> = ({ meeting }) => {
  const navigate = useNavigate();
  const recording = useRecordingPoll(meeting.recording);

  if (!recording) return null;

  const isReady = recording.status === 'ready' && Boolean(recording.fileUrl);
  const isLive = recording.status === 'recording' || recording.status === 'starting';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
            <CircleDot
              className={`w-4.5 h-4.5 ${
                isReady ? 'text-emerald-400' : isLive ? 'text-rose-400 animate-pulse' : 'text-amber-400'
              }`}
            />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Meeting Recording
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
              {isReady && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Ready
                </span>
              )}
              {recording.status === 'processing' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing recording…
                </span>
              )}
              {isLive && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  {recording.status === 'starting' ? 'Recording · Starting' : 'Recording · Live'}
                </span>
              )}
              {recording.status === 'failed' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Recording failed
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <Cloud className="w-3 h-3 text-sky-500" />
                Cloud
              </span>
              {recording.duration ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3" />
                  {formatRecordingDuration(recording.duration)}
                </span>
              ) : null}
            </div>
            {recording.status === 'failed' && recording.error && (
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">{recording.error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            disabled={!isReady}
            onClick={() => navigate(`/recordings/${recording.id}`)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Watch Recording
          </button>
          <a
            href={recording.fileUrl || undefined}
            download
            aria-disabled={!isReady}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              isReady
                ? 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50 cursor-pointer'
                : 'text-slate-400 bg-slate-50 border-slate-200 pointer-events-none'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Download MP4
          </a>
        </div>
      </div>
    </div>
  );
};
