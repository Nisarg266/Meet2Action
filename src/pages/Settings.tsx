import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/appStore';
import {
  Settings as SettingsIcon,
  Sparkles,
  Sliders,
  Users,
  Bell,
  Shield,
  RotateCcw,
  Check,
  CheckCircle2,
  Info
} from 'lucide-react';
import { mockMeetings, initialActionItems, initialDecisions } from '../data/mockMeetings';

export const Settings: React.FC = () => {
  const { addToast, setShowSplash } = useAppStore();
  const [model, setModel] = useState('gemini-2.5-flash');
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [autoNormalizeDates, setAutoNormalizeDates] = useState(true);
  const [notifySlack, setNotifySlack] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    addToast('Settings successfully updated', 'success');
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo meetings and action items to original state?')) {
      useAppStore.setState({
        meetings: mockMeetings,
        actionItems: initialActionItems,
        decisions: initialDecisions,
      });
      addToast('Reset workspace to initial sample data', 'info');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
          <SettingsIcon className="w-3.5 h-3.5 text-sky-600" />
          Workspace Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
          Settings &amp; AI Intelligence Preferences
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize extraction thresholds, language models, notification triggers, and team directories.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: AI Model Preferences */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 font-display">
            <Sparkles className="w-4 h-4 text-sky-600" />
            AI Extraction Engine
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Foundation Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (High speed &amp; live transcription)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep reasoning &amp; multi-hour transcripts)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Review Threshold
                </label>
                <span className="font-mono text-xs font-bold text-sky-700">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer mt-2"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Items below {confidenceThreshold}% confidence are flagged with &ldquo;Needs Review&rdquo;.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-900 block">
                Automatic Temporal Normalization
              </span>
              <span className="text-[11px] text-slate-500">
                Resolve colloquial date phrases like &ldquo;by Friday&rdquo; or &ldquo;next sprint&rdquo; into calendar dates.
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoNormalizeDates}
              onChange={(e) => setAutoNormalizeDates(e.target.checked)}
              className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Section 2: Notifications */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 font-display">
            <Bell className="w-4 h-4 text-sky-600" />
            Alerts &amp; Dispatch Rules
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Slack Channel Dispatches
                </span>
                <span className="text-[11px] text-slate-500">
                  Broadcast extracted decisions and high-priority deliverables to #product-sync.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifySlack}
                onChange={(e) => setNotifySlack(e.target.checked)}
                className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Email Executive Digest
                </span>
                <span className="text-[11px] text-slate-500">
                  Send daily briefing PDF to team leads every morning at 9:00 AM.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Data Management & Reset */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 font-display text-rose-700">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            Demo Data Controls
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Need to restart the interactive demonstration? You can reload the pre-populated multi-speaker transcripts, action items, and consensus decisions at any time.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Initial Mock Dataset</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSplash(true);
                addToast('Triggering Animated AI Splash Intro', 'info');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Replay AI Splash Intro Screen</span>
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {isSaved ? <Check className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{isSaved ? 'Saved Preferences' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
};
