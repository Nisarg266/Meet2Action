import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveMeetingStore, type ActiveReaction } from '../../store/liveMeetingStore';

export const REACTION_EMOJIS = [
  { emoji: '👏', label: 'Applause' },
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '😂', label: 'Joy' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '💡', label: 'Idea' },
  { emoji: '✋', label: 'Raise Hand' },
];

/**
 * Plays a subtle, non-intrusive Web Audio synthesizer pop on reaction.
 * Handled safely with fallback so browser autoplay policies never throw errors.
 */
export function playReactionPop(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);

    setTimeout(() => {
      if (ctx.state !== 'closed') {
        void ctx.close();
      }
    }, 150);
  } catch {
    // Audio autoplay restricted or unavailable — fail gracefully
  }
}

const FloatingReactionItem: React.FC<{
  reaction: ActiveReaction;
  onComplete: (id: string) => void;
}> = ({ reaction, onComplete }) => {
  // Generate a random sway offset for natural floating bubble physics
  const sway = React.useMemo(() => (Math.random() - 0.5) * 60, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      onComplete(reaction.id);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [reaction.id, onComplete]);

  return (
    <motion.div
      key={reaction.id}
      initial={{ opacity: 0, scale: 0.3, y: 10, x: 0 }}
      animate={{
        opacity: [0, 1, 1, 0.9, 0],
        scale: [0.3, 1.35, 1.05, 1, 0.85],
        y: [0, -45, -115, -185, -270],
        x: [0, sway * 0.45, -sway * 0.65, sway, sway * 1.2],
      }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{
        duration: 2.7,
        times: [0, 0.12, 0.35, 0.75, 1],
        ease: 'easeOut',
      }}
      style={{
        left: `${reaction.xPercent}%`,
        bottom: '80px',
      }}
      className="pointer-events-none absolute z-40 flex flex-col items-center justify-center select-none will-change-transform"
    >
      <span className="text-3xl sm:text-4xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)] transform-gpu">
        {reaction.emoji}
      </span>
      <span className="text-[10px] font-medium text-slate-200 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap mt-1 max-w-[120px] truncate">
        {reaction.sender}
      </span>
    </motion.div>
  );
};

export const EmojiReactionsOverlay: React.FC = () => {
  const reactions = useLiveMeetingStore((s) => s.reactions);
  const removeReaction = useLiveMeetingStore((s) => s.removeReaction);

  if (reactions.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-35 overflow-hidden">
      <AnimatePresence>
        {reactions.map((reaction) => (
          <FloatingReactionItem
            key={reaction.id}
            reaction={reaction}
            onComplete={removeReaction}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
