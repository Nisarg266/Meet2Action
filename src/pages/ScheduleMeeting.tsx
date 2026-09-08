import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import {
  Calendar,
  Clock,
  Video,
  Sparkles,
  Users,
  Bot,
  Link,
  Plus,
  X,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export const ScheduleMeeting: React.FC = () => {
  const { addMeeting, addToast } = useAppStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState('Q4 Product Strategy & Sprint Planning');
  const [date, setDate] = useState('September 11, 2026');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('10:45 AM');
  const [platform, setPlatform] = useState<'Google Meet' | 'Zoom' | 'MS Teams' | 'In-Person'>('Google Meet');
  const [meetingUrl, setMeetingUrl] = useState('meet.google.com/xyz-flow-meet');
  const [invitees, setInvitees] = useState<string[]>([
    'Alex Mercer',
    'Rahul Patel',
    'Amit Shah',
    'Priya Mehta',
  ]);
  const [inviteInput, setInviteInput] = useState('');
  const [isBotEnabled, setIsBotEnabled] = useState(true);
  const [botPersona, setBotPersona] = useState('Executive Synthesizer');

  const handleAddInvitee = () => {
    if (inviteInput.trim() && !invitees.includes(inviteInput.trim())) {
      setInvitees([...invitees, inviteInput.trim()]);
      setInviteInput('');
    }
  };

  const handleRemoveInvitee = (name: string) => {
    setInvitees(invitees.filter((i) => i !== name));
  };

  const handleAutoTitle = () => {
    setTitle('Sprint Review & Architecture Milestone');
    addToast('Generated title based on roadmap context', 'info');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `meet-${Date.now().toString(36)}`;

    addMeeting({
      id: newId,
      title,
      date,
      duration: 45,
      durationFormatted: '45 mins',
      platform,
      meetingUrl,
      participants: invitees,
      status: 'scheduled',
      actionItems: [],
      decisions: [],
      summary: `Upcoming session scheduled for ${date} at ${startTime}. MeetFlow AI Notetaker (${botPersona}) is configured to join automatically.`,
      transcript: '',
      transcriptMessages: [],
    });

    navigate(`/meetings/${newId}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          Meeting Provisioning
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
          Create &amp; Schedule Meeting
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure audio ingestion, invite team leads, and provision the autonomous MeetFlow AI Scribe bot.
        </p>
      </div>

      <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Configuration */}
        <div className="lg:col-span-2 space-y-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* Meeting Title with AI Auto-title suggestion */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Meeting Title
              </label>
              <button
                type="button"
                onClick={handleAutoTitle}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                AI Suggest Title
              </button>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-semibold text-slate-900 px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Time
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Time
              </label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Platform Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Conference Platform
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['Google Meet', 'Zoom', 'MS Teams', 'In-Person'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                    platform === p
                      ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meeting URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Meeting URL
            </label>
            <div className="relative flex items-center">
              <Link className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 font-mono border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Invitees */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Invite Attendees
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {invitees.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
                >
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInvitee(name)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInvitee();
                  }
                }}
                placeholder="Type name or email and press Add..."
                className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddInvitee}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Add
              </button>
            </div>
          </div>

          {/* MeetFlow AI Bot Configuration Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-sky-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    MeetFlow AI Autonomous Notetaker
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Bot joins call silently, transcribes audio, and extracts primitives live
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={isBotEnabled}
                onChange={(e) => setIsBotEnabled(e.target.checked)}
                className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
              />
            </div>

            {isBotEnabled && (
              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Persona
                  </label>
                  <select
                    value={botPersona}
                    onChange={(e) => setBotPersona(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Executive Synthesizer">Executive Synthesizer (Concise)</option>
                    <option value="Engineering Scribe">Engineering Scribe (Technical)</option>
                    <option value="Governance & Compliance">Governance &amp; Compliance Watchdog</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Webhook integration enabled
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: AI Agenda Assistant & Submission */}
        <div className="space-y-6">
          {/* AI Agenda Assistant */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              AI Agenda Assistant
            </div>

            <h3 className="text-sm font-bold text-slate-900">
              Recommended Discussion Topics
            </h3>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="font-semibold text-slate-900 block">1. V2 Launch Checklist Review</span>
                <p className="text-slate-500 text-[11px]">
                  Audit status of Rahul&apos;s redesign and Amit&apos;s Stripe integration.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="font-semibold text-slate-900 block">2. Enterprise Pricing Decision</span>
                <p className="text-slate-500 text-[11px]">
                  Resolve 25-seat hard floor debate flagged in previous sync.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="font-semibold text-slate-900 block">3. AWS Edge Caching Sign-off</span>
                <p className="text-slate-500 text-[11px]">
                  Review Lambda cold starts budget variance with Jay Patel.
                </p>
              </div>
            </div>
          </div>

          {/* Submission Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule &amp; Provision Bot</span>
            </button>

            <button
              type="button"
              onClick={() => {
                addToast('Saved draft configuration', 'info');
                navigate('/meetings');
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
