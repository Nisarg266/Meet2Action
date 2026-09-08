import React, { useState } from 'react';
import { Meeting, ActionItem } from '../../types';
import { useAppStore } from '../../store/appStore';
import { Avatar } from '../common/Avatar';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  PhoneOff,
  Smile,
  Subtitles,
  Sparkles,
  CheckCircle2,
  Clock,
  Check,
  Disc,
  MessageSquare,
  Users,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LiveMeetingIntelligenceProps {
  meeting: Meeting;
}

export const LiveMeetingIntelligence: React.FC<LiveMeetingIntelligenceProps> = ({ meeting }) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [activeTab, setActiveTab] = useState<'ai' | 'chat' | 'people'>('ai');
  const [activeSpeaker, setActiveSpeaker] = useState('Rahul Patel');
  const { actionItems, confirmActionItem, addToast } = useAppStore();
  const navigate = useNavigate();

  const meetingActionItems = actionItems.filter((i) => i.meetingId === meeting.id);

  const participants = meeting.participantDetails || [
    { name: 'Alex Mercer', role: 'Product Lead (Host)', talkTime: '14:02', isHost: true },
    { name: 'Rahul Patel', role: 'Product Designer', talkTime: '09:41' },
    { name: 'Amit Shah', role: 'Backend Lead', talkTime: '06:18' },
    { name: 'Priya Mehta', role: 'Marketing Lead', talkTime: '05:44' },
  ];

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 h-full min-h-[640px]">
      {/* Left: Video Stage & Controls */}
      <div className="flex-1 flex flex-col bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
        {/* Stage Header Info */}
        <div className="px-4 py-3 bg-slate-900/80 backdrop-blur-xs border-b border-slate-800 flex items-center justify-between text-white z-10">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-900/60 text-rose-300 border border-rose-700/50 text-[11px] font-mono font-semibold">
              <Disc className="w-3 h-3 text-rose-400 animate-pulse" />
              {meeting.recordingDuration || 'REC 42:15'}
            </span>
            <h3 className="text-xs sm:text-sm font-semibold tracking-tight truncate max-w-xs sm:max-w-md">
              {meeting.title}
            </h3>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>MacBook Pro Mic</span>
            <span>·</span>
            <span className="text-emerald-400 font-medium">1080p Studio</span>
          </div>
        </div>

        {/* Video Tiles Grid */}
        <div className="flex-1 p-3 sm:p-4 grid grid-cols-2 gap-3 min-h-[360px] relative items-stretch">
          {participants.slice(0, 4).map((p) => {
            const isSpeaking = activeSpeaker === p.name;

            return (
              <div
                key={p.name}
                onClick={() => setActiveSpeaker(p.name)}
                className={`relative rounded-xl overflow-hidden bg-slate-900 border flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isSpeaking
                    ? 'border-sky-500 shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Simulated Camera Feed / Avatar */}
                <div className="flex flex-col items-center gap-2 z-0">
                  <Avatar name={p.name} size="xl" src={p.avatar} />
                  <div className="text-center">
                    <span className="text-xs sm:text-sm font-semibold text-white block">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-slate-400 block -mt-0.5">
                      {p.role}
                    </span>
                  </div>
                </div>

                {/* Speaking Indicator Glow */}
                {isSpeaking && (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-sky-950/80 border border-sky-600/50 text-sky-300 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                    Speaking
                  </div>
                )}

                {/* Talk Time */}
                {p.talkTime && (
                  <div className="absolute top-2.5 right-2.5 text-[10px] font-mono text-slate-400 bg-slate-950/70 px-1.5 py-0.5 rounded">
                    {p.talkTime}
                  </div>
                )}
              </div>
            );
          })}

          {/* Bottom Live Caption Floating Ticker */}
          <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                Live Speech-to-Text Pipeline (Whisper NeMo)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200">
              <strong className="text-sky-400 font-semibold">{activeSpeaker}:</strong> &ldquo;I&apos;ll finish the landing page redesign by Friday, including responsive mobile layouts.&rdquo;
            </p>
          </div>
        </div>

        {/* Video Controls Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-2.5 rounded-xl text-white transition-colors ${
                isMicOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-rose-600 hover:bg-rose-500'
              }`}
              title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-2.5 rounded-xl text-white transition-colors ${
                isVideoOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-rose-600 hover:bg-rose-500'
              }`}
              title={isVideoOn ? 'Stop Video' : 'Start Video'}
            >
              {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => addToast('Screen sharing permissions verified', 'info')}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
              title="Share Screen"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
              title="Reactions"
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
              title="Captions"
            >
              <Subtitles className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              addToast('Meeting ended and stored into archive', 'info');
              navigate('/action-items');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* Right: AI Intelligence Panel & Real-time Dossier */}
      <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col overflow-hidden shrink-0">
        {/* Panel Tabs */}
        <div className="flex items-center border-b border-slate-200 px-3 pt-2 bg-slate-50/70">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'ai'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            AI Intelligence
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'people'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            People ({participants.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'chat'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'ai' && (
            <>
              {/* Live Action Item Detection Box */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <span>Detected Action Items</span>
                  <span className="text-sky-600 font-semibold">{meetingActionItems.length} active</span>
                </div>

                <div className="space-y-2.5">
                  {meetingActionItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 leading-snug">
                          {item.task}
                        </span>
                        <ConfidenceIndicator confidence={item.confidence} size="sm" showNeedsReviewText={false} />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5">
                          <Avatar name={item.assignee || 'Unassigned'} size="xs" src={item.assigneeAvatar} />
                          <span>{item.assignee}</span>
                        </div>
                        <span className="font-mono text-slate-700 font-medium">{item.deadline}</span>
                      </div>

                      {!item.isConfirmed && (
                        <button
                          onClick={() => confirmActionItem(item.id)}
                          className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-white bg-sky-600 hover:bg-sky-700 py-1.5 rounded-lg transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Confirm Action Item
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Decisions Stream */}
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Key Agreements
                </div>
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                  <div className="flex items-center gap-1 text-emerald-800 text-[11px] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Consensus Confirmed (94%)
                  </div>
                  <p className="text-xs font-medium text-emerald-950">
                    Launch version 2 next Monday across all staging channels.
                  </p>
                </div>
              </div>

              {/* View Full Analysis Link */}
              <div className="pt-2">
                <button
                  onClick={() => navigate('/action-items')}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-colors"
                >
                  <span>Open Full Action Items Workspace</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </>
          )}

          {activeTab === 'people' && (
            <div className="space-y-3">
              {participants.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={p.name} size="sm" src={p.avatar} />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">{p.name}</span>
                      <span className="text-[11px] text-slate-400 block -mt-0.5">{p.role}</span>
                    </div>
                  </div>
                  {p.talkTime && (
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {p.talkTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-900 block mb-1">Alex Mercer (10:31):</span>
                Let&apos;s make sure all pull requests are tagged with #v2-launch.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-900 block mb-1">Amit Shah (10:34):</span>
                Stripe sandbox webhook verification passed 100%.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
