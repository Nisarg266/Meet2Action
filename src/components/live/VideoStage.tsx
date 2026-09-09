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
import { WifiOff, MicOff, MonitorUp, Video, LayoutGrid, Maximize2 } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { LiveCaptions } from './LiveCaptions';
import { useLiveMeetingStore } from '../../store/liveMeetingStore';

type TrackRef = ReturnType<typeof useTracks>[number];

/**
 * Hysteresis window (ms) before a new active speaker takes the large stage.
 * Prevents layout thrashing on short noise blips.
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

function getGridLayout(count: number): {
  gridClass: string;
  getItemClass: (index: number, total: number) => string;
} {
  switch (count) {
    case 1:
      return {
        gridClass: 'grid-cols-1 grid-rows-1 max-w-5xl mx-auto',
        getItemClass: () => 'w-full h-full',
      };
    case 2:
      return {
        gridClass: 'grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1',
        getItemClass: () => 'w-full h-full',
      };
    case 3:
      return {
        gridClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-rows-3 sm:grid-rows-2 lg:grid-rows-1',
        getItemClass: (index: number) =>
          index === 2
            ? 'sm:col-span-2 lg:col-span-1 sm:max-w-[65%] sm:mx-auto lg:max-w-none w-full h-full'
            : 'w-full h-full',
      };
    case 4:
      return {
        gridClass: 'grid-cols-2 grid-rows-2',
        getItemClass: () => 'w-full h-full',
      };
    case 5:
    case 6:
      return {
        gridClass: 'grid-cols-2 sm:grid-cols-3 grid-rows-3 sm:grid-rows-2',
        getItemClass: (index: number, total: number) =>
          total === 5 && index === 4
            ? 'sm:col-span-1 sm:col-start-2 w-full h-full'
            : 'w-full h-full',
      };
    case 7:
    case 8:
    case 9:
      return {
        gridClass: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 grid-rows-4 sm:grid-rows-3',
        getItemClass: () => 'w-full h-full',
      };
    default:
      return {
        gridClass: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-fr overflow-y-auto',
        getItemClass: () => 'w-full h-full min-h-[160px]',
      };
  }
}

const VideoTile: React.FC<{
  trackRef: TrackRef;
  isSpeaking: boolean;
  compact?: boolean;
  contain?: boolean;
  onTurnOnCamera?: () => void;
  onClick?: () => void;
}> = ({ trackRef, isSpeaking, compact, contain, onTurnOnCamera, onClick }) => {
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
      onClick={onClick}
      className={`relative w-full h-full min-h-0 ${
        compact ? 'rounded-xl' : 'rounded-2xl'
      } overflow-hidden bg-slate-900 border transition-all ${onClick ? 'cursor-pointer' : ''} ${
        isSpeaking
          ? 'border-sky-500 ring-2 ring-sky-500/40 shadow-[0_0_24px_-6px_rgba(14,165,233,0.55)]'
          : 'border-slate-800 hover:border-slate-700/80'
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 sm:gap-3 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/90 px-3 text-center">
          <Avatar name={displayName} size={compact ? 'md' : 'xl'} />
          {isScreenShare && (
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <MonitorUp className="w-3 h-3" /> Screen share
            </span>
          )}
          {participant?.isLocal && !compact && onTurnOnCamera && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTurnOnCamera();
              }}
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/90 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Turn on Camera</span>
            </button>
          )}
        </div>
      )}

      {/* Participant Name Badge & Mic Status */}
      <div
        className={`absolute bottom-0 inset-x-0 flex items-center justify-between ${
          compact
            ? 'px-2 py-1.5 bg-gradient-to-t from-slate-950/95 to-transparent'
            : 'px-3 py-2 bg-gradient-to-t from-slate-950/90 to-transparent'
        } pointer-events-none z-10`}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          {isSpeaking && <SpeakingWaveform />}
          <span
            className={`${
              compact ? 'text-[10px] sm:text-[11px]' : 'text-xs sm:text-sm'
            } font-semibold text-slate-100 truncate drop-shadow`}
          >
            {displayName}
          </span>
        </span>
        {micOff && (
          <span className="p-1 rounded-md bg-slate-900/80 border border-slate-700/50 flex items-center justify-center shrink-0">
            <MicOff className={`${compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-rose-400`} />
          </span>
        )}
      </div>
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
  const [layoutMode, setLayoutMode] = React.useState<'grid' | 'speaker'>('grid');

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

  // Deduplicate participants so each identity gets exactly one video tile
  const participantMap = new Map<string, TrackRef>();
  tracks
    .filter((t) => t.source === Track.Source.Camera && !isAgent(t.participant))
    .forEach((t) => {
      const id = t.participant?.identity;
      if (id && !participantMap.has(id)) {
        participantMap.set(id, t);
      }
    });

  // Ensure localParticipant is always included even if not yet in tracks
  if (localParticipant && !participantMap.has(localParticipant.identity)) {
    participantMap.set(localParticipant.identity, {
      participant: localParticipant,
      source: Track.Source.Camera,
      publication: localParticipant.getTrackPublication(Track.Source.Camera),
    } as TrackRef);
  }

  const effectiveCameraRefs: TrackRef[] = Array.from(participantMap.values());
  const participantCount = effectiveCameraRefs.length;

  const focusCameraRef =
    effectiveCameraRefs.find((t) => t.participant?.identity === focusIdentity) ||
    effectiveCameraRefs.find((t) => speakingIds.has(t.participant?.identity)) ||
    effectiveCameraRefs[0];

  const mainSpeakerRef = screenShareRef || focusCameraRef || null;
  const stripRefs = mainSpeakerRef
    ? effectiveCameraRefs.filter((t) => t.participant?.identity !== mainSpeakerRef.participant?.identity)
    : [];

  const { gridClass, getItemClass } = getGridLayout(participantCount);
  const isGridView = !screenShareRef && layoutMode === 'grid';

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950 p-2 sm:p-4 overflow-hidden flex flex-col">
      <RoomAudioRenderer />

      {/* Layout Toggle (Grid vs Speaker) when multiple participants and no active screen share */}
      {!screenShareRef && participantCount > 1 && (
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex items-center gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-1 shadow-lg">
          <button
            type="button"
            onClick={() => setLayoutMode('grid')}
            title="Grid view"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              layoutMode === 'grid'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('speaker')}
            title="Speaker view"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              layoutMode === 'speaker'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Speaker</span>
          </button>
        </div>
      )}

      {participantCount > 0 || screenShareRef ? (
        isGridView ? (
          /* Dynamic Grid View (Google Meet style) */
          <div className="flex-1 min-h-0 w-full h-full flex items-center justify-center">
            <div className={`w-full h-full grid ${gridClass} gap-2.5 sm:gap-3.5`}>
              {effectiveCameraRefs.map((ref, idx) => (
                <div
                  key={`${ref.participant?.identity}-${ref.source}`}
                  className={getItemClass(idx, participantCount)}
                >
                  <VideoTile
                    trackRef={ref}
                    isSpeaking={speakingIds.has(ref.participant?.identity)}
                    onTurnOnCamera={onTurnOnCamera}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Presentation / Speaker Spotlight View */
          <div className="flex-1 min-h-0 w-full h-full flex flex-col gap-2.5 sm:gap-3">
            {/* Main Stage */}
            <div className="flex-1 min-h-0 w-full h-full relative">
              {mainSpeakerRef && (
                <VideoTile
                  trackRef={mainSpeakerRef}
                  isSpeaking={speakingIds.has(mainSpeakerRef.participant?.identity)}
                  contain={Boolean(screenShareRef)}
                  onTurnOnCamera={onTurnOnCamera}
                />
              )}
            </div>

            {/* Thumbnail Strip */}
            {stripRefs.length > 0 && (
              <div className="h-24 sm:h-28 shrink-0 flex items-stretch gap-2.5 overflow-x-auto pb-1 pt-0.5">
                {stripRefs.map((ref) => (
                  <div
                    key={`${ref.participant?.identity}-${ref.source}`}
                    className="w-36 sm:w-44 shrink-0 h-full min-h-0 aspect-video"
                  >
                    <VideoTile
                      trackRef={ref}
                      isSpeaking={speakingIds.has(ref.participant?.identity)}
                      compact
                      onTurnOnCamera={onTurnOnCamera}
                      onClick={() => {
                        if (ref.participant?.identity) {
                          setFocusIdentity(ref.participant.identity);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
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
