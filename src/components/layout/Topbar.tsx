import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import {
  Search,
  Plus,
  LogIn,
  Bell,
  Menu,
  Building2,
  ChevronDown
} from 'lucide-react';
import { Avatar } from '../common/Avatar';

interface TopbarProps {
  onMobileMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuClick }) => {
  const { setSearchModalOpen } = useAppStore();
  const navigate = useNavigate();

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

        {/* Workspace selector (matches Stitch Image 1 & 7) */}
        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left group">
          <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-800">Acme Corp</span>
            <span className="text-xs text-slate-500 hidden sm:inline">Product Team</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors ml-0.5" />
        </button>
      </div>

      {/* Center: Search Input Bar triggering Modal */}
      <div className="flex-1 max-w-lg hidden md:block">
        <button
          onClick={() => setSearchModalOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-left transition-all group"
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
      <div className="flex items-center gap-2.5">
        {/* Mobile search icon */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Join Meeting button */}
        <button
          onClick={() => navigate('/meetings/meet-q4-strategy')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <LogIn className="w-3.5 h-3.5 text-slate-500" />
          <span>Join Meeting</span>
        </button>

        {/* New Meeting Primary CTA button */}
        <button
          onClick={() => navigate('/schedule')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-lg shadow-2xs hover:shadow-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Meeting</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => navigate('/decisions')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>
        </div>

        {/* Avatar */}
        <button
          onClick={() => navigate('/settings')}
          className="p-0.5 rounded-full hover:ring-2 hover:ring-sky-200 transition-all"
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
