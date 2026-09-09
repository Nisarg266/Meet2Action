import React from 'react';
import { Track, RoomEvent, ConnectionState } from 'livekit-client';
import {
  useTracks,
  useSpeakingParticipants,
  useRoomContext,
  useLocalParticipant,
  VideoTrack,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { motion } from 'motion/react';
import { WifiOff, MicOff, MonitorUp, Video } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { LiveCaptions } from './LiveCaptions';
import { useLiveMeetingStore } from '../../store/liveMeetingStore';

type TrackRef = ReturnType<typeof useTracks>[number];

/**
 * Hysteresis window (ms) before a new active speaker takes the large stage.
 * Prevents the layout from reordering wildly on short noise blips — a speaker
 * must be continuously active for this long before the focus switches.
 */
const SPEAKER_SWITCH_DELAY_MS = 1100;

const SpeakingWaveform: React.FC = () => (
  <span className="flex items-end gap-[2px] h-3">
    {[0, 1, 2, 3].map((i) => (
      <span
        key={i}
        className="w-[3px] rounded-full bg-sky-400 animate-pulse"
        style={{ height: `${6 + ((i * 5) % 9)}px`, animationDelay: `${i * 140}ms` }}
      />
    ))}
  </span>
);

function displayNameOf(participant: any): string {
  return participant?.isLocal ? 'You' : participant?.name || participant?.identity || 'Guest';
}

const VideoTile: React.FC<{
  trackRef: TrackRef;
  isSpeaking: boolean;
  compact?: boolean;
  contain?: boolean;
  onTurnOnCamera?: () => void;
}> = ({ trackRef, isSpeaking, compact, contain, onTurnOnCamera }) => {
  const participant = trackRef?.participant;
  const displayName = displayNameOf(participant);
  const pub = trackRef?.publication;
  const hasVideo = Boolean(pub && !pub.isMuted && (pub.track || (pub as any).isSubscribed !== false));
  const isScreenShare = trackRef?.source === Track.Source.ScreenShare;
  const micOff = !participant?.isMicrophoneEnabled;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-slate-900 border transition-all ${
        isSpeaking
          ? 'border-sky-500 ring-2 ring-sky-500/40 shadow-[0_0_24px_-6px_rgba(14,165,233,0.55)]'
          : 'border-slate-800'
      }`}
    >
      {hasVideo ? (
        <VideoTrack
          trackRef={trackRef}
          className={`absolute inset-0 w-full h-full ${
            contain ? 'object-contain bg-slate-950' : 'object-cover'
          } ${participant?.isLocal && !isScreenShare ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-4 text-center">
          <Avatar name={displayName} size={compact ? 'md' : 'xl'} />
          {isScreenShare && (
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <MonitorUp className="w-3 h-3" /> Screen share
            </span>
          )}
          {participant?.isLocal && !compact && onTurnOnCamera && (
            <button
              type="button"
              onClick={onTurnOnCamera}
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/90 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Turn on Camera</span>
            </button>
          )}
        </div>
      )}

      {!compact && (
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-slate-950/90 to-transparent pointer-events-none z-10">
          <span className="flex items-center gap-1.5 min-w-0">
            {isSpeaking && <SpeakingWaveform />}
            <span className="text-xs font-semibold text-slate-100 truncate drop-shadow">{displayName}</span>
          </span>
          {micOff && <MicOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
        </div>
      )}

      {compact && (
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-1.5 py-1 bg-gradient-to-t from-slate-950/90 to-transparent pointer-events-none z-10">
          <span className="text-[10px] font-semibold text-slate-100 truncate drop-shadow max-w-[80%]">
            {displayName}
          </span>
          {micOff && <MicOff className="w-3 h-3 text-rose-400 shrink-0" />}
        </div>
      )}
    </motion.div>
  );
};

export const VideoStage: React.FC<{ onTurnOnCamera?: () => void }> = ({ onTurnOnCamera }) => {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const speaking = useSpeakingParticipants();
  const setConnection = useLiveMeetingStore((s) => s.setConnection);
  const [reconnecting, setReconnecting] = React.useState(false);

  // --- Focused (large-stage) participant with speaker hysteresis ---------
  const [focusIdentity, setFocusIdentity] = React.useState<string | null>(null);
  const activeSpeakerIdentity = speaking.length > 0 ? speaking[0].identity : null;

  React.useEffect(() => {
    if (!activeSpeakerIdentity || activeSpeakerIdentity === focusIdentity) return;
    const timer = window.setTimeout(() => {
      setFocusIdentity(activeSpeakerIdentity);
    }, SPEAKER_SWITCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [activeSpeakerIdentity, focusIdentity]);

  React.useEffect(() => {
    const update = () => {
      const state = room.state;
      setReconnecting(state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting);
      setConnection(
        state === ConnectionState.Connected
          ? 'connected'
          : state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting
            ? 'reconnecting'
            : 'disconnected'
      );
    };
    update();
    room.on(RoomEvent.ConnectionStateChanged, update);
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, update);
    };
  }, [room, setConnection]);

  const speakingIds = new Set(speaking.map((p) => p.identity));

  const isAgent = (p: any) => p?.identity === 'meetflow-stt' || p?.isAgent || p?.name === 'AI Transcript';

  const screenShareRef = tracks.find(
    (t) =>
      t.source === Track.Source.ScreenShare &&
      !isAgent(t.participant) &&
      t.publication &&
      t.publication.isSubscribed !== false
  );

  const cameraRefs = tracks.filter(
    (t) =>
      t.source === Track.Source.Camera &&
      !isAgent(t.participant)
  );

  // Reliable fallback: If no camera track publications returned yet, use the local participant
  const effectiveCameraRefs: TrackRef[] =
    cameraRefs.length > 0
      ? cameraRefs
      : localParticipant
        ? [
            {
              participant: localParticipant,
              source: Track.Source.Camera,
              publication: localParticipant.getTrackPublication(Track.Source.Camera),
            } as TrackRef,
          ]
        : [];

  const focusCameraRef =
    effectiveCameraRefs.find((t) => t.participant?.identity === focusIdentity) ||
    effectiveCameraRefs.find((t) => speakingIds.has(t.participant?.identity)) ||
    effectiveCameraRefs[0];

  const mainRef = screenShareRef || focusCameraRef || null;
  const stripRefs = mainRef
    ? effectiveCameraRefs.filter((t) => t.participant?.identity !== mainRef.participant?.identity).slice(0, 8)
    : [];

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950 p-2 sm:p-4 overflow-hidden flex flex-col">
      <RoomAudioRenderer />

      {mainRef ? (
        <div className="flex-1 min-h-0 w-full h-full flex flex-col gap-2 sm:gap-3">
          {/* Large stage: active speaker (or screen share) */}
          <div className="flex-1 min-h-0 w-full h-full relative">
            <VideoTile
              trackRef={mainRef}
              isSpeaking={speakingIds.has(mainRef.participant?.identity)}
              contain={Boolean(screenShareRef)}
              onTurnOnCamera={onTurnOnCamera}
            />
          </div>

          {/* Participant thumbnail strip */}
          {stripRefs.length > 0 && (
            <div className="h-[76px] sm:h-24 shrink-0 flex items-stretch gap-2 sm:gap-2.5 overflow-x-auto pb-0.5">
              {stripRefs.map((ref) => (
                <div key={`${ref.participant?.identity}-${ref.source}`} className="w-32 sm:w-40 shrink-0 h-full">
                  <VideoTile
                    trackRef={ref}
                    isSpeaking={speakingIds.has(ref.participant?.identity)}
                    compact
                    onTurnOnCamera={onTurnOnCamera}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <MonitorUp className="w-6 h-6 text-sky-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Connecting video stage…</p>
            <p className="text-xs text-slate-500 mt-1">
              Click the camera icon below to turn on your webcam.
            </p>
          </div>
        </div>
      )}

      <LiveCaptions />

      {reconnecting && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <WifiOff className="w-8 h-8 text-amber-400 animate-pulse" />
          <p className="text-sm font-semibold text-slate-100">Connection interrupted — reconnecting…</p>
          <p className="text-xs text-slate-500">LiveKit is re-establishing the WebRTC session</p>
        </div>
      )}
    </div>
  );
};
