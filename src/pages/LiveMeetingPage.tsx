import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Room, RoomEvent, RemoteParticipant, Track, type TranscriptionSegment } from 'livekit-client';
import { LiveKitRoom, useRoomContext, useLocalParticipant, useParticipants, RoomAudioRenderer } from '@livekit/components-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radio,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Copy,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Send,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
} from 'lucide-react';
import type { ActionItem, Decision, Meeting, TranscriptMessage } from '../types';
import { useAppStore } from '../store/appStore';
import {
  useLiveMeetingStore,
  formatDuration,
} from '../store/liveMeetingStore';
import { fetchLiveKitToken, getLocalIdentity, probeLiveKitStatus, type LiveKitTokenResponse } from '../services/livekitService';
import { startRoomRecording, stopRoomRecording, fetchRecording, probeRecordingStatus } from '../services/recordingService';
import { formatMeetingDate, formatMeetingTime } from '../utils/dateTime';
import { getPersona, LIVE_PERSONAS, hasActionOrDecisionIntent, isTrivialBanter } from '../services/liveAiService';
import { startTranscriptSimulator, toTranscriptPayload, type SimulatorHandle } from '../services/transcriptSimulator';
import { type ProcessingStep } from '../services/aiService';
import { MeetingStatusBar } from '../components/live/MeetingStatusBar';
import { ControlBar } from '../components/live/ControlBar';
import { VideoStage } from '../components/live/VideoStage';
import { MockVideoStage } from '../components/live/MockVideoStage';
import { AiInsightsPanel } from '../components/live/AiInsightsPanel';
import { StageOverlays, type ChatMessage } from '../components/live/StageOverlays';
import { EndMeetingModal } from '../components/live/EndMeetingModal';
import { FinalAnalysisOverlay } from '../components/live/FinalAnalysisOverlay';
import { EmojiReactionsOverlay, playReactionPop } from '../components/live/EmojiReactions';

const FINAL_STEPS: { id: number; label: string }[] = [
  { id: 1, label: 'Stopping cloud recording (Egress)' },
  { id: 2, label: 'Disconnecting from LiveKit room' },
  { id: 3, label: 'Saving final transcript' },
  { id: 4, label: 'Running final AI analysis with Gemini' },
  { id: 5, label: 'Extracting normalized action items' },
  { id: 6, label: 'Detecting decisions & open discussions' },
  { id: 7, label: 'Generating executive synthesis' },
];

function wordSimilarity(a: string, b: string): number {
  const stop = new Set(['the', 'a', 'an', 'and', 'to', 'of', 'for', 'on', 'in', 'by', 'our', 'my']);
  const words = (text: string) => new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !stop.has(w)));
  const setA = words(a);
  const setB = words(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  setA.forEach((w) => {
    if (setB.has(w)) shared += 1;
  });
  return shared / Math.max(setA.size, setB.size);
}

function mergeActionItems(live: ActionItem[], analyzed: ActionItem[]): ActionItem[] {
  const merged = [...live];
  for (const item of analyzed) {
    const duplicate = live.some(
      (l) =>
        (l.assignee && item.assignee && l.assignee === item.assignee && wordSimilarity(l.task, item.task) > 0.35) ||
        wordSimilarity(l.task, item.task) > 0.6
    );
    if (!duplicate) merged.push(item);
  }
  return merged;
}

function mergeDecisions(live: Decision[], analyzed: Decision[]): Decision[] {
  const merged = [...live];
  for (const item of analyzed) {
    const duplicate = live.some((l) => wordSimilarity(l.text, item.text) > 0.4);
    if (!duplicate) merged.push(item);
  }
  return merged;
}

// -------------------------------------------------------------
// Pre-Meeting Lobby Screen
// -------------------------------------------------------------
interface LobbyScreenProps {
  roomName: string;
  initialName: string;
  onJoin: (displayName: string, wantCamera: boolean, wantMic: boolean) => void;
}

const PreMeetingLobby: React.FC<LobbyScreenProps> = ({ roomName, initialName, onJoin }) => {
  const [displayName, setDisplayName] = React.useState(initialName);
  const [isCameraActive, setIsCameraActive] = React.useState(true);
  const [isMicActive, setIsMicActive] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const [serverMode, setServerMode] = React.useState<'live' | 'demo' | 'checking'>('checking');
  const [recordingReady, setRecordingReady] = React.useState<'ready' | 'unavailable' | 'checking'>('checking');
  const videoPreviewRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const scheduledMeeting = useAppStore((s) =>
    s.scheduledMeetings.find((m) => m.roomId === roomName)
  );

  const shareUrl = `${window.location.origin}/live-meeting/${roomName}`;

  React.useEffect(() => {
    void probeLiveKitStatus().then(setServerMode);
    void probeRecordingStatus().then((status) => setRecordingReady(status.configured ? 'ready' : 'unavailable'));
  }, []);

  // Initialize preview stream
  React.useEffect(() => {
    let active = true;

    async function startPreview() {
      try {
        // Video preview only in lobby: NEVER capture audio in the lobby to prevent
        // Android / mobile Chrome microphone hardware locks before LiveKit connects.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isCameraActive ? true : false,
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera/Mic preview not available:', err);
      }
    }

    void startPreview();

    return () => {
      active = false;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          t.stop();
          t.enabled = false;
        });
        streamRef.current = null;
      }
    };
  }, [isCameraActive, isMicActive]);

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = displayName.trim() || 'Alex Mercer';
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        t.stop();
        t.enabled = false;
      });
      streamRef.current = null;
    }
    onJoin(finalName, isCameraActive, isMicActive);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#006194] flex items-center justify-center text-white font-bold text-lg shadow-md">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-800">
                  MEETFLOW AI
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5" />
                  Live Meeting
                </span>
              </div>
              <h1 className="text-xl font-bold font-display text-slate-100 mt-1">
                {scheduledMeeting?.title || 'Meeting Lobby'}
              </h1>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono text-slate-400">Room Code</span>
            <div className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              {roomName}
            </div>
          </div>
        </div>

        {/* Scheduled Meeting Info Banner */}
        {scheduledMeeting && (
          <div className="bg-sky-950/40 border border-sky-800/60 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-sky-200">
                Scheduled Meeting: {scheduledMeeting.title}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-sky-300/80 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatMeetingDate(scheduledMeeting.scheduledStart)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatMeetingTime(scheduledMeeting.scheduledStart)} ({scheduledMeeting.durationMinutes} min)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                You are in the lobby. Test your camera and microphone below, then click Join Meeting when ready.
              </p>
            </div>
          </div>
        )}

        {/* Shareable Link Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase font-mono text-[10px] text-slate-400">Shareable Meeting Link</span>
            <span className="text-[11px] text-slate-500">Invite anyone to join this room</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 min-w-0 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={copyMeetingLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Camera Preview Tile */}
        <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
          {isCameraActive ? (
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <VideoOff className="w-8 h-8" />
              <span className="text-xs font-mono">Camera is turned off</span>
            </div>
          )}

          {/* Quick toggle controls over video */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 shadow-lg">
            <button
              type="button"
              onClick={() => setIsMicActive((v) => !v)}
              className={`p-2 rounded-full transition-colors ${
                isMicActive ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-600 text-white'
              }`}
              title={isMicActive ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsCameraActive((v) => !v)}
              className={`p-2 rounded-full transition-colors ${
                isCameraActive ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-600 text-white'
              }`}
              title={isCameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isCameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Readiness Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase">LiveKit</div>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ready
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Camera</div>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {isCameraActive ? 'Ready' : 'Off'}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Microphone</div>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {isMicActive ? 'Ready' : 'Off'}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Cloud Recording</div>
            <div
              className={`flex items-center justify-center gap-1.5 mt-1 text-xs font-semibold ${
                recordingReady === 'ready' ? 'text-emerald-400' : recordingReady === 'unavailable' ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  recordingReady === 'ready' ? 'bg-emerald-400' : recordingReady === 'unavailable' ? 'bg-amber-400' : 'bg-slate-500'
                }`}
              />
              {recordingReady === 'ready' ? 'Ready' : recordingReady === 'unavailable' ? 'Not set up' : 'Checking…'}
            </div>
          </div>
        </div>

        {/* Name input & Join Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
              Your Name / Display Identity
            </label>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Rahul Patel or Amit Shah"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={!displayName.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-md"
          >
            <span>Join Meeting</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// -------------------------------------------------------------
// Connecting Screen
// -------------------------------------------------------------
const ConnectingScreen: React.FC<{ roomName: string; demoReason?: string | null }> = ({ roomName, demoReason }) => (
  <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-5 text-center px-6">
    <div className="relative">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#006194] flex items-center justify-center text-white font-bold text-xl shadow-lg animate-pulse">
        M
      </div>
    </div>
    <div>
      <h1 className="text-lg font-display font-bold text-slate-100">Connecting to live room…</h1>
      <p className="text-xs font-mono text-slate-500 mt-1">room: {roomName}</p>
    </div>
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <span className="w-4 h-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
      Requesting secure participant token…
    </div>
    {demoReason && <p className="text-[11px] text-amber-400/80 max-w-sm">{demoReason}</p>}
  </div>
);

// -------------------------------------------------------------
// Meeting Shell & Real-Time Intelligence
// -------------------------------------------------------------
interface StagePanelsState {
  isChatOpen: boolean;
  isPeopleOpen: boolean;
  chatUnread: number;
  demoChatMessages: ChatMessage[];
}

interface MeetingShellProps extends StagePanelsState {
  mode: 'live' | 'demo';
  roomName: string;
  title: string;
  connection: 'connected' | 'reconnecting' | 'disconnected' | 'demo';
  aiStatus: 'listening' | 'analyzing' | 'idle';
  stage: React.ReactNode;
  controls: React.ReactNode;
  onEndMeeting: () => void;
  onToggleChat: () => void;
  onTogglePeople: () => void;
  onCloseChat: () => void;
  onClosePeople: () => void;
  onChatActivity: () => void;
  onDemoChatSend: (text: string) => void;
  onSimulateSpeech?: (text: string, speakerName?: string) => void;
}

const MeetingShell: React.FC<MeetingShellProps> = ({
  mode,
  roomName,
  title,
  connection,
  aiStatus,
  stage,
  controls,
  onEndMeeting,
  onToggleChat,
  onTogglePeople,
  onCloseChat,
  onClosePeople,
  onChatActivity,
  onDemoChatSend,
  onSimulateSpeech,
  isChatOpen,
  isPeopleOpen,
  chatUnread,
  demoChatMessages,
}) => {
  const roster = useLiveMeetingStore((s) => s.roster);
  const localName = useLiveMeetingStore((s) => s.localName);
  const [speechInput, setSpeechInput] = React.useState('');

  const submitManualSpeech = (text: string, speaker?: string) => {
    if (!text.trim() || !onSimulateSpeech) return;
    onSimulateSpeech(text.trim(), speaker || localName);
    setSpeechInput('');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <MeetingStatusBar
        roomName={roomName}
        title={title}
        participantCount={Math.max(roster.length, 1)}
        connection={connection}
        mode={mode}
        aiStatus={aiStatus}
        onEndMeeting={onEndMeeting}
      />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row w-full h-full">
        <div className="relative flex-1 min-h-[240px] lg:min-h-0 flex flex-col w-full h-full">
          <div className="flex-1 relative min-h-0 w-full h-full">
            {stage}
            <EmojiReactionsOverlay />
            <StageOverlays
              mode={mode}
              isChatOpen={isChatOpen}
              isPeopleOpen={isPeopleOpen}
              onCloseChat={onCloseChat}
              onClosePeople={onClosePeople}
              onChatActivity={onChatActivity}
              demoChatMessages={demoChatMessages}
              onDemoChatSend={onDemoChatSend}
              localName={localName}
            />
          </div>

          {/* Real-time Speech Bar for Live Video & Cross-Browser Verification */}
          {onSimulateSpeech && (
            <div className="bg-slate-900/90 border-t border-slate-800 px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400 shrink-0">
                <span className="font-mono font-semibold text-sky-400">Demo Test:</span>
                <button
                  onClick={() => submitManualSpeech("I'll finish the landing page redesign by Friday.", localName)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 whitespace-nowrap cursor-pointer"
                  title="Demo Test: Click to test action item extraction with this commitment"
                >
                  "Finish landing page by Friday"
                </button>
                <button
                  onClick={() => submitManualSpeech("I will complete the payment API before Wednesday.", localName)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 whitespace-nowrap cursor-pointer"
                  title="Demo Test: Click to test action item extraction with this commitment"
                >
                  "Complete payment API by Wed"
                </button>
                <button
                  onClick={() => submitManualSpeech("We've decided to launch version 2 next Monday.", localName)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 whitespace-nowrap cursor-pointer"
                  title="Demo Test: Click to test decision extraction with this consensus"
                >
                  "Launch v2 next Monday"
                </button>
                <button
                  onClick={() => submitManualSpeech("We should discuss the pricing model again.", localName)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 whitespace-nowrap cursor-pointer"
                  title="Demo Test: Click to test open discussion extraction"
                >
                  "Discuss pricing model"
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-1 max-w-md">
                <input
                  value={speechInput}
                  onChange={(e) => setSpeechInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitManualSpeech(speechInput)}
                  placeholder={`Speak as ${localName}…`}
                  className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-sky-500"
                />
                <button
                  onClick={() => submitManualSpeech(speechInput)}
                  disabled={!speechInput.trim()}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Speak
                </button>
              </div>
            </div>
          )}
        </div>

        <AiInsightsPanel />
      </div>

      {controls}
    </div>
  );
};

// -------------------------------------------------------------
// LiveRoomInner (Inside LiveKit Context)
// -------------------------------------------------------------
interface LiveRoomProps extends Omit<MeetingShellProps, 'stage' | 'controls' | 'mode' | 'connection'> {}

const LiveRoomInner: React.FC<LiveRoomProps> = (props) => {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const participants = useParticipants();
  const localName = useLiveMeetingStore((s) => s.localName);
  const connection = useLiveMeetingStore((s) => s.connection);
  const setRoster = useLiveMeetingStore((s) => s.setRoster);
  const addParticipant = useLiveMeetingStore((s) => s.addParticipant);
  const addToast = useAppStore((s) => s.addToast);

  // Check if participant is a service agent (meetflow-stt)
  const isAgentParticipant = React.useCallback((p: any) => {
    return (
      p?.identity === 'meetflow-stt' ||
      p?.isAgent ||
      p?.name === 'AI Transcript' ||
      p?.identity?.startsWith?.('meetflow-stt') ||
      p?.identity?.startsWith?.('agent-')
    );
  }, []);

  // Sync participant names into store (filtering out service agent)
  React.useEffect(() => {
    const names = participants
      .filter((p) => !p.isLocal && !isAgentParticipant(p))
      .map((p) => p.name || p.identity || 'Guest');
    setRoster([localName, ...names]);
    names.forEach((name) => addParticipant(name));
  }, [participants, localName, setRoster, addParticipant, isAgentParticipant]);

  // Real STT readiness tracking based on agent presence (PART 7)
  React.useEffect(() => {
    if (!room) return;

    const hasAgent = participants.some((p) => isAgentParticipant(p));
    const store = useLiveMeetingStore.getState();

    if (hasAgent) {
      store.setTranscriptStatus('live');
    } else {
      const current = store.transcriptStatus;
      if (current === 'live') {
        store.setTranscriptStatus('reconnecting');
      } else {
        store.setTranscriptStatus('connecting');
      }

      // Automatically retry dispatching agent periodically if not yet joined
      const interval = setInterval(() => {
        const latest = room.remoteParticipants;
        const found = Array.from(latest.values()).some((p) => isAgentParticipant(p));
        if (found) {
          useLiveMeetingStore.getState().setTranscriptStatus('live');
        } else if (room.name) {
          void fetch('/api/livekit/dispatch-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomName: room.name }),
          }).catch(() => {});
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [room, participants, isAgentParticipant]);

  // -----------------------------------------------------------------
  // DECOUPLED LOW-LATENCY REALTIME STT + GEMINI AI BATCH PIPELINE
  // -----------------------------------------------------------------

  // STT tracking map: segmentId -> timestamp when first partial was received
  const sttTimestampsRef = React.useRef<Map<string, number>>(new Map());

  // Decoupled AI Analysis Queue
  const aiQueueRef = React.useRef<TranscriptMessage[]>([]);
  const isAiAnalyzingRef = React.useRef(false);
  const aiQueueTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const aiQueueStartedAtRef = React.useRef<number>(0);
  const hasLoggedAiErrorRef = React.useRef(false);

  // Decoupled AI Queue processing worker (max 1 concurrent Gemini call per meeting)
  const flushAiAnalysisQueue = React.useCallback(async () => {
    if (isAiAnalyzingRef.current) return;
    if (aiQueueRef.current.length === 0) return;

    // Clear debounce timer
    if (aiQueueTimerRef.current) {
      clearTimeout(aiQueueTimerRef.current);
      aiQueueTimerRef.current = null;
    }

    // Take snapshot of current batch and clear queue
    const batch = [...aiQueueRef.current];
    aiQueueRef.current = [];

    // Filter out batches that consist entirely of trivial chatter ("hello", "yes", "can you hear me")
    const hasSubstance = batch.some((m) => !isTrivialBanter(m.text));
    if (!hasSubstance) {
      // Don't fire expensive/slow AI request for pure banter; transcript already saved!
      return;
    }

    const queueDelayMs = aiQueueStartedAtRef.current ? Math.max(0, Date.now() - aiQueueStartedAtRef.current) : 0;
    aiQueueStartedAtRef.current = 0;

    isAiAnalyzingRef.current = true;
    const store = useLiveMeetingStore.getState();
    store.setAiStatus('analyzing');
    const aiStartTime = Date.now();

    try {
      const response = await fetch('/api/ai/analyze-segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utterances: batch,
          context: {
            meetingId: store.meeting.id,
            meetingTitle: store.meeting.title,
            participants: store.roster,
            meetingDate: new Date().toISOString().split('T')[0],
          },
        }),
      });

      const aiResponseMs = Date.now() - aiStartTime;
      console.log(`[AI] queue=${queueDelayMs}ms response=${aiResponseMs}ms`);

      if (response.ok) {
        const analysis = await response.json();
        const latest = useLiveMeetingStore.getState();
        latest.setAiSource(analysis.source === 'gemini' ? 'gemini' : 'fallback');
        hasLoggedAiErrorRef.current = false;

        // Broadcast AI extraction results to peers via DataChannel
        try {
          if (room && room.state === 'connected') {
            const payload = JSON.stringify({ type: 'ai-detection', analysis });
            void room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
          }
        } catch {}

        // Upsert action items (deduplicated by normalized title/assignee in store)
        if (Array.isArray(analysis.actionItems)) {
          analysis.actionItems.forEach((a: any) => {
            latest.upsertActionItem({
              id: a.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              meetingId: latest.meeting.id,
              meetingTitle: latest.meeting.title,
              task: a.title,
              assignee: a.assignee || 'Unassigned',
              deadline: a.deadlineNormalized || a.deadlineText || null,
              originalDeadlinePhrase: a.deadlineText || undefined,
              priority: a.priority || 'Medium',
              confidence: Math.round((a.confidence || 0.95) * 100),
              status: 'todo',
              sourceText: a.sourceText || batch.map((b) => b.text).join(' '),
              isConfirmed: false,
              createdAt: new Date().toISOString().split('T')[0],
            });
          });
        }

        // Upsert decisions (deduplicated by normalized text in store)
        if (Array.isArray(analysis.decisions)) {
          analysis.decisions.forEach((d: any) => {
            latest.upsertDecision({
              id: d.id || `dec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              meetingId: latest.meeting.id,
              meetingTitle: latest.meeting.title,
              text: d.text,
              status: 'confirmed',
              category: d.category || 'Consensus',
              confidence: Math.round((d.confidence || 0.94) * 100),
              sourceText: d.sourceText || batch.map((b) => b.text).join(' '),
              createdAt: new Date().toISOString().split('T')[0],
            });
          });
        }

        // Upsert open discussions
        if (Array.isArray(analysis.openDiscussions)) {
          analysis.openDiscussions.forEach((o: any) => {
            latest.upsertDecision({
              id: o.id || `disc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              meetingId: latest.meeting.id,
              meetingTitle: latest.meeting.title,
              text: o.text,
              status: 'open',
              category: 'Unresolved Debate',
              confidence: Math.round((o.confidence || 0.88) * 100),
              sourceText: o.sourceText || batch.map((b) => b.text).join(' '),
              createdAt: new Date().toISOString().split('T')[0],
            });
          });
        }
      } else {
        console.warn(`[AI] analyze-segment HTTP ${response.status}`);
        useLiveMeetingStore.getState().setAiStatus('error');
      }
    } catch (err) {
      console.warn('[AI] Segment analysis error:', err);
      useLiveMeetingStore.getState().setAiStatus('error');
      if (!hasLoggedAiErrorRef.current) {
        hasLoggedAiErrorRef.current = true;
        // Non-blocking toast: meeting and transcript remain completely functional!
        addToast('AI analysis temporarily delayed — realtime transcript continues', 'warning');
      }
    } finally {
      isAiAnalyzingRef.current = false;
      setTimeout(() => {
        if (useLiveMeetingStore.getState().aiStatus !== 'error') {
          useLiveMeetingStore.getState().setAiStatus('listening');
        }
      }, 1200);

      // Drain queued items that arrived while the current request was in-flight
      if (aiQueueRef.current.length > 0) {
        void flushAiAnalysisQueue();
      }
    }
  }, [room, addToast]);

  // Enqueue utterance with intent-based intelligent debouncing
  const enqueueAiUtterance = React.useCallback(
    (utterance: TranscriptMessage) => {
      if (!aiQueueStartedAtRef.current) {
        aiQueueStartedAtRef.current = Date.now();
      }
      aiQueueRef.current.push(utterance);

      const hasIntent = hasActionOrDecisionIntent(utterance.text);
      const isTrivial = isTrivialBanter(utterance.text);

      if (hasIntent) {
        // High-intent statement ("I'll finish...", "We decided...") -> trigger rapidly (150ms debounce)
        if (aiQueueTimerRef.current) clearTimeout(aiQueueTimerRef.current);
        aiQueueTimerRef.current = setTimeout(() => {
          void flushAiAnalysisQueue();
        }, 150);
      } else if (isTrivial) {
        // Trivial banter ("hi", "can you hear me", "yes") -> wait up to 3500ms for real context
        if (!aiQueueTimerRef.current) {
          aiQueueTimerRef.current = setTimeout(() => {
            void flushAiAnalysisQueue();
          }, 3500);
        }
      } else {
        // Conversational sentence -> trigger in 1800ms, or in 200ms if 2+ sentences accumulated
        if (aiQueueRef.current.length >= 2) {
          if (aiQueueTimerRef.current) clearTimeout(aiQueueTimerRef.current);
          aiQueueTimerRef.current = setTimeout(() => {
            void flushAiAnalysisQueue();
          }, 200);
        } else if (!aiQueueTimerRef.current) {
          aiQueueTimerRef.current = setTimeout(() => {
            void flushAiAnalysisQueue();
          }, 1800);
        }
      }
    },
    [flushAiAnalysisQueue]
  );

  // Commit a final transcript message immediately to the store, broadcast to peers, then enqueue for AI
  const commitFinalTranscript = React.useCallback(
    (text: string, speakerName?: string, isLocal = true, customId?: string) => {
      const cleanText = text.trim();
      if (!cleanText) return;

      const speaker = speakerName || localName;
      const store = useLiveMeetingStore.getState();

      const utterance: TranscriptMessage = {
        id: customId || `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        speaker,
        speakerRole: speaker === localName ? 'Host' : 'Participant',
        text: cleanText,
      };

      // 1. Persist transcript IMMEDIATELY (independent of AI speed/state)
      store.addTranscriptMessage(utterance);
      store.addParticipant(speaker);
      store.setTranscriptStatus('live');
      store.setCurrentInterim(null);

      // 2. Broadcast to LiveKit peers via DataChannel if local
      if (isLocal && room && room.state === 'connected') {
        try {
          const payload = JSON.stringify({ type: 'transcript', message: utterance });
          void room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
        } catch (err) {
          console.warn('LiveKit DataChannel transcript broadcast error:', err);
        }
      }

      // 3. Enqueue into decoupled AI analysis worker
      enqueueAiUtterance(utterance);
    },
    [localName, room, enqueueAiUtterance]
  );

  // 1. LiveKit Realtime Streaming STT Listener (LiveKit Cloud / Agents / Inference)
  React.useEffect(() => {
    if (!room) return;

    const store = useLiveMeetingStore.getState();
    store.setTranscriptStatus('live');

    const handleTranscription = (
      segments: TranscriptionSegment[],
      participant?: any
    ) => {
      const speaker = participant?.name || participant?.identity || localName || 'Unknown Participant';
      const isLocal = participant ? participant.isLocal : true;

      for (const seg of segments) {
        if (!seg.text || !seg.text.trim()) continue;

        const now = Date.now();
        if (!sttTimestampsRef.current.has(seg.id)) {
          sttTimestampsRef.current.set(seg.id, now);
          const firstPartialMs = seg.startTime ? Math.max(0, now - seg.startTime) : 0;
          if (firstPartialMs > 0) {
            console.log(`[STT] firstPartial=${firstPartialMs}ms text="${seg.text.slice(0, 30)}..."`);
          }
        }

        if (seg.final) {
          const firstReceived = sttTimestampsRef.current.get(seg.id) || now;
          const finalLatencyMs = Math.max(0, now - firstReceived);
          console.log(`[STT] final=${finalLatencyMs}ms speaker="${speaker}" text="${seg.text.slice(0, 40)}"`);
          sttTimestampsRef.current.delete(seg.id);

          commitFinalTranscript(seg.text, speaker, isLocal, seg.id);
        } else {
          // Interim result: update temporary utterance in store without adding duplicate rows
          useLiveMeetingStore.getState().setCurrentInterim({
            id: seg.id,
            speaker,
            text: seg.text,
            participantId: participant?.identity,
          });

          // Optional: broadcast interim speech to remote peers so they see live typing
          if (isLocal && room && room.state === 'connected') {
            try {
              const payload = JSON.stringify({
                type: 'interim-transcript',
                speaker,
                text: seg.text,
                id: seg.id,
              });
              void room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: false });
            } catch {}
          }
        }
      }
    };

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    return () => {
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
      if (aiQueueTimerRef.current) {
        clearTimeout(aiQueueTimerRef.current);
      }
    };
  }, [room, localName, commitFinalTranscript]);

  // 2. LiveKit DataChannel / Text Stream Listener (topic 'lk.transcription' + peer sync)
  React.useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: any,
      topic?: string
    ) => {
      try {
        const raw = new TextDecoder().decode(payload);
        const json = JSON.parse(raw);

        // Handle agent ready confirmation
        if (json.type === 'stt-agent-ready') {
          useLiveMeetingStore.getState().setTranscriptStatus('live');
          console.log('[MeetFlow STT] STT Agent ready confirmed in room:', json);
          return;
        }

        // Handle LiveKit text streams / agent transcription on topic 'lk.transcription'
        if (topic === 'lk.transcription' || topic === 'transcription' || json.type === 'lk.transcription') {
          const speaker =
            json.speaker ||
            json.participantName ||
            json.participantIdentity ||
            participant?.name ||
            participant?.identity ||
            'Unknown Participant';
          const text = (json.text || '').trim();
          if (!text) return;

          const isFinal = Boolean(json.final || json.isFinal);
          if (isFinal) {
            commitFinalTranscript(text, speaker, false, json.id);
          } else {
            useLiveMeetingStore.getState().setCurrentInterim({
              id: json.id || `interim-${speaker}`,
              speaker,
              text,
              participantId: participant?.identity,
            });
          }
          return;
        }

        // Handle peer-broadcasted final transcript
        if (json.type === 'transcript' && json.message) {
          const store = useLiveMeetingStore.getState();
          store.addTranscriptMessage(json.message);
          store.addParticipant(json.message.speaker);
          store.setCurrentInterim(null);
          // Enqueue into AI queue (store deduplicates actions/decisions across peers)
          enqueueAiUtterance(json.message);
        } else if (json.type === 'interim-transcript' && json.speaker && json.text) {
          // Remote peer interim typing/speech
          useLiveMeetingStore.getState().setCurrentInterim({
            id: json.id || `interim-${json.speaker}`,
            speaker: json.speaker,
            text: json.text,
          });
        } else if (json.type === 'ai-detection' && json.analysis) {
          // Remote peer broadcasted AI results
          const store = useLiveMeetingStore.getState();
          store.setAiSource(json.analysis.source === 'gemini' ? 'gemini' : 'fallback');

          if (Array.isArray(json.analysis.actionItems)) {
            json.analysis.actionItems.forEach((a: any) => {
              store.upsertActionItem({
                id: a.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                meetingId: store.meeting.id,
                meetingTitle: store.meeting.title,
                task: a.title,
                assignee: a.assignee || 'Unassigned',
                deadline: a.deadlineNormalized || a.deadlineText || null,
                originalDeadlinePhrase: a.deadlineText || undefined,
                priority: a.priority || 'Medium',
                confidence: Math.round((a.confidence || 0.95) * 100),
                status: 'todo',
                sourceText: a.sourceText,
                isConfirmed: false,
                createdAt: new Date().toISOString().split('T')[0],
              });
            });
          }
          if (Array.isArray(json.analysis.decisions)) {
            json.analysis.decisions.forEach((d: any) => {
              store.upsertDecision({
                id: d.id || `dec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                meetingId: store.meeting.id,
                meetingTitle: store.meeting.title,
                text: d.text,
                status: 'confirmed',
                category: d.category || 'Consensus',
                confidence: Math.round((d.confidence || 0.94) * 100),
                sourceText: d.sourceText,
                createdAt: new Date().toISOString().split('T')[0],
              });
            });
          }
          if (Array.isArray(json.analysis.openDiscussions)) {
            json.analysis.openDiscussions.forEach((o: any) => {
              store.upsertDecision({
                id: o.id || `disc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                meetingId: store.meeting.id,
                meetingTitle: store.meeting.title,
                text: o.text,
                status: 'open',
                category: 'Unresolved Debate',
                confidence: Math.round((o.confidence || 0.88) * 100),
                sourceText: o.sourceText,
                createdAt: new Date().toISOString().split('T')[0],
              });
            });
          }
        }
        if (json.type === 'reaction' && json.emoji) {
          const senderName = json.sender || participant?.name || participant?.identity || 'Guest';
          useLiveMeetingStore.getState().addReaction({
            id: json.id,
            emoji: json.emoji,
            sender: senderName,
          });
          playReactionPop();
          return;
        }
      } catch (e) {
        console.warn('Error handling DataChannel message:', e);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, commitFinalTranscript, enqueueAiUtterance]);

  // Auto-enable camera if not yet on
  React.useEffect(() => {
    if (!localParticipant) return;
    const timer = setTimeout(() => {
      if (!localParticipant.isCameraEnabled) {
        localParticipant.setCameraEnabled(true).catch((e) => {
          console.warn('[MeetFlow] Initial camera auto-activation:', e);
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localParticipant]);

  const handleToggleCamera = React.useCallback(async () => {
    try {
      const target = !localParticipant.isCameraEnabled;
      if (target) {
        await localParticipant.setCameraEnabled(true).catch(async (e) => {
          console.warn('[MeetFlow] Retrying camera enable with fallback constraints:', e);
          return await localParticipant.setCameraEnabled(true);
        });
        addToast('Camera turned on', 'success');
      } else {
        await localParticipant.setCameraEnabled(false);
        addToast('Camera turned off', 'info');
      }
    } catch (err: any) {
      console.error('[MeetFlow] Camera toggle error:', err);
      addToast(`Camera error: ${err?.message || 'Could not toggle camera'}`, 'error');
    }
  }, [localParticipant, addToast]);

  const handleToggleMic = React.useCallback(async () => {
    try {
      const target = !localParticipant.isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(target);
      addToast(target ? 'Microphone unmuted' : 'Microphone muted', target ? 'success' : 'info');
    } catch (err: any) {
      console.error('[MeetFlow] Microphone toggle error:', err);
      addToast(`Microphone error: ${err?.message || 'Could not toggle microphone'}`, 'error');
    }
  }, [localParticipant, addToast]);

  const handleToggleScreenShare = React.useCallback(async () => {
    try {
      const target = !isScreenShareEnabled;
      await localParticipant.setScreenShareEnabled(target);
      addToast(target ? 'Screen sharing started' : 'Screen sharing stopped', target ? 'success' : 'info');
    } catch (err: any) {
      console.error('[MeetFlow] Screen share toggle error:', err);
      addToast(`Screen share error: ${err?.message || 'Could not toggle screen share'}`, 'error');
    }
  }, [localParticipant, isScreenShareEnabled, addToast]);

  const handleSendReaction = React.useCallback(
    (emoji: string) => {
      useLiveMeetingStore.getState().addReaction({
        emoji,
        sender: localName,
      });
      playReactionPop();

      if (room && room.localParticipant) {
        try {
          const payload = JSON.stringify({
            type: 'reaction',
            emoji,
            sender: localName,
            id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          });
          const encoder = new TextEncoder();
          void room.localParticipant.publishData(encoder.encode(payload), {
            reliable: false,
            topic: 'reaction',
          });
        } catch (err) {
          console.warn('[MeetFlow Reaction] Broadcast error:', err);
        }
      }
    },
    [room, localName]
  );

  return (
    <MeetingShell
      {...props}
      mode="live"
      connection={connection}
      stage={<VideoStage onTurnOnCamera={handleToggleCamera} />}
      onSimulateSpeech={commitFinalTranscript}
      controls={
        <ControlBar
          mode="live"
          isMicOn={isMicrophoneEnabled}
          isCameraOn={isCameraEnabled}
          isScreenSharing={isScreenShareEnabled}
          isChatOpen={props.isChatOpen}
          isPeopleOpen={props.isPeopleOpen}
          chatUnread={props.chatUnread}
          onToggleMic={handleToggleMic}
          onToggleCamera={handleToggleCamera}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleChat={props.onToggleChat}
          onTogglePeople={props.onTogglePeople}
          onEndMeeting={props.onEndMeeting}
          onSendReaction={handleSendReaction}
        />
      }
    />
  );
};

// -------------------------------------------------------------
// Main LiveMeetingPage Export
// -------------------------------------------------------------
export const LiveMeetingPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const addToast = useAppStore((s) => s.addToast);

  const phase = useLiveMeetingStore((s) => s.phase);
  const mode = useLiveMeetingStore((s) => s.mode);
  const aiStatus = useLiveMeetingStore((s) => s.aiStatus);
  const meeting = useLiveMeetingStore((s) => s.meeting);
  const localName = useLiveMeetingStore((s) => s.localName);
  const recording = useLiveMeetingStore((s) => s.recording);
  const demoIsMicOn = useLiveMeetingStore((s) => s.isMicOn);
  const demoIsCameraOn = useLiveMeetingStore((s) => s.isCameraOn);
  const demoIsScreenSharing = useLiveMeetingStore((s) => s.isScreenSharing);

  // Lobby & Join state
  const storedUserName = typeof window !== 'undefined' ? localStorage.getItem('meetflow_user_name') : null;
  const initialParticipantName = storedUserName || 'Rahul Patel';
  const [hasJoined, setHasJoined] = React.useState(searchParams.get('joined') === 'true');

  const [tokenResponse, setTokenResponse] = React.useState<LiveKitTokenResponse | null>(null);
  const [demoFallbackReason, setDemoFallbackReason] = React.useState<string | null>(null);
  const [endModalOpen, setEndModalOpen] = React.useState(false);
  const [finalSteps, setFinalSteps] = React.useState<ProcessingStep[] | null>(null);

  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = React.useState(false);
  const [chatUnread, setChatUnread] = React.useState(0);
  const [demoChatMessages, setDemoChatMessages] = React.useState<ChatMessage[]>([]);

  const simulatorRef = React.useRef<SimulatorHandle | null>(null);
  const transcriptSeqRef = React.useRef(0);
  const initializedRoomRef = React.useRef<string | null>(null);
  const endingRef = React.useRef(false);
  const connectedRef = React.useRef(false);
  const recordingStartRef = React.useRef(false);

  const roomName = (roomId || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const roomInstance = React.useMemo(() => new Room({ adaptiveStream: true, dynacast: true }), []);

  const [preferredCamera, setPreferredCamera] = React.useState(true);
  const [preferredMic, setPreferredMic] = React.useState(true);

  // Handle joining from Lobby
  const handleJoinFromLobby = (chosenName: string, wantCamera = true, wantMic = true) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('meetflow_user_name', chosenName);
    }
    setPreferredCamera(wantCamera);
    setPreferredMic(wantMic);
    useLiveMeetingStore.setState({ localName: chosenName, isCameraOn: wantCamera, isMicOn: wantMic });
    setHasJoined(true);
  };

  // 1. Initialize meeting + token request once joined
  React.useEffect(() => {
    if (!roomName) {
      navigate('/live-meeting', { replace: true });
      return;
    }
    if (!hasJoined) return;

    const store = useLiveMeetingStore.getState();
    const isResume = store.meeting.roomName === roomName && store.phase !== 'idle' && store.phase !== 'ended';

    const participantIdentity = getLocalIdentity();
    const currentName = store.localName || initialParticipantName;

    if (!isResume && initializedRoomRef.current !== roomName) {
      initializedRoomRef.current = roomName;
      const scheduled = useAppStore.getState().scheduledMeetings.find(
        (m) => m.roomId === roomName
      );
      const title =
        searchParams.get('title') ||
        scheduled?.title ||
        `Live Meeting · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      store.startMeeting({ roomName, title, identity: participantIdentity, name: currentName });
    }

    let cancelled = false;
    void fetchLiveKitToken({ room: roomName, identity: participantIdentity, name: currentName }).then(
      (response) => {
        if (cancelled) return;
        setTokenResponse(response);
        const s = useLiveMeetingStore.getState();
        s.setMode(response.mode);
        if (response.mode === 'live') {
          // Explicitly ensure STT agent is dispatched to this meeting room
          void fetch('/api/livekit/dispatch-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room: roomName }),
          }).catch(() => {});
        }
        if (response.mode === 'demo') {
          setDemoFallbackReason(response.reason || 'LiveKit server not configured.');
          s.setConnection('demo');
        }
        s.setPhase('live');
      }
    );

    return () => {
      cancelled = true;
    };
  }, [roomName, hasJoined, navigate, searchParams, initialParticipantName]);

  // 2. Meeting duration ticker
  React.useEffect(() => {
    if (phase !== 'live') return;
    const timer = setInterval(() => useLiveMeetingStore.getState().tick(), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // -----------------------------------------------------------------
  // SERVER-SIDE EGRESS RECORDING (LiveKit → Egress → MP4 → Cloud storage)
  // Started automatically when the real LiveKit room connects IF AND ONLY IF
  // the server has cloud storage (S3/R2) configured. If unconfigured, recording
  // is skipped gracefully without warning toasts or marking the meeting as failed.
  // -----------------------------------------------------------------
  const attemptStartRecording = React.useCallback(async (isRetry = false) => {
    const store = useLiveMeetingStore.getState();
    if (!roomName || store.mode !== 'live') return;
    if (!isRetry && recordingStartRef.current) return;
    recordingStartRef.current = true;

    try {
      // 1. Safe probe first: do not trigger egress or error toasts if storage is unconfigured
      const probe = await probeRecordingStatus().catch(() => ({ configured: false }));
      if (!probe.configured) {
        console.info('[MeetFlow Recording] Server cloud storage not configured; auto-recording skipped.');
        if (isRetry) {
          addToast('Cloud recording is not configured on this server (S3/R2 credentials required).', 'info');
        }
        return;
      }

      // 2. Start room recording
      const result = await startRoomRecording({
        roomName,
        meetingId: store.meeting.id,
        meetingTitle: store.meeting.title,
        requestedBy: getLocalIdentity(),
      });
      useLiveMeetingStore.getState().setRecording({
        id: result.recordingId,
        egressId: result.egressId,
        meetingId: store.meeting.id,
        meetingTitle: store.meeting.title,
        roomName,
        status: result.status || 'starting',
        startedAt: result.startedAt || new Date().toISOString(),
        storageProvider: 'cloud',
      });
      if (isRetry) {
        addToast('Recording restarted', 'success');
      }
    } catch (err: any) {
      recordingStartRef.current = false;
      const isUnconfigured =
        err?.code === 'storage_not_configured' ||
        err?.message?.includes('storage is not configured') ||
        err?.message?.includes('RECORDING_S3');

      if (isUnconfigured) {
        console.info('[MeetFlow Recording] Recording storage unconfigured; skipping recording.');
        if (isRetry) {
          addToast('Cloud recording is not configured on this server.', 'info');
        }
        return;
      }

      console.warn('[MeetFlow Recording] Recording start failure:', err);
      if (isRetry) {
        useLiveMeetingStore.getState().setRecording({
          id: `failed-${Date.now()}`,
          egressId: '',
          meetingId: store.meeting.id,
          meetingTitle: store.meeting.title,
          roomName,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Recording could not be started.',
        });
        addToast('Recording could not be started.', 'warning');
      }
    }
  }, [roomName, addToast]);

  // Poll recording lifecycle while the meeting is live (starting → recording).
  React.useEffect(() => {
    if (phase !== 'live') return;
    const timer = setInterval(async () => {
      const store = useLiveMeetingStore.getState();
      const rec = store.recording;
      if (!rec || !rec.id || rec.id.startsWith('failed-')) return;
      if (rec.status !== 'starting' && rec.status !== 'recording') return;
      try {
        const fresh = await fetchRecording(rec.id);
        const current = useLiveMeetingStore.getState().recording;
        if (current && current.id === fresh.id && fresh.status !== current.status) {
          useLiveMeetingStore.getState().setRecording({ ...fresh });
          if (fresh.status === 'failed') {
            addToast('Recording failed. The meeting continues — transcript and AI are unaffected.', 'warning');
          }
        }
      } catch {
        // transient — keep polling
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [phase, addToast]);

  // 3. Demo Mode simulator fallback ONLY when mode === 'demo'
  React.useEffect(() => {
    if (phase !== 'live' || mode !== 'demo') return;

    const roster = [localName, ...LIVE_PERSONAS.filter((p) => p.name !== localName).map((p) => p.name)];
    useLiveMeetingStore.getState().setRoster(roster);
    roster.forEach((name) => useLiveMeetingStore.getState().addParticipant(name));

    const simulator = startTranscriptSimulator({
      onUtterance: (utterance) => {
        const store = useLiveMeetingStore.getState();
        transcriptSeqRef.current += 1;
        const payload = toTranscriptPayload(utterance, transcriptSeqRef.current);
        const message: TranscriptMessage = { ...payload };
        store.addTranscriptMessage(message);
        store.addParticipant(payload.speaker);
        store.setAiStatus('analyzing');

        void fetch('/api/ai/analyze-segment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            utterances: [message],
            context: { meetingId: store.meeting.id, meetingTitle: store.meeting.title },
          }),
        })
          .then((r) => {
            if (!r.ok) throw new Error(`analyze-segment failed (HTTP ${r.status})`);
            return r.json();
          })
          .then((analysis) => {
            const latest = useLiveMeetingStore.getState();
            latest.setAiSource(analysis.source === 'gemini' ? 'gemini' : 'fallback');
            if (Array.isArray(analysis.actionItems)) {
              analysis.actionItems.forEach((a: any) =>
                latest.upsertActionItem({
                  id: a.id || `act-${Date.now()}`,
                  meetingId: latest.meeting.id,
                  task: a.title,
                  assignee: a.assignee || 'Unassigned',
                  deadline: a.deadlineNormalized || a.deadlineText,
                  originalDeadlinePhrase: a.deadlineText,
                  priority: a.priority || 'Medium',
                  confidence: Math.round((a.confidence || 0.95) * 100),
                  status: 'todo',
                  isConfirmed: false,
                })
              );
            }
            if (Array.isArray(analysis.decisions)) {
              analysis.decisions.forEach((d: any) =>
                latest.upsertDecision({
                  id: d.id || `dec-${Date.now()}`,
                  meetingId: latest.meeting.id,
                  text: d.text,
                  status: 'confirmed',
                  category: d.category || 'Consensus',
                  confidence: Math.round((d.confidence || 0.94) * 100),
                })
              );
            }
            if (Array.isArray(analysis.openDiscussions)) {
              analysis.openDiscussions.forEach((o: any) =>
                latest.upsertDecision({
                  id: o.id || `disc-${Date.now()}`,
                  meetingId: latest.meeting.id,
                  text: o.text,
                  status: 'open',
                  category: 'Unresolved Debate',
                  confidence: Math.round((o.confidence || 0.88) * 100),
                })
              );
            }
            setTimeout(() => useLiveMeetingStore.getState().setAiStatus('listening'), 1800);
          })
          .catch((err) => {
            console.warn('Demo-mode AI segment analysis error:', err);
            useLiveMeetingStore.getState().setAiStatus('error');
            setTimeout(() => useLiveMeetingStore.getState().setAiStatus('listening'), 1800);
          });
      },
    });

    simulatorRef.current = simulator;
    return () => {
      simulator.stop();
      simulatorRef.current = null;
    };
  }, [phase, mode, localName]);

  // 4. Panel helpers
  const toggleChat = () => {
    setIsChatOpen((open) => {
      if (!open) setChatUnread(0);
      return !open;
    });
  };
  const togglePeople = () => setIsPeopleOpen((open) => !open);
  const handleChatActivity = React.useCallback(() => {
    setIsChatOpen((open) => {
      if (!open) setChatUnread((n) => n + 1);
      return open;
    });
  }, []);

  const handleDemoChatSend = (text: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setDemoChatMessages((messages) => [
      ...messages,
      { id: `chat-local-${Date.now()}`, from: localName, text, timestamp: now, isLocal: true },
    ]);
  };

  // 5. End Meeting flow (disconnect -> save transcript -> final Gemini analysis -> navigate)
  const confirmEndMeeting = async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    setEndModalOpen(false);
    useLiveMeetingStore.getState().setPhase('ending');
    simulatorRef.current?.stop();

    const store = useLiveMeetingStore.getState();
    const live = store.meeting;

    const steps: ProcessingStep[] = FINAL_STEPS.map((s) => ({ ...s, status: 'waiting' as const }));
    setFinalSteps([...steps]);

    try {
      roomInstance.disconnect();
    } catch {
      // room may already be disconnected
    }

    if (roomName) {
      useAppStore.getState().updateScheduledMeetingStatusByRoom(roomName, 'completed');
    }

    // 0. Stop the server-side Egress recording (asynchronous — the server
    // finalizes/uploads the MP4 in the background; we never block on it).
    // Meeting intelligence (transcript, Gemini) and recording are fully
    // independent subsystems: a failure in one never loses the other.
    const activeRecording = useLiveMeetingStore.getState().recording;
    if (
      activeRecording &&
      activeRecording.egressId &&
      (activeRecording.status === 'starting' || activeRecording.status === 'recording')
    ) {
      void stopRoomRecording({ egressId: activeRecording.egressId, requestedBy: getLocalIdentity() })
        .then((result) => {
          const current = useLiveMeetingStore.getState().recording;
          if (current && current.id === result.recordingId) {
            useLiveMeetingStore.getState().setRecording({
              ...current,
              status: (result.status as any) || 'processing',
            });
          }
        })
        .catch(() => {
          // Guest devices get 403 (only the host may stop) — expected and safe.
          // The host's own stop request already handled the real shutdown.
        });
    }
    const finalRecording = useLiveMeetingStore.getState().recording;

    const setStep = (index: number, status: 'processing' | 'done') => {
      steps[index] = { ...steps[index], status };
      setFinalSteps([...steps]);
    };

    setStep(0, 'processing');
    await new Promise((r) => setTimeout(r, 450));
    setStep(0, 'done');

    setStep(1, 'processing');
    await new Promise((r) => setTimeout(r, 300));
    setStep(1, 'done');

    setStep(2, 'processing');
    const transcriptText = live.transcript
      .map((m) => `${m.speaker}: "${m.text}"`)
      .join('\n');
    await new Promise((r) => setTimeout(r, 400));
    setStep(2, 'done');

    setStep(3, 'processing');
    let analyzed: any = null;
    const elapsedSeconds = useLiveMeetingStore.getState().elapsedSeconds;
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    try {
      const response = await fetch('/api/ai/analyze-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptText || 'Participant: Meeting concluded with all items reviewed.',
          metadata: {
            title: live.title,
            durationMinutes,
            participants: Array.from(new Set(live.participants.length > 0 ? live.participants : [localName])),
            date: new Date().toISOString().split('T')[0],
          },
        }),
      });

      if (response.ok) {
        analyzed = await response.json();
      }
    } catch (e) {
      console.warn('Final meeting synthesis call failed:', e);
    }

    setStep(3, 'done');
    setStep(4, 'done');
    await new Promise((r) => setTimeout(r, 300));
    setStep(5, 'done');
    await new Promise((r) => setTimeout(r, 300));

    setStep(6, 'processing');
    const liveActions = live.actionItems;
    const liveDecisions = live.decisions;
    const confirmedDecisions = liveDecisions.filter((d) => d.status === 'confirmed').length;
    const openDiscussions = liveDecisions.filter((d) => d.status === 'open').length;
    const owners = Array.from(new Set(liveActions.map((a) => a.assignee).filter(Boolean))).slice(0, 3);

    // Provenance of the final analysis — never present fallback as Gemini.
    const analysisEngine =
      analyzed?.source === 'gemini'
        ? 'Gemini (gemini-3.6-flash)'
        : analyzed
          ? 'heuristic fallback (Gemini unavailable)'
          : 'heuristic fallback (analysis endpoint unreachable)';

    const summary =
      (analyzed?.summary ||
        `Executive Synthesis: This live session (${formatDuration(elapsedSeconds)} on LiveKit) captured ${live.transcript.length} transcript segments and produced ${liveActions.length} structured action items, ${confirmedDecisions} confirmed decisions and ${openDiscussions} open discussions. Primary ownership was linked to ${owners.join(', ') || localName}.`) +
      ` Analysis engine: ${analysisEngine}.`;

    const analyzedActions = Array.isArray(analyzed?.actionItems)
      ? analyzed.actionItems.map((a: any) => ({
          id: a.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          meetingId: live.id,
          meetingTitle: live.title,
          task: a.title,
          assignee: a.assignee || 'Unassigned',
          deadline: a.deadlineNormalized || a.deadlineText || null,
          originalDeadlinePhrase: a.deadlineText || undefined,
          priority: a.priority || 'Medium',
          confidence: Math.round((a.confidence || 0.95) * 100),
          status: 'todo',
          sourceText: a.sourceText,
          isConfirmed: false,
          createdAt: new Date().toISOString().split('T')[0],
        }))
      : null;

    const analyzedDecisions = Array.isArray(analyzed?.decisions)
      ? analyzed.decisions.map((d: any) => ({
          id: d.id || `dec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          meetingId: live.id,
          meetingTitle: live.title,
          text: d.text,
          status: 'confirmed' as const,
          category: d.category || 'Consensus',
          confidence: Math.round((d.confidence || 0.94) * 100),
          sourceText: d.sourceText,
          createdAt: new Date().toISOString().split('T')[0],
        }))
      : null;

    const analyzedDiscussions = Array.isArray(analyzed?.openDiscussions)
      ? analyzed.openDiscussions.map((o: any) => ({
          id: o.id || `disc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          meetingId: live.id,
          meetingTitle: live.title,
          text: o.text,
          status: 'open' as const,
          category: 'Unresolved Debate' as const,
          confidence: Math.round((o.confidence || 0.85) * 100),
          sourceText: o.sourceText,
          createdAt: new Date().toISOString().split('T')[0],
        }))
      : [];

    const finalMeeting: Meeting = {
      id: live.id || `meet-${Date.now().toString(36)}`,
      title: analyzed?.title || live.title,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      duration: durationMinutes,
      durationFormatted: `${durationMinutes} mins`,
      participants: Array.from(new Set(live.participants.length > 0 ? live.participants : [localName])),
      participantDetails: Array.from(new Set(live.participants.length > 0 ? live.participants : [localName])).map((name) => ({
        name,
        role: getPersona(name).role || 'Participant',
        avatar: getPersona(name).avatar,
      })),
      transcript: transcriptText,
      transcriptMessages: live.transcript,
      actionItems: analyzedActions ? mergeActionItems(liveActions, analyzedActions) : liveActions,
      decisions:
        analyzedDecisions
          ? mergeDecisions(liveDecisions, [...analyzedDecisions, ...analyzedDiscussions])
          : mergeDecisions(liveDecisions, analyzedDiscussions),
      summary,
      status: 'analyzed',
      platform: 'LiveKit',
      meetingUrl: live.roomName,
      roomId: live.roomName,
      roomName: live.roomName,
      shareUrl: `${window.location.origin}/live-meeting/${live.roomName}`,
      // Real Egress recording metadata (server finishes processing the MP4
      // asynchronously — status here is typically "processing" and is updated
      // by polling from MeetingDetail / Recordings once it turns "ready").
      recording:
        finalRecording && finalRecording.egressId
          ? {
              ...finalRecording,
              meetingId: live.id,
              meetingTitle: analyzed?.title || live.title,
              duration: elapsedSeconds,
            }
          : null,
      recordingDuration: formatDuration(elapsedSeconds),
    };

    await new Promise((r) => setTimeout(r, 450));
    setStep(6, 'done');

    // Save into appStore and localStorage
    useAppStore.getState().addMeeting(finalMeeting);
    if (analyzed?.source === 'gemini') {
      addToast('Meeting ended — Gemini analysis is ready', 'success');
    } else if (analyzed) {
      addToast('Meeting ended — analysis used heuristic fallback (Gemini unavailable)', 'warning');
    } else {
      addToast('Meeting ended — analysis service unreachable, saved transcript locally', 'warning');
    }

    setTimeout(() => {
      useLiveMeetingStore.getState().resetLiveMeeting();
      endingRef.current = false;
      navigate(`/meetings/${finalMeeting.id}`, { replace: true });
    }, 550);
  };

  // ---------- RENDER FLOW ----------
  if (!roomName) {
    return <ConnectingScreen roomName="invalid" demoReason="Invalid room name — redirecting…" />;
  }

  // 1. Show Pre-Meeting Lobby if user hasn't clicked "Join Meeting" yet
  if (!hasJoined) {
    return <PreMeetingLobby roomName={roomName} initialName={initialParticipantName} onJoin={handleJoinFromLobby} />;
  }

  // 2. Connecting Screen while token is being requested
  if (phase === 'idle' || phase === 'connecting' || (!tokenResponse && phase !== 'ended')) {
    return <ConnectingScreen roomName={roomName} demoReason={demoFallbackReason} />;
  }

  // 3. Ending / Final Analysis Screen
  if (phase === 'ended' || phase === 'ending') {
    if (finalSteps) {
      return <FinalAnalysisOverlay steps={finalSteps} meetingTitle={meeting.title} />;
    }
    return <ConnectingScreen roomName={roomName} />;
  }

  const shellPanels = {
    roomName,
    title: meeting.title,
    aiStatus,
    onEndMeeting: () => setEndModalOpen(true),
    onToggleChat: toggleChat,
    onTogglePeople: togglePeople,
    onCloseChat: () => setIsChatOpen(false),
    onClosePeople: () => setIsPeopleOpen(false),
    onChatActivity: handleChatActivity,
    onDemoChatSend: handleDemoChatSend,
    isChatOpen,
    isPeopleOpen,
    chatUnread,
    demoChatMessages,
  };

  return (
    <>
      {tokenResponse?.mode === 'live' ? (
        <LiveKitRoom
          room={roomInstance}
          token={tokenResponse.participantToken}
          serverUrl={tokenResponse.serverUrl}
          connect
          video={preferredCamera}
          audio={preferredMic}
          onConnected={() => {
            connectedRef.current = true;
            useLiveMeetingStore.getState().setConnection('connected');
            if (roomName) {
              useAppStore.getState().updateScheduledMeetingStatusByRoom(roomName, 'live');
            }
            // Auto-start server-side Egress recording once media is connected (if configured).
            void attemptStartRecording();
          }}
          onDisconnected={() => {
            if (!endingRef.current && connectedRef.current) {
              addToast('Disconnected from the LiveKit room', 'warning');
            }
            connectedRef.current = false;
          }}
          onError={(error) => {
            if (connectedRef.current) {
              addToast(`LiveKit: ${error.message}`, 'error');
              return;
            }
            addToast(`LiveKit connection failed: ${error.message} — switching to Demo Mode`, 'warning');
            const s = useLiveMeetingStore.getState();
            s.setMode('demo');
            s.setConnection('demo');
            setDemoFallbackReason(error.message);
          }}
        >
          <RoomAudioRenderer />
          <LiveRoomInner {...shellPanels} />
        </LiveKitRoom>
      ) : (
        <MeetingShell
          {...shellPanels}
          mode="demo"
          connection="demo"
          stage={<MockVideoStage />}
          controls={
            <ControlBar
              mode="demo"
              isMicOn={demoIsMicOn}
              isCameraOn={demoIsCameraOn}
              isScreenSharing={demoIsScreenSharing}
              isChatOpen={isChatOpen}
              isPeopleOpen={isPeopleOpen}
              chatUnread={chatUnread}
              onToggleMic={() => useLiveMeetingStore.getState().setMic(!useLiveMeetingStore.getState().isMicOn)}
              onToggleCamera={() => useLiveMeetingStore.getState().setCamera(!useLiveMeetingStore.getState().isCameraOn)}
              onToggleScreenShare={() =>
                useLiveMeetingStore.getState().setScreenSharing(!useLiveMeetingStore.getState().isScreenSharing)
              }
              onToggleChat={toggleChat}
              onTogglePeople={togglePeople}
              onEndMeeting={() => setEndModalOpen(true)}
              onSendReaction={(emoji) => {
                const name = useLiveMeetingStore.getState().localName;
                useLiveMeetingStore.getState().addReaction({ emoji, sender: name });
                playReactionPop();

                // In demo mode, simulate an interactive teammate response
                window.setTimeout(() => {
                  if (useLiveMeetingStore.getState().phase !== 'live') return;
                  const demoTeammates = ['Sophia Chen', 'Marcus Vance', 'Elena Rostova'];
                  const randomTeammate = demoTeammates[Math.floor(Math.random() * demoTeammates.length)];
                  const companionEmojis = ['👏', '👍', '❤️', '🔥', '🎉'];
                  const companionEmoji = companionEmojis[Math.floor(Math.random() * companionEmojis.length)];
                  useLiveMeetingStore.getState().addReaction({
                    emoji: companionEmoji,
                    sender: randomTeammate,
                  });
                  playReactionPop();
                }, 850);
              }}
            />
          }
        />
      )}

      <EndMeetingModal
        isOpen={endModalOpen}
        onClose={() => setEndModalOpen(false)}
        onConfirm={() => void confirmEndMeeting()}
        hasRecording={Boolean(recording?.egressId && (recording.status === 'recording' || recording.status === 'starting'))}
        stats={{
          transcriptCount: meeting.transcript.length,
          actionCount: meeting.actionItems.length,
          decisionCount: meeting.decisions.length,
        }}
      />

      {finalSteps && <FinalAnalysisOverlay steps={finalSteps} meetingTitle={meeting.title} />}
    </>
  );
};
