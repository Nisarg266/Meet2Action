import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Radio, Video, LogIn, Wifi, ArrowRight, Sparkles, Users, ShieldCheck, Zap } from 'lucide-react';
import { generateRoomName, probeLiveKitStatus } from '../services/livekitService';

const FLOW_STEPS = [
  { icon: Video, label: 'Start & Invite' },
  { icon: Users, label: 'Live Video Meeting' },
  { icon: Sparkles, label: 'AI Detects Tasks & Decisions' },
  { icon: ShieldCheck, label: 'End → Full Analysis' },
];

export const LiveMeetingLobby: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = React.useState(
    `Live Meeting · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  );
  const [joinCode, setJoinCode] = React.useState('');
  const [serverMode, setServerMode] = React.useState<'live' | 'demo' | 'checking'>('checking');

  React.useEffect(() => {
    let cancelled = false;
    void probeLiveKitStatus().then((mode) => {
      if (!cancelled) setServerMode(mode);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const startInstantMeeting = () => {
    const room = generateRoomName();
    const query = title.trim() ? `?title=${encodeURIComponent(title.trim())}` : '';
    navigate(`/live-meeting/${room}${query}`);
  };

  const joinMeeting = () => {
    const raw = joinCode.trim();
    if (!raw) return;
    // Accept both a bare room name and a pasted invite URL.
    const fromUrl = raw.match(/\/live-meeting\/([a-zA-Z0-9_-]+)$/);
    const room = (fromUrl ? fromUrl[1] : raw).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (room.length < 3) return;
    navigate(`/live-meeting/${room}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6"
    >
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full w-fit border border-rose-200/80 mb-2">
          <Radio className="w-3.5 h-3.5 text-rose-600" />
          Live Meetings
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
          Start a Live Meeting
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Real-time video powered by LiveKit, with MeetFlow AI listening in the background — live transcript,
          action item detection, decision tracking and open discussions, all while you talk.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-[#006194] flex items-center justify-center shadow-xs">
              <Video className="w-5 h-5 text-white" />
            </span>
            <div>
              <h2 className="text-base font-bold font-display text-slate-900">Instant meeting</h2>
              <p className="text-xs text-slate-500">Generate a room and start right away.</p>
            </div>
          </div>

          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Meeting title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. V2 Launch Readiness Sync"
            className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />

          <button
            onClick={startInstantMeeting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            Start Live Meeting
          </button>

          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-sky-500" />
            A unique room name is generated and a secure token is requested automatically.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-sky-600" />
            </span>
            <div>
              <h2 className="text-base font-bold font-display text-slate-900">Join with a room code</h2>
              <p className="text-xs text-slate-500">Have an invite? Drop the code or link here.</p>
            </div>
          </div>

          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Room code or invite link
          </label>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && joinMeeting()}
            placeholder="meetflow-swift-falcon-42"
            className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />

          <button
            onClick={joinMeeting}
            disabled={joinCode.trim().length < 3}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Meeting
            <ArrowRight className="w-4 h-4" />
          </button>

          <div
            className={`mt-4 rounded-xl border px-3 py-2.5 flex items-start gap-2.5 ${
              serverMode === 'live'
                ? 'bg-emerald-50/60 border-emerald-200/80'
                : 'bg-amber-50/60 border-amber-200/80'
            }`}
          >
            <Wifi
              className={`w-4 h-4 shrink-0 mt-0.5 ${serverMode === 'live' ? 'text-emerald-600' : 'text-amber-600'}`}
            />
            <p className="text-[11px] leading-relaxed text-slate-600">
              {serverMode === 'checking' && 'Checking LiveKit server status…'}
              {serverMode === 'live' &&
                'LiveKit server connected — real WebRTC video, audio and screen sharing are enabled.'}
              {serverMode === 'demo' &&
                'Demo Mode: set LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET in .env to enable real video. Meetings run with simulated participants and transcript in the meantime.'}
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs"
      >
        <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3">
          How a MeetFlow live session flows
        </p>
        <div className="flex flex-wrap items-center gap-y-3">
          {FLOW_STEPS.map((step, i) => (
            <React.Fragment key={step.label}>
              <div className="flex items-center gap-2 px-2">
                <span className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center">
                  <step.icon className="w-3.5 h-3.5 text-sky-600" />
                </span>
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{step.label}</span>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 mx-1 hidden sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
