import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Download,
  Loader2,
  CircleDot,
  Play,
  Maximize2,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  FileText,
  CheckSquare,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { fetchRecording, formatRecordingDuration, formatRecordingSize } from '../services/recordingService';
import { useRecordingPoll, transcriptSecondsOffset } from '../hooks/useRecording';
import type { ActionItem, Decision, MeetingRecording } from '../types';

/**
 * /recordings/:id — recording player.
 * Large MP4 player (native play/pause/seek/volume/fullscreen) + Download,
 * meeting metadata, and the meeting intelligence (transcript with seekable
 * timestamps, action items, decisions).
 */

const InsightList: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({
  title,
  icon: Icon,
  children,
}) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
    <div className="flex items-center gap-2 mb-3">
      <span className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-sky-600" />
      </span>
      <h3 className="text-sm font-bold font-display text-slate-900">{title}</h3>
    </div>
    {children}
  </div>
);

export const RecordingPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meetings = useAppStore((s) => s.meetings);
  const updateMeeting = useAppStore((s) => s.updateMeeting);

  const [initial, setInitial] = React.useState<MeetingRecording | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [activeInsightTab, setActiveInsightTab] = React.useState<'transcript' | 'actions' | 'decisions'>('transcript');

  // Load the recording from the server (falling back to local metadata).
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    (async () => {
      const local = meetings.find((m) => m.recording?.id === id)?.recording || null;
      try {
        const fresh = await fetchRecording(id!);
        if (!cancelled) setInitial(fresh);
      } catch {
        if (!cancelled) {
          if (local) setInitial(local);
          else setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const recording = useRecordingPoll(initial);
  const rec = recording ?? initial;

  // Keep the local meeting's recording metadata in sync when status changes.
  React.useEffect(() => {
    if (!rec) return;
    const meeting = meetings.find((m) => m.recording?.id === rec.id || m.id === rec.meetingId);
    if (meeting && meeting.recording && meeting.recording.status !== rec.status) {
      updateMeeting(meeting.id, { recording: { ...meeting.recording, ...rec } });
    }
  }, [rec?.status, rec?.fileUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const meeting = meetings.find((m) => m.recording?.id === id || m.id === rec?.meetingId);
  const transcript = meeting?.transcriptMessages || [];
  const actions: ActionItem[] = meeting?.actionItems || [];
  const decisions: Decision[] = meeting?.decisions || [];

  const seekToSeconds = (seconds: number | null) => {
    if (seconds === null || !videoRef.current || !rec?.fileUrl) return;
    const video = videoRef.current;
    const target = rec.duration ? Math.min(Math.max(0, seconds), Math.max(0, rec.duration - 1)) : Math.max(0, seconds);
    video.currentTime = target;
    void video.play().catch(() => {});
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void video.requestFullscreen?.().catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Loading recording…</p>
      </div>
    );
  }

  if (notFound || !rec) {
    return (
      <div className="p-12 max-w-lg mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 font-display">Recording Not Found</h3>
        <p className="text-xs text-slate-500">
          No recording exists with ID "{id}". It may have been recorded on another device before the server restarted.
        </p>
        <button
          onClick={() => navigate('/recordings')}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Recordings
        </button>
      </div>
    );
  }

  const dateLabel = rec.startedAt
    ? new Date(rec.startedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';
  const isReady = rec.status === 'ready' && Boolean(rec.fileUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <button
            onClick={() => navigate('/recordings')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Recordings
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
              {rec.storageProvider === 'cloud' || rec.storageProvider ? 'Cloud Recording' : 'Recording'}
            </span>
            {isReady && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Ready
              </span>
            )}
            {rec.status === 'processing' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing — the MP4 will appear here automatically
              </span>
            )}
            {rec.status === 'failed' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Recording failed{rec.error ? `: ${rec.error}` : ''}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-display truncate">
            {rec.meetingTitle || meeting?.title || 'Live Meeting'}
          </h1>
        </div>

        {isReady && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleFullscreen}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              Fullscreen
            </button>
            <a
              href={rec.fileUrl}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download MP4
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Player + metadata */}
        <div className="lg:col-span-2 space-y-4">
          {isReady ? (
            <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
              <video
                ref={videoRef}
                src={rec.fileUrl}
                controls
                controlsList="nodownload"
                playsInline
                preload="metadata"
                className="w-full aspect-video bg-black"
              />
            </div>
          ) : (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 aspect-video flex flex-col items-center justify-center gap-4 text-center px-6">
              {rec.status === 'failed' ? (
                <>
                  <AlertTriangle className="w-10 h-10 text-rose-400" />
                  <p className="text-sm font-semibold text-slate-100">Recording failed</p>
                  <p className="text-xs text-slate-500 max-w-sm">{rec.error || 'The Egress job did not produce a file.'}</p>
                </>
              ) : (
                <>
                  <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
                  <p className="text-sm font-semibold text-slate-100">
                    {rec.status === 'recording' || rec.status === 'starting'
                      ? 'This meeting is still being recorded'
                      : 'Processing your recording…'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    The MP4 is being finalized and uploaded to cloud storage. This page updates automatically — the
                    player appears the moment the file is ready.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Metadata below the player */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {dateLabel}
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {rec.duration ? formatRecordingDuration(rec.duration) : '—'}
              </span>
              {meeting?.participants?.length ? (
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {meeting.participants.length} participants
                </span>
              ) : null}
              {rec.fileSize ? (
                <span className="font-mono text-slate-400">{formatRecordingSize(rec.fileSize)}</span>
              ) : null}
            </div>
            {meeting?.participants?.length ? (
              <div className="mt-2.5 text-[11px] text-slate-400 truncate">{meeting.participants.join(' · ')}</div>
            ) : null}
          </div>
        </div>

        {/* Meeting intelligence column */}
        <div className="space-y-4">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            {(
              [
                { id: 'transcript', label: 'Transcript', icon: FileText, count: transcript.length },
                { id: 'actions', label: 'Actions', icon: CheckSquare, count: actions.length },
                { id: 'decisions', label: 'Decisions', icon: ShieldCheck, count: decisions.length },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveInsightTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    activeInsightTab === tab.id ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.count > 0 && <span className="font-mono text-[10px] text-slate-400">{tab.count}</span>}
                </button>
              );
            })}
          </div>

          {activeInsightTab === 'transcript' && (
            <InsightList title="Transcript" icon={FileText}>
              {transcript.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No transcript was captured for this meeting.</p>
              ) : (
                <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
                  {transcript.map((message) => {
                    const offset = transcriptSecondsOffset(message, rec.startedAt);
                    const seekable = isReady && offset !== null;
                    return (
                      <button
                        key={message.id}
                        disabled={!seekable}
                        onClick={() => seekToSeconds(offset)}
                        className={`w-full text-left rounded-lg border p-2.5 transition-colors ${
                          seekable
                            ? 'border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 cursor-pointer'
                            : 'border-slate-100 cursor-default'
                        }`}
                        title={seekable ? 'Jump to this moment in the recording' : undefined}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono font-semibold text-sky-600 inline-flex items-center gap-1">
                            {seekable && <Play className="w-2.5 h-2.5" />}
                            {message.timestamp}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700 truncate">{message.speaker}</span>
                        </div>
                        <p className="text-[12px] text-slate-600 leading-relaxed line-clamp-3">"{message.text}"</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </InsightList>
          )}

          {activeInsightTab === 'actions' && (
            <InsightList title="Action Items" icon={CheckSquare}>
              {actions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No action items were detected.</p>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {actions.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-2.5">
                      <p className="text-[12px] font-semibold text-slate-800">{item.task}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        <span>{item.assignee || 'Unassigned'}</span>
                        {item.deadline && <span className="font-mono">· {item.deadline}</span>}
                        <span className={`ml-auto font-semibold ${item.priority === 'High' ? 'text-rose-600' : 'text-slate-400'}`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </InsightList>
          )}

          {activeInsightTab === 'decisions' && (
            <InsightList title="Decisions" icon={ShieldCheck}>
              {decisions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No decisions were logged.</p>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {decisions.map((decision) => (
                    <div key={decision.id} className="rounded-lg border border-slate-200 p-2.5">
                      <p className="text-[12px] font-semibold text-slate-800">{decision.text}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span
                          className={`font-semibold ${
                            decision.status === 'confirmed'
                              ? 'text-emerald-600'
                              : decision.status === 'open'
                                ? 'text-amber-600'
                                : 'text-slate-500'
                          }`}
                        >
                          {decision.status === 'confirmed' ? 'Confirmed' : decision.status === 'open' ? 'Open Debate' : 'Pending'}
                        </span>
                        {decision.category && <span className="text-slate-400">{decision.category}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </InsightList>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2">
            <CircleDot className="w-3.5 h-3.5 text-sky-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Recorded server-side with LiveKit Egress (speaker layout) — captures every participant, not just the local
              device. Click a transcript timestamp to jump to that moment.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
