import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveMeetingStore } from '../../store/liveMeetingStore';

export const LiveCaptions: React.FC = () => {
  const transcript = useLiveMeetingStore((s) => s.meeting.transcript);
  const last = transcript[transcript.length - 1];
  const [visibleId, setVisibleId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!last) return;
    setVisibleId(last.id);
    const timer = setTimeout(() => setVisibleId((current) => (current === last.id ? null : current)), 7000);
    return () => clearTimeout(timer);
  }, [last]);

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10 flex justify-center">
      <AnimatePresence mode="wait">
        {last && visibleId === last.id && (
          <motion.div
            key={last.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className="bg-slate-950/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-4 py-2.5 shadow-xl max-w-full"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                Live Transcript
              </span>
              <span className="text-[10px] font-mono text-slate-500">{last.timestamp}</span>
            </div>
            <p className="text-sm text-slate-100 leading-snug">
              <span className="font-semibold" style={{ color: last.color || '#7DD3FC' }}>
                {last.speaker}:
              </span>{' '}
              {last.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
