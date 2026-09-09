import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Play, Download, CircleDot, Loader2, RotateCcw, Videotape, Users, Clock } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { fetchRecordings, formatRecordingDuration, startRoomRecording, RecordingRequestError } from '../services/recordingService';
import { useRecordingPoll } from '../hooks/useRecording';
import type { MeetingRecording } from '../types';
import { getLocalIdentity } from '../services/livekitService';

/**
 * /recordings — cloud meeting recordings (LiveKit Egress → MP4 → object storage).
 * Merges server recording metadata with locally persisted meeting data
 * (participants / titles) and shows real lifecycle status.
 */

interface RecordingCardData extends MeetingRecording {
  participantsCount?: number;
  localMeetingTitle?: string;
}

const StatusBadge: React.FC<{ recording: MeetingRecording }> = ({ recording }) => {
  if (recording.status === 'ready') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Recording Ready
      </span>
    );
  }
  if (recording.status === 'processing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
        <Loader2 className="w-3 h-3 animate-spin" />
        Processing recording…
      </span>
    );
  }
  if (recording.status === 'recording' || recording.status === 'starting') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        {recording.status === 'starting' ? 'Recording starting…' : 'Recording in progress'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
      <span className="w-2 h-2 rounded-full bg-rose-500" />
      Recording failed
    </span>
  );
};

const RecordingCard: React.FC<{ recording: RecordingCardData; onRetry: (rec: MeetingRecording) => void }> = ({
  recording,
  onRetry,
}) => {
  const navigate = useNavigate();
  const live = useRecordingPoll(recording);
  const rec = live ?? recording;

  const dateLabel = rec.startedAt
    ? new Date(rec.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col gap-3.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold font-display text-slate-900 truncate">
            {rec.meetingTitle || 'Live Meeting'}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span>{dateLabel}</span>
            <span>·</span>
            <span className="font-mono inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {rec.duration ? formatRecordingDuration(rec.duration) : '—'}
            </span>
          </div>
        </div>
        <span className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
          <Videotape className="w-4 h-4" />
        </span>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <Users className="w-3.5 h-3.5 text-slate-400" />
        {rec.participantsCount ? `${rec.participantsCount} participants` : 'Participants in meeting view'}
      </div>

      <StatusBadge recording={rec} />

      {rec.status === 'failed' && (
        <button
          onClick={() => onRetry(rec)}
          className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Retry
        </button>
      )}

      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2">
        <button
          disabled={rec.status !== 'ready' || !rec.fileUrl}
          onClick={() => navigate(`/recordings/${rec.id}`)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          Play
        </button>
        <a
          href={rec.fileUrl || undefined}
          download
          aria-disabled={!rec.fileUrl}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
            rec.fileUrl
              ? 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50 cursor-pointer'
              : 'text-slate-400 bg-slate-50 border-slate-200 pointer-events-none'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </a>
      </div>
    </motion.div>
  );
};

export const Recordings: React.FC = () => {
  const meetings = useAppStore((s) => s.meetings);
  const addToast = useAppStore((s) => s.addToast);
  const updateMeeting = useAppStore((s) => s.updateMeeting);
  const [serverRecordings, setServerRecordings] = React.useState<MeetingRecording[] | null>(null);
  const [isRetrying, setIsRetrying] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const list = await fetchRecordings();
    setServerRecordings((prev) => {
      // Merge any locally-known recordings (metadata attached at meeting end)
      // that the server list might be missing (e.g. after a server restart).
      const localOnly: MeetingRecording[] = meetings
        .filter((m) => m.recording && m.recording.id)
        .map((m) => m.recording!)
        .filter((r) => !list.some((s) => s.id === r.id));
      return [...list, ...localOnly];
    });

    // Keep localStorage meeting metadata in sync with server statuses.
    for (const rec of list) {
      const meeting = meetings.find((m) => m.recording?.id === rec.id || m.id === rec.meetingId);
      if (meeting && meeting.recording && meeting.recording.status !== rec.status) {
        updateMeeting(meeting.id, { recording: { ...meeting.recording, ...rec } });
      }
    }
  }, [meetings, updateMeeting]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Poll while any recording is still processing.
  const hasPending = Boolean(
    serverRecordings?.some((r) => r.status === 'starting' || r.status === 'recording' || r.status === 'processing')
  );
  React.useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(() => void load(), 8000);
    return () => clearInterval(timer);
  }, [hasPending, load]);

  const handleRetry = async (rec: MeetingRecording) => {
    if (isRetrying) return;
    setIsRetrying(rec.id);
    try {
      await startRoomRecording({
        roomName: rec.roomName || '',
        meetingId: rec.meetingId || '',
        meetingTitle: rec.meetingTitle,
        requestedBy: getLocalIdentity(),
      });
      addToast('Recording restarted', 'success');
      void load();
    } catch (err) {
      const message =
        err instanceof RecordingRequestError && err.code === 'not_room_participant'
          ? 'The meeting room is no longer active — a failed recording can only be retried while the meeting is live.'
          : err instanceof Error
            ? err.message
            : 'Retry failed.';
      addToast(message, 'warning');
    } finally {
      setIsRetrying(null);
    }
  };

  const enriched: RecordingCardData[] = (serverRecordings || []).map((rec) => {
    const meeting = meetings.find((m) => m.recording?.id === rec.id || m.id === rec.meetingId);
    return {
      ...rec,
      meetingTitle: rec.meetingTitle || meeting?.title,
      participantsCount: meeting?.participants.length,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
          <CircleDot className="w-3.5 h-3.5 text-sky-600" />
          Cloud Recordings
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
          Meeting Recordings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Server-side LiveKit Egress recordings — full room video and audio, stored as MP4 in cloud object storage.
        </p>
      </div>

      {serverRecordings === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 h-56 animate-pulse" />
          ))}
        </div>
      ) : enriched.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-[#006194]">
            <Videotape className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-display">No recordings yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Start a Live Meeting — MeetFlow automatically records the full room (all participants + audio) to the cloud.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enriched.map((rec) => (
            <RecordingCard key={rec.id} recording={rec} onRetry={(r) => void handleRetry(r)} />
          ))}
        </div>
      )}
    </motion.div>
  );
};
