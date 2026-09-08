import React, { useState } from 'react';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { useAppStore } from '../store/appStore';
import {
  KanbanSquare,
  Plus,
  FileDown,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { exportTasksToCSV } from '../utils/exportUtils';
import { Modal } from '../components/common/Modal';
import { PriorityLevel } from '../types';

export const Kanban: React.FC = () => {
  const { actionItems, addActionItem } = useAppStore();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [assignee, setAssignee] = useState('Rahul Patel');
  const [deadline, setDeadline] = useState('Sep 15, 2026');
  const [priority, setPriority] = useState<PriorityLevel>('High');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addActionItem({
      meetingId: 'meet-q4-strategy',
      meetingTitle: 'Sprint Board',
      task: taskTitle.trim(),
      assignee,
      deadline,
      priority,
      status: 'todo',
      confidence: 96,
      isConfirmed: true,
      originalDeadlinePhrase: 'manual entry',
    });

    setTaskTitle('');
    setIsNewTaskOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
            <KanbanSquare className="w-3.5 h-3.5 text-sky-600" />
            Sprint Flow Board
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Interactive Kanban Board
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Drag and drop tasks between execution stages with live synchronization across all meeting views.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportTasksToCSV(actionItems)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Component */}
      <KanbanBoard />

      {/* Quick Add Modal */}
      <Modal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        title="Add Kanban Card"
        subtitle="Create a new deliverable in the sprint board"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Name
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Conduct load testing on payment webhook consumer"
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assignee
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Deadline
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-lg"
            >
              Create Card
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
