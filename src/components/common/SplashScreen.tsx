import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, CheckCircle2, Waves, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const LOADING_STAGES = [
  { progress: 15, text: 'Calibrating Neural Acoustic Models...', sub: 'Initializing dual-channel audio frequency separation' },
  { progress: 42, text: 'Synchronizing Multi-Speaker Diarization...', sub: 'Mapping 6 executive speaker voiceprints' },
  { progress: 75, text: 'Synthesizing Action Items & Deliverables...', sub: 'Extracting owners, confidence matrices & SLA deadlines' },
  { progress: 92, text: 'Locking Decision Consensus Ledger...', sub: 'Verifying lead sign-offs and policy governance' },
  { progress: 100, text: 'MeetFlow Command Center Ready', sub: 'Synchronized across all cloud workspaces' },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    // Stage 1: 0 - 400ms
    const t1 = setTimeout(() => {
      setProgress(35);
      setCurrentStageIdx(1);
    }, 450);

    // Stage 2: 450 - 1000ms
    const t2 = setTimeout(() => {
      setProgress(68);
      setCurrentStageIdx(2);
    }, 1050);

    // Stage 3: 1000 - 1600ms
    const t3 = setTimeout(() => {
      setProgress(88);
      setCurrentStageIdx(3);
    }, 1650);

    // Stage 4: 1600 - 2100ms
    const t4 = setTimeout(() => {
      setProgress(100);
      setCurrentStageIdx(4);
    }, 2200);

    // Auto complete
    const t5 = setTimeout(() => {
      onComplete();
    }, 2750);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  const currentStage = LOADING_STAGES[currentStageIdx];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)', transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden select-none"
    >
      {/* Background Animated Ambient Lights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top cyan radiant glow */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[450px] bg-gradient-to-b from-sky-500/30 via-cyan-500/20 to-transparent rounded-full blur-3xl pointer-events-none"
        />

        {/* Bottom deep indigo glow */}
        <motion.div
          animate={{
            scale: [1.1, 0.95, 1.1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-t from-blue-600/30 via-sky-600/15 to-transparent rounded-full blur-3xl pointer-events-none"
        />

        {/* Subtle grid mesh overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', 
            backgroundSize: '32px 32px' 
          }} 
        />
      </div>

      {/* Main Center Content Container */}
      <div className="relative z-10 max-w-md w-full mx-auto px-6 flex flex-col items-center text-center">
        
        {/* Animated Brand Logo Icon with Orbital Rings */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-7">
          {/* Outer rotating dashed ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-dashed border-sky-400/40"
          />

          {/* Middle pulsing glowing halo */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-2 rounded-full bg-gradient-to-tr from-sky-500/25 to-cyan-400/30 blur-md"
          />

          {/* Inner core badge */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'backOut' }}
            className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-[#00517c] p-0.5 shadow-2xl shadow-sky-500/40 flex items-center justify-center"
          >
            <div className="w-full h-full rounded-[14px] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center justify-center text-white"
              >
                <Sparkles className="w-9 h-9 text-sky-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
              </motion.div>
            </div>
          </motion.div>

          {/* Floating mini satellite badges */}
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-1 -right-1 bg-sky-400 text-slate-950 p-1.5 rounded-full shadow-lg"
          >
            <Zap className="w-3 h-3 fill-slate-950" />
          </motion.div>
        </div>

        {/* Title & Tagline */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="space-y-2 mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/30 text-sky-400 text-xs font-mono tracking-wider uppercase mb-1 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            Autonomous Meeting Intelligence
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-sky-200 bg-clip-text text-transparent">
            MeetFlow AI
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-xs mx-auto">
            Transform conversational audio into executed deliverables &amp; verified consensus.
          </p>
        </motion.div>

        {/* Audio Spectrum Equalizer Wave Bars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-1.5 h-10 mb-7"
        >
          {[24, 42, 18, 55, 34, 48, 62, 28, 50, 38, 22, 45, 30].map((h, i) => (
            <motion.div
              key={i}
              animate={{
                height: [10, h, 14],
              }}
              transition={{
                duration: 0.9 + (i % 4) * 0.2,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
                delay: i * 0.08,
              }}
              className="w-1 rounded-full bg-gradient-to-t from-sky-600 via-sky-400 to-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
            />
          ))}
        </motion.div>

        {/* Dynamic Multi-Stage Status Display */}
        <div className="w-full space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-sky-300 font-medium">
              <Brain className="w-3.5 h-3.5 animate-pulse text-sky-400" />
              <span className="truncate max-w-[260px] text-left">{currentStage.text}</span>
            </div>
            <span className="text-sky-400 font-bold tracking-wider">{progress}%</span>
          </div>

          {/* Glowing Animated Progress Bar */}
          <div className="relative w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: '10%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-sky-600 via-sky-400 to-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.8)] relative"
            >
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/70 blur-xs rounded-full" />
            </motion.div>
          </div>

          <p className="text-[11px] text-slate-500 font-mono tracking-tight text-left truncate">
            {currentStage.sub}
          </p>
        </div>

        {/* Trust & Architecture Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-400 font-mono"
        >
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            SOC2 Type II
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800">
            <Waves className="w-3 h-3 text-sky-400" />
            Live Whisper-V3 Diarization
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            99.4% Precision
          </span>
        </motion.div>

        {/* Quick Skip Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          whileHover={{ opacity: 1, scale: 1.03 }}
          onClick={onComplete}
          className="mt-6 text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 underline underline-offset-4 cursor-pointer transition-colors"
        >
          Skip intro to Command Center <ArrowRight className="w-3 h-3" />
        </motion.button>
      </div>
    </motion.div>
  );
};
