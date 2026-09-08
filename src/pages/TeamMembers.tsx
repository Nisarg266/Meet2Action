import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/appStore';
import { Avatar } from '../components/common/Avatar';
import {
  Users,
  Search,
  CheckSquare,
  Clock,
  ShieldCheck,
  Sparkles,
  Mail,
  Filter,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { PriorityLevel } from '../types';

interface MemberProfile {
  id: string;
  name: string;
  role: string;
  department: 'Engineering' | 'Product' | 'Design' | 'Marketing';
  avatar: string;
  email: string;
  talkTimeShare: string;
  meetingsAttended: number;
  openTasks: number;
  completedTasks: number;
  reliabilityScore: number;
  status: 'online' | 'in-meeting' | 'away';
}

const TEAM_MEMBERS: MemberProfile[] = [
  {
    id: 'mem-1',
    name: 'Alex Mercer',
    role: 'Product Lead (Host)',
    department: 'Product',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    email: 'alex@acme.com',
    talkTimeShare: '31%',
    meetingsAttended: 18,
    openTasks: 2,
    completedTasks: 14,
    reliabilityScore: 98,
    status: 'online',
  },
  {
    id: 'mem-2',
    name: 'Rahul Patel',
    role: 'Senior Product Designer',
    department: 'Design',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    email: 'rahul@acme.com',
    talkTimeShare: '22%',
    meetingsAttended: 16,
    openTasks: 1,
    completedTasks: 9,
    reliabilityScore: 96,
    status: 'online',
  },
  {
    id: 'mem-3',
    name: 'Amit Shah',
    role: 'Principal Backend Lead',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    email: 'amit@acme.com',
    talkTimeShare: '18%',
    meetingsAttended: 21,
    openTasks: 2,
    completedTasks: 17,
    reliabilityScore: 99,
    status: 'in-meeting',
  },
  {
    id: 'mem-4',
    name: 'Priya Mehta',
    role: 'Head of Marketing & GTM',
    department: 'Marketing',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    email: 'priya@acme.com',
    talkTimeShare: '14%',
    meetingsAttended: 12,
    openTasks: 2,
    completedTasks: 11,
    reliabilityScore: 94,
    status: 'online',
  },
  {
    id: 'mem-5',
    name: 'Jay Patel',
    role: 'Cloud Infrastructure Lead',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
    email: 'jay@acme.com',
    talkTimeShare: '10%',
    meetingsAttended: 15,
    openTasks: 1,
    completedTasks: 8,
    reliabilityScore: 95,
    status: 'away',
  },
  {
    id: 'mem-6',
    name: 'Neha Shah',
    role: 'Frontend Systems Lead',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    email: 'neha@acme.com',
    talkTimeShare: '5%',
    meetingsAttended: 14,
    openTasks: 0,
    completedTasks: 13,
    reliabilityScore: 97,
    status: 'online',
  },
];

export const TeamMembers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [assignModalMember, setAssignModalMember] = useState<MemberProfile | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('Sep 15, 2026');
  const [newTaskPriority, setNewTaskPriority] = useState<PriorityLevel>('High');
  const { addActionItem, addToast } = useAppStore();

  const filteredMembers = TEAM_MEMBERS.filter((m) => {
    const matchesSearch =
      !search.trim() ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || m.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !assignModalMember) return;

    addActionItem({
      meetingId: 'meet-q4-strategy',
      meetingTitle: 'Team Allocation',
      task: newTaskTitle.trim(),
      assignee: assignModalMember.name,
      assigneeRole: assignModalMember.role,
      assigneeAvatar: assignModalMember.avatar,
      deadline: newTaskDeadline,
      priority: newTaskPriority,
      status: 'todo',
      confidence: 99,
      isConfirmed: true,
      originalDeadlinePhrase: 'direct delegation',
    });

    setNewTaskTitle('');
    setAssignModalMember(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
            <Users className="w-3.5 h-3.5 text-sky-600" />
            Voice Intelligence &amp; Roster
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Team Members &amp; Speaker Profiles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track acoustic talk-time metrics, speaker commitment reliability, and delegate deliverables.
          </p>
        </div>

        {/* Global Stats Pill */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-2xs">
          <div>
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Average Quorum</span>
            <span className="text-base font-bold text-slate-900 font-display">96.8%</span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Voice Diarization</span>
            <span className="text-base font-bold text-emerald-600 font-display flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 6 Active
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, email..."
            className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'Engineering', 'Product', 'Design', 'Marketing'].map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                deptFilter === dept
                  ? 'bg-sky-700 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map((member, idx) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.35 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-sky-300/80 transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Member Top Bar */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={member.name} size="lg" src={member.avatar} />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                        member.status === 'online'
                          ? 'bg-emerald-500'
                          : member.status === 'in-meeting'
                          ? 'bg-rose-500 animate-pulse'
                          : 'bg-amber-400'
                      }`}
                      title={member.status}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display group-hover:text-sky-700 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-xs text-slate-500">{member.role}</p>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mt-1 inline-block">
                      {member.department}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  {member.reliabilityScore}% Score
                </span>
              </div>

              {/* Performance Metrics Breakdown */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center my-3 bg-slate-50/60 rounded-xl p-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Talk Share</span>
                  <span className="text-sm font-bold text-slate-900 font-display">{member.talkTimeShare}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Open Tasks</span>
                  <span className="text-sm font-bold text-sky-700 font-display">{member.openTasks}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Done Tasks</span>
                  <span className="text-sm font-bold text-emerald-600 font-display">{member.completedTasks}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {member.meetingsAttended} sessions logged
                </span>
                <span className="text-slate-400 font-mono text-[11px]">{member.email}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setAssignModalMember(member)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Delegate Task</span>
              </button>
              <a
                href={`mailto:${member.email}`}
                className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
                title="Send Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delegate Task Modal */}
      {assignModalMember && (
        <Modal
          isOpen={Boolean(assignModalMember)}
          onClose={() => setAssignModalMember(null)}
          title={`Assign Task to ${assignModalMember.name}`}
          subtitle={`Create a direct action item tracked in the AI sprint pipeline`}
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Deliverable Title
              </label>
              <input
                type="text"
                required
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Conduct accessibility audit on landing page v2"
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Deadline
                </label>
                <input
                  type="text"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as PriorityLevel)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignModalMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-lg shadow-2xs"
              >
                Assign &amp; Notify
              </button>
            </div>
          </form>
        </Modal>
      )}
    </motion.div>
  );
};
