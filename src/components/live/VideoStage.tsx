import React from 'react';
import { Track, RoomEvent, ConnectionState } from 'livekit-client';
import {
  useTracks,
  useSpeakingParticipants,
  useRoomContext,
  VideoTrack,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { motion } from 'motion/react';
import { WifiOff, MicOff, MonitorUp } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { LiveCaptions } from './LiveCaptions';
import { useLiveMeetingStore } from '../../store/liveMeetingStore';

type TrackRef = ReturnType<typeof useTracks>[number];

function gridClassFor(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count <= 2) return 'grid-cols-1 sm:grid-cols-2';
  if (count <= 4) return 'grid-cols-2';
  if (count <= 6) return 'grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-2 lg:grid-cols-4';
}

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

const VideoTile: React.FC<{ trackRef: TrackRef; isSpeaking: boolean; compact?: boolean }> = ({
  trackRef,
  isSpeaking,
  compact,
}) => {
  const participant = trackRef.participant;
  const displayName = participant.isLocal ? 'You' : participant.name || participant.identity || 'Guest';
  const hasVideo = Boolean(trackRef.publication && trackRef.publication.isSubscribed !== false && !trackRef.publication.isMuted);
  const isScreenShare = trackRef.source === Track.Source.ScreenShare;
  const micOff = !participant.isMicrophoneEnabled;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`relative rounded-xl overflow-hidden bg-slate-900 border transition-shadow ${
        compact ? 'h-full' : 'h-full'
      } ${
        isSpeaking
          ? 'border-sky-500 ring-2 ring-sky-500/40 shadow-[0_0_24px_-6px_rgba(14,165,233,0.55)]'
          : 'border-slate-800'
      }`}
    >
      {hasVideo ? (
        <VideoTrack
          trackRef={trackRef}
          className={`absolute inset-0 w-full h-full object-cover ${participant.isLocal && !isScreenShare ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
          <Avatar name={displayName} size={compact ? 'md' : 'xl'} />
          {isScreenShare && (
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <MonitorUp className="w-3 h-3" /> Screen share
            </span>
          )}
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-t from-slate-950/90 to-transparent">
        <span className="flex items-center gap-1.5 min-w-0">
          {isSpeaking && <SpeakingWaveform />}
          <span className="text-[11px] font-semibold text-slate-100 truncate drop-shadow">{displayName}</span>
        </span>
        {micOff && <MicOff className="w-3 h-3 text-rose-400 shrink-0" />}
      </div>
    </motion.div>
  );
};

export const VideoStage: React.FC = () => {
  const room = useRoomContext();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const speaking = useSpeakingParticipants();
  const setConnection = useLiveMeetingStore((s) => s.setConnection);
  const [reconnecting, setReconnecting] = React.useState(false);

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

  const screenShareRef = tracks.find(
    (t) => t.source === Track.Source.ScreenShare && t.publication && t.publication.isSubscribed !== false
  );

  const cameraRefs = tracks.filter(
    (t) =>
      t.source === Track.Source.Camera &&
      (t.participant.isLocal || !t.publication || t.publication.isSubscribed !== false)
  );

  const visibleRefs = screenShareRef ? cameraRefs.slice(0, 8) : cameraRefs;

  return (
    <div className="absolute inset-0 bg-slate-950 p-3 sm:p-4 overflow-hidden">
      <RoomAudioRenderer />

      {screenShareRef ? (
        <div className="h-full flex flex-col gap-3 min-h-0">
          <div className="flex-1 min-h-0">
            <VideoTile trackRef={screenShareRef} isSpeaking={speakingIds.has(screenShareRef.participant.identity)} />
          </div>
          {visibleRefs.length > 0 && (
            <div className="h-24 sm:h-28 shrink-0 grid grid-flow-col auto-cols-[minmax(140px,1fr)] gap-3 overflow-x-auto">
              {visibleRefs.map((ref) => (
                <VideoTile
                  key={`${ref.participant.identity}-${ref.source}`}
                  trackRef={ref}
                  isSpeaking={speakingIds.has(ref.participant.identity)}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      ) : visibleRefs.length > 0 ? (
        <div className={`h-full grid auto-rows-fr gap-3 ${gridClassFor(visibleRefs.length)}`}>
          {visibleRefs.map((ref) => (
            <VideoTile
              key={`${ref.participant.identity}-${ref.source}`}
              trackRef={ref}
              isSpeaking={speakingIds.has(ref.participant.identity)}
            />
          ))}
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <MonitorUp className="w-6 h-6 text-sky-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Waiting for participants to enable video</p>
            <p className="text-xs text-slate-500 mt-1">
              Share the invite link — everyone who joins appears here instantly.
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
