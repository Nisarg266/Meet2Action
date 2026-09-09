import React from 'react';
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, Users, PhoneOff, MonitorX, Smile } from 'lucide-react';
import { REACTION_EMOJIS } from './EmojiReactions';

interface ControlBarProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isPeopleOpen: boolean;
  chatUnread?: number;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onTogglePeople: () => void;
  onEndMeeting: () => void;
  onSendReaction?: (emoji: string) => void;
  mode: 'live' | 'demo';
}

type ControlState = 'default' | 'active' | 'muted' | 'danger';

const STATE_CLASSES: Record<ControlState, string> = {
  default: 'bg-slate-800 hover:bg-slate-700 text-slate-200',
  active: 'bg-sky-600 hover:bg-sky-500 text-white',
  muted: 'bg-rose-600/90 hover:bg-rose-500 text-white',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs',
};

const ControlButton: React.FC<{
  state?: ControlState;
  label: string;
  badge?: number;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ state = 'default', label, badge, onClick, children }) => (
  <button
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all cursor-pointer ${STATE_CLASSES[state]}`}
  >
    {children}
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold ring-2 ring-slate-950">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
);

export const ControlBar: React.FC<ControlBarProps> = ({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  isChatOpen,
  isPeopleOpen,
  chatUnread = 0,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onTogglePeople,
  onEndMeeting,
  onSendReaction,
  mode,
}) => {
  const [screenShareNotice, setScreenShareNotice] = React.useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isReactionPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsReactionPickerOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsReactionPickerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isReactionPickerOpen]);

  const handleScreenShare = () => {
    if (mode === 'demo' && !isScreenSharing) {
      setScreenShareNotice(true);
      setTimeout(() => setScreenShareNotice(false), 2600);
    }
    onToggleScreenShare();
  };

  const handleSendReaction = (emoji: string) => {
    if (onSendReaction) {
      onSendReaction(emoji);
    }
  };

  return (
    <div className="relative shrink-0 bg-slate-950 border-t border-slate-800 px-3 sm:px-5 py-3 flex items-center justify-center">
      <div className="flex items-center gap-2 sm:gap-2.5">
        <ControlButton
          label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          state={isMicOn ? 'default' : 'muted'}
          onClick={onToggleMic}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </ControlButton>

        <ControlButton
          label={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
          state={isCameraOn ? 'default' : 'muted'}
          onClick={onToggleCamera}
        >
          {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </ControlButton>

        <ControlButton
          label={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
          state={isScreenSharing ? 'active' : 'default'}
          onClick={handleScreenShare}
        >
          {isScreenSharing ? <MonitorX className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
        </ControlButton>

        <span className="w-px h-8 bg-slate-800 mx-0.5 sm:mx-1" />

        {/* EMOJI REACTIONS BUTTON & FLOATING PICKER */}
        <div className="relative" ref={pickerRef}>
          <ControlButton
            label="React with emoji"
            state={isReactionPickerOpen ? 'active' : 'default'}
            onClick={() => setIsReactionPickerOpen((prev) => !prev)}
          >
            <Smile className="w-5 h-5" />
          </ControlButton>

          {isReactionPickerOpen && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 sm:p-2 shadow-2xl z-50 flex items-center gap-1 sm:gap-1.5 animate-in fade-in zoom-in-95 duration-150">
              {REACTION_EMOJIS.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  title={r.label}
                  onClick={() => handleSendReaction(r.emoji)}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-xl sm:text-2xl hover:bg-slate-800 hover:scale-125 active:scale-95 transition-all cursor-pointer select-none"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <ControlButton
          label="Meeting chat"
          state={isChatOpen ? 'active' : 'default'}
          badge={isChatOpen ? 0 : chatUnread}
          onClick={onToggleChat}
        >
          <MessageSquare className="w-5 h-5" />
        </ControlButton>

        <ControlButton
          label="Participant list"
          state={isPeopleOpen ? 'active' : 'default'}
          onClick={onTogglePeople}
        >
          <Users className="w-5 h-5" />
        </ControlButton>

        <span className="w-px h-8 bg-slate-800 mx-0.5 sm:mx-1" />

        <ControlButton label="End meeting" state="danger" onClick={onEndMeeting}>
          <PhoneOff className="w-5 h-5" />
        </ControlButton>
      </div>

      {screenShareNotice && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 border border-amber-500/40 text-amber-300 text-xs px-3.5 py-2 rounded-xl shadow-xl whitespace-nowrap z-20">
          Screen sharing requires a LiveKit connection — currently in Demo Mode
        </div>
      )}
    </div>
  );
};
