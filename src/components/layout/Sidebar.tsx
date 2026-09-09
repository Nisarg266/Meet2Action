import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import {
  LayoutDashboard,
  Video,
  CalendarPlus,
  Radio,
  CircleDot,
  CheckSquare,
  KanbanSquare,
  MessageSquare,
  UserCheck,
  Users,
  Contact,
  Calendar,
  FileText,
  Share2,
  Cpu,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Avatar } from '../common/Avatar';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onMobileClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { actionItems } = useAppStore();
  const location = useLocation();

  const openActionItemsCount = actionItems.filter((a) => a.status !== 'done').length;

  const navSections = [
    {
      label: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'MEETINGS',
      items: [
        { name: 'All Meetings', path: '/meetings', icon: Video },
        { name: 'Start Live Meeting', path: '/live-meeting', icon: Radio, badge: 'LIVE', badgeColor: 'bg-rose-100 text-rose-700' },
        { name: 'Recordings', path: '/recordings', icon: CircleDot },
        { name: 'Analyze Transcript', path: '/analyze', icon: Sparkles, badge: 'AI', badgeColor: 'bg-sky-100 text-sky-700' },
        { name: 'Schedule Meeting', path: '/schedule', icon: CalendarPlus },
      ],
    },
    {
      label: 'WORKSPACE',
      items: [
        {
          name: 'Action Items',
          path: '/action-items',
          icon: CheckSquare,
          count: openActionItemsCount,
        },
        { name: 'Kanban Board', path: '/kanban', icon: KanbanSquare },
        { name: 'Decisions', path: '/decisions', icon: MessageSquare },
        { name: 'My Tasks', path: '/action-items?filter=my', icon: UserCheck },
      ],
    },
    {
      label: 'TEAM',
      items: [
        { name: 'Team Members', path: '/team', icon: Users },
        { name: 'Contacts', path: '/contacts', icon: Contact },
      ],
    },
    {
      label: 'TOOLS',
      items: [
        { name: 'Calendar', path: '/calendar', icon: Calendar },
        { name: 'Transcripts', path: '/transcript/meet-q4-strategy', icon: FileText },
        { name: 'Exports', path: '/exports', icon: Share2 },
        { name: 'Integrations', path: '/integrations', icon: Cpu },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-[#F8FAFC] border-r border-slate-200 transition-all duration-300 ease-in-out select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-18' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 shrink-0">
          <NavLink
            to="/dashboard"
            onClick={onMobileClose}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#0284C7] to-[#006194] flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0 group-hover:brightness-105 transition-all">
              M
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-[15px] text-slate-900 tracking-tight">
                    MeetFlow AI
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-sky-100 text-sky-700 rounded-sm">
                    AI
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 truncate -mt-0.5">
                  Meet. Understand. Act.
                </span>
              </div>
            )}
          </NavLink>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase py-1">
                  {section.label}
                </div>
              ) : (
                <div className="h-2" />
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path.includes('?')
                    ? location.pathname + location.search === item.path
                    : location.pathname === item.path ||
                      (item.path !== '/dashboard' &&
                        item.path !== '/meetings' &&
                        location.pathname.startsWith(item.path));

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={onMobileClose}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-sky-50 text-sky-800 border border-sky-200/80 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-sky-700' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}

                    {!isCollapsed && item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-sky-200/80 text-sky-900' : 'bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Utilities & Profile */}
        <div className="p-3 border-t border-slate-200/80 space-y-1 bg-slate-50/50 shrink-0">
          <NavLink
            to="/settings"
            onClick={onMobileClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>

          <NavLink
            to="/help"
            onClick={onMobileClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title={isCollapsed ? 'Help & Support' : undefined}
          >
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            {!isCollapsed && <span>Help &amp; Support</span>}
          </NavLink>

          {/* User Profile Pill */}
          <div className="pt-2 mt-1 border-t border-slate-200">
            <div
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-2xs transition-all cursor-pointer ${
                isCollapsed ? 'justify-center' : 'justify-between'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar
                  name="Alex Mercer"
                  size="sm"
                  indicator="online"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                />
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      Alex Mercer
                    </span>
                    <span className="text-[11px] text-slate-500 truncate -mt-0.5">
                      Product Lead
                    </span>
                  </div>
                )}
              </div>
              {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
