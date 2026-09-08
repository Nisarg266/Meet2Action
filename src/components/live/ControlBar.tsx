import React from 'react';
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, Users, PhoneOff, MonitorX } from 'lucide-react';

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
  mode,
}) => {
  const [screenShareNotice, setScreenShareNotice] = React.useState(false);

  const handleScreenShare = () => {
    if (mode === 'demo' && !isScreenSharing) {
      setScreenShareNotice(true);
      setTimeout(() => setScreenShareNotice(false), 2600);
    }
    onToggleScreenShare();
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
