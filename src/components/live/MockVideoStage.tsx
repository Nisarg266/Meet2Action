import React from 'react';
import { motion } from 'motion/react';
import { MicOff, MonitorUp, Users } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { LiveCaptions } from './LiveCaptions';
import { LIVE_PERSONAS, getPersona } from '../../services/liveAiService';
import { useLiveMeetingStore } from '../../store/liveMeetingStore';

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

const MockTile: React.FC<{
  name: string;
  role: string;
  avatar?: string;
  color: string;
  isSpeaking: boolean;
  isLocal: boolean;
  compact?: boolean;
}> = ({ name, role, avatar, color, isSpeaking, isLocal, compact }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.25 }}
    className={`relative rounded-xl overflow-hidden border ${
      isSpeaking
        ? 'border-sky-500 ring-2 ring-sky-500/40 shadow-[0_0_24px_-6px_rgba(14,165,233,0.55)]'
        : 'border-slate-800'
    }`}
    style={{
      background: `radial-gradient(circle at 50% 35%, ${color}26 0%, #0F172A 68%, #0B1120 100%)`,
    }}
  >
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-3">
      <div className={compact ? '' : 'relative'}>
        <Avatar name={name} src={avatar} size={compact ? 'md' : 'xl'} />
        {isSpeaking && (
          <motion.span
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: [0.35, 0.15, 0.35], scale: [1, 1.28, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full border-2 border-sky-400"
          />
        )}
      </div>
      {!compact && (
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{role}</span>
      )}
    </div>

    <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-t from-slate-950/90 to-transparent">
      <span className="flex items-center gap-1.5 min-w-0">
        {isSpeaking && <SpeakingWaveform />}
        <span className="text-[11px] font-semibold text-slate-100 truncate drop-shadow">
          {isLocal ? 'You' : name}
          {isLocal && <span className="text-slate-400 font-normal"> · Host</span>}
        </span>
      </span>
    </div>
  </motion.div>
);

/**
 * Demo Mode stage: renders simulated participants driven by the mock
 * transcript simulator (the current speaker glows). Visual language matches
 * the real LiveKit stage exactly.
 */
export const MockVideoStage: React.FC = () => {
  const transcript = useLiveMeetingStore((s) => s.meeting.transcript);
  const localName = useLiveMeetingStore((s) => s.localName);
  const isScreenSharing = useLiveMeetingStore((s) => s.isScreenSharing);
  const [activeSpeaker, setActiveSpeaker] = React.useState<string | null>(null);

  const last = transcript[transcript.length - 1];

  React.useEffect(() => {
    if (!last) return;
    setActiveSpeaker(last.speaker);
    const timer = setTimeout(() => setActiveSpeaker((cur) => (cur === last.speaker ? null : cur)), 6500);
    return () => clearTimeout(timer);
  }, [last]);

  const remotePersonas = LIVE_PERSONAS.filter((p) => p.name !== localName);
  const tiles = [
    {
      name: localName,
      role: 'Host · You',
      color: '#0284C7',
      isLocal: true,
      avatar: getPersona(localName).avatar,
    },
    ...remotePersonas.map((p) => ({ name: p.name, role: p.role, color: p.color, isLocal: false, avatar: p.avatar })),
  ];

  return (
    <div className="absolute inset-0 bg-slate-950 p-3 sm:p-4 overflow-hidden">
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/40">
        <Users className="w-3 h-3 text-amber-400" />
        <span className="text-[9px] font-mono font-semibold tracking-wider text-amber-300 uppercase">
          Simulated Participants
        </span>
      </div>

      <div className={`h-full grid auto-rows-fr gap-3 ${gridClassFor(tiles.length)}`}>
        {tiles.map((tile) => (
          <MockTile
            key={tile.name}
            name={tile.name}
            role={tile.role}
            avatar={tile.avatar}
            color={tile.color}
            isLocal={tile.isLocal}
            isSpeaking={activeSpeaker === tile.name}
          />
        ))}
      </div>

      {isScreenSharing && (
        <div className="absolute inset-x-6 bottom-16 sm:inset-x-10 z-10 rounded-xl border border-amber-500/40 bg-slate-900/90 backdrop-blur px-4 py-3 flex items-center gap-3">
          <MonitorUp className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-200/90">
            Screen share preview needs a LiveKit connection — add{' '}
            <span className="font-mono">LIVEKIT_URL</span>,{' '}
            <span className="font-mono">LIVEKIT_API_KEY</span> and{' '}
            <span className="font-mono">LIVEKIT_API_SECRET</span> to enable real sharing.
          </p>
        </div>
      )}

      <LiveCaptions />
    </div>
  );
};
