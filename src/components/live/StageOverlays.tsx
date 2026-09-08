import React from 'react';
import { X, Send, Users, Copy } from 'lucide-react';
import { useChat, useParticipants } from '@livekit/components-react';
import { Avatar } from '../common/Avatar';
import { LIVE_PERSONAS } from '../../services/liveAiService';
import { useAppStore } from '../../store/appStore';

export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: string;
  isLocal: boolean;
}

const OverlayShell: React.FC<{
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, icon, onClose, children, footer }) => (
  <div className="absolute top-3 right-3 z-30 w-[calc(100%-1.5rem)] sm:w-96 max-h-[calc(100%-1.5rem)] flex flex-col bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        {icon}
        {title}
      </span>
      <button
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
        aria-label="Close panel"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
    <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    {footer && <div className="border-t border-slate-800 px-4 py-2.5 shrink-0">{footer}</div>}
  </div>
);

const ChatBody: React.FC<{
  messages: ChatMessage[];
  onSend: (text: string) => void;
}> = ({ messages, onSend }) => {
  const [draft, setDraft] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[220px]">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center py-8">
            <Send className="w-5 h-5 text-slate-600" />
            <p className="text-xs text-slate-500">Messages sent here are visible to everyone in the room.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.isLocal ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] font-mono text-slate-500 mb-1">
              {m.isLocal ? 'You' : m.from} · {m.timestamp}
            </span>
            <div
              className={`max-w-[85%] px-3 py-2 text-[13px] leading-snug ${
                m.isLocal
                  ? 'bg-sky-600/90 text-white rounded-xl rounded-br-sm'
                  : 'bg-slate-800 text-slate-100 rounded-xl rounded-bl-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Send a message…"
            className="flex-1 min-w-0 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-sky-500"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="p-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};

export const DemoChatPanel: React.FC<{
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
}> = ({ messages, onSend, onClose }) => (
  <OverlayShell
    title="Meeting Chat"
    icon={<Send className="w-4 h-4 text-sky-400" />}
    onClose={onClose}
  >
    <ChatBody messages={messages} onSend={onSend} />
  </OverlayShell>
);

const LiveChatPanel: React.FC<{ onClose: () => void; onActivity: () => void }> = ({
  onClose,
  onActivity,
}) => {
  const { chatMessages, send } = useChat();
  const countRef = React.useRef(chatMessages.length);

  React.useEffect(() => {
    if (chatMessages.length > countRef.current) onActivity();
    countRef.current = chatMessages.length;
  }, [chatMessages.length, onActivity]);

  const messages: ChatMessage[] = chatMessages.map((m, i) => ({
    id: m.id || `chat-${i}-${m.timestamp}`,
    from: m.from?.name || m.from?.identity || 'Guest',
    text: m.message,
    timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isLocal: m.from?.isLocal === true,
  }));

  const handleSend = (text: string) => {
    void send(text);
  };

  return (
    <OverlayShell
      title="Meeting Chat"
      icon={<Send className="w-4 h-4 text-sky-400" />}
      onClose={onClose}
    >
      <ChatBody messages={messages} onSend={handleSend} />
    </OverlayShell>
  );
};

interface PersonRow {
  name: string;
  role: string;
  avatar?: string;
  isLocal: boolean;
  isHost: boolean;
  isSpeaking: boolean;
  micOff: boolean;
}

const LivePeopleRows: React.FC<{ localName: string }> = ({ localName }) => {
  const participants = useParticipants();
  const rows: PersonRow[] = participants.map((p) => ({
    name: p.isLocal ? `${localName} (You)` : p.name || p.identity || 'Guest',
    role: p.isLocal ? 'Host' : 'Participant',
    isLocal: p.isLocal,
    isHost: p.isLocal,
    isSpeaking: p.isSpeaking,
    micOff: !p.isMicrophoneEnabled,
  }));
  return <PeopleRows rows={rows} />;
};

const PeopleRows: React.FC<{ rows: PersonRow[] }> = ({ rows }) => (
  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 min-h-[200px]">
    {rows.map((row) => (
      <div
        key={row.name}
        className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl border transition-colors ${
          row.isSpeaking ? 'border-sky-500/60 bg-sky-500/10' : 'border-transparent hover:bg-slate-800/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={row.name} src={row.avatar} size="sm" />
          <div className="min-w-0 text-left">
            <div className="text-xs font-semibold text-slate-100 truncate">{row.name}</div>
            <div className="text-[10px] font-mono text-slate-500">{row.role}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {row.isSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />}
          {row.micOff && <span className="text-[9px] font-mono text-rose-400">MUTED</span>}
          {row.isHost && (
            <span className="text-[9px] font-mono font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              HOST
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
);

export const PeoplePanel: React.FC<{ mode: 'live' | 'demo'; localName: string; onClose: () => void }> = ({
  mode,
  localName,
  onClose,
}) => {
  const addToast = useAppStore((s) => s.addToast);

  const demoRows: PersonRow[] = [
    { name: `${localName} (You)`, role: 'Host', isLocal: true, isHost: true, isSpeaking: false, micOff: false },
    ...LIVE_PERSONAS.filter((p) => p.name !== localName).map((p) => ({
      name: p.name,
      role: p.role,
      avatar: p.avatar,
      isLocal: false,
      isHost: false,
      isSpeaking: false,
      micOff: false,
    })),
  ];

  const count = mode === 'demo' ? demoRows.length : undefined;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      addToast('Invite link copied to clipboard', 'success');
    } catch {
      addToast('Could not copy link — copy it from the top bar', 'warning');
    }
  };

  return (
    <OverlayShell
      title={`Participants${count !== undefined ? ` · ${count}` : ''}`}
      icon={<Users className="w-4 h-4 text-sky-400" />}
      onClose={onClose}
      footer={
        <button
          onClick={copyInvite}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-sky-300 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-xl transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy invite link
        </button>
      }
    >
      {mode === 'demo' ? (
        <PeopleRows rows={demoRows} />
      ) : (
        <LivePeopleRows localName={localName} />
      )}
    </OverlayShell>
  );
};

export interface StageOverlaysProps {
  mode: 'live' | 'demo';
  isChatOpen: boolean;
  isPeopleOpen: boolean;
  onCloseChat: () => void;
  onClosePeople: () => void;
  onChatActivity: () => void;
  demoChatMessages: ChatMessage[];
  onDemoChatSend: (text: string) => void;
  localName: string;
}

export const StageOverlays: React.FC<StageOverlaysProps> = ({
  mode,
  isChatOpen,
  isPeopleOpen,
  onCloseChat,
  onClosePeople,
  onChatActivity,
  demoChatMessages,
  onDemoChatSend,
  localName,
}) => (
  <>
    {isChatOpen &&
      (mode === 'live' ? (
        <LiveChatPanel onClose={onCloseChat} onActivity={onChatActivity} />
      ) : (
        <DemoChatPanel messages={demoChatMessages} onSend={onDemoChatSend} onClose={onCloseChat} />
      ))}
    {isPeopleOpen && <PeoplePanel mode={mode} localName={localName} onClose={onClosePeople} />}
  </>
);
