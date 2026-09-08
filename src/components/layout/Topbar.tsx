import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store/appStore';
import {
  Search,
  Plus,
  LogIn,
  Radio,
  Bell,
  Menu,
  Building2,
  ChevronDown,
  Sparkles,
  Check,
  CheckCircle2,
  X,
  ExternalLink,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { generateRoomName } from '../../services/livekitService';

interface TopbarProps {
  onMobileMenuClick: () => void;
}

const WORKSPACES = [
  { id: 'ws-1', name: 'Acme Corp', sub: 'Product Team', color: 'bg-sky-500' },
  { id: 'ws-2', name: 'Stark Industries', sub: 'Engineering Lab', color: 'bg-indigo-500' },
  { id: 'ws-3', name: 'NeuralScale AI', sub: 'Executive Council', color: 'bg-emerald-500' },
];

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuClick }) => {
  const {
    setSearchModalOpen,
    setShowSplash,
    currentWorkspace,
    setCurrentWorkspace,
    notifications,
    markAllNotificationsRead,
    dismissNotification,
    addToast
  } = useAppStore();

  const navigate = useNavigate();
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setIsWorkspaceOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSelectWorkspace = (name: string, sub: string) => {
    const combined = `${name} · ${sub}`;
    setCurrentWorkspace(combined);
    setIsWorkspaceOpen(false);
    addToast(`Switched workspace to "${name}"`, 'info');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
      {/* Left: Mobile Toggle & Workspace Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Interactive Workspace Dropdown */}
        <div className="relative" ref={workspaceRef}>
          <button
            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left group cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">
                {currentWorkspace.split('·')[0] || 'Acme Corp'}
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                {currentWorkspace.split('·')[1] || 'Product Team'}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${
                isWorkspaceOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {isWorkspaceOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 space-y-1"
              >
                <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                  Select Workspace
                </div>
                {WORKSPACES.map((ws) => {
                  const isCurrent = currentWorkspace.includes(ws.name);
                  return (
                    <button
                      key={ws.id}
                      onClick={() => handleSelectWorkspace(ws.name, ws.sub)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isCurrent ? 'bg-sky-50 text-sky-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${ws.color}`} />
                        <div>
                          <div className="text-xs font-bold">{ws.name}</div>
                          <div className="text-[11px] text-slate-500">{ws.sub}</div>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-sky-600" />}
                    </button>
                  );
                })}

                <div className="pt-2 mt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsWorkspaceOpen(false);
                      addToast('Create workspace modal is available in Enterprise tier', 'info');
                    }}
                    className="w-full flex items-center gap-2 p-2 text-xs font-semibold text-slate-600 hover:text-sky-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Workspace</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Center: Search Input Bar triggering Modal */}
      <div className="flex-1 max-w-lg hidden md:block">
        <button
          onClick={() => setSearchModalOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
            <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors truncate">
              Search transcripts, decisions, tasks...
            </span>
          </div>
          <kbd className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Replay Splash Screen Button */}
        <button
          onClick={() => setShowSplash(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 rounded-xl transition-all cursor-pointer shadow-2xs group"
          title="Replay Animated AI Splash Intro"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600 group-hover:rotate-12 transition-transform" />
          <span className="hidden xl:inline">Replay Intro</span>
        </button>

        {/* Mobile search icon */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Join Meeting button — lobby with room code */}
        <button
          onClick={() => navigate('/live-meeting')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5 text-slate-500" />
          <span>Join Meeting</span>
        </button>

        {/* Start Live Meeting Primary CTA — generates a unique room instantly */}
        <button
          onClick={() => navigate(`/live-meeting/${generateRoomName()}`)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Start Live Meeting</span>
          <span className="sm:hidden">Live</span>
        </button>

        {/* Interactive Notifications Center */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 space-y-2"
              >
                <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-display">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-700">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-semibold text-sky-700 hover:text-sky-800 cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                        notif.read
                          ? 'bg-white border-slate-100'
                          : 'bg-sky-50/50 border-sky-200/80 shadow-2xs'
                      }`}
                    >
                      <div
                        onClick={() => {
                          if (notif.link) navigate(notif.link);
                          setIsNotifOpen(false);
                        }}
                        className="cursor-pointer flex-1"
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              notif.type === 'decision'
                                ? 'bg-emerald-500'
                                : notif.type === 'action'
                                ? 'bg-sky-500'
                                : 'bg-indigo-500'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                          <span className="text-[10px] font-mono text-slate-400 ml-auto">{notif.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{notif.description}</p>
                      </div>

                      <button
                        onClick={() => dismissNotification(notif.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No new notifications.
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      navigate('/decisions');
                    }}
                    className="text-xs font-semibold text-sky-700 hover:text-sky-800"
                  >
                    View Consensus &amp; Decision Record &rarr;
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <button
          onClick={() => navigate('/settings')}
          className="p-0.5 rounded-full hover:ring-2 hover:ring-sky-200 transition-all cursor-pointer"
          title="Account Settings"
        >
          <Avatar
            name="Alex Mercer"
            size="sm"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
          />
        </button>
      </div>
    </header>
  );
};
