import React, { useState } from 'react';
import { ActionItem, PriorityLevel, TaskStatus } from '../../types';
import { useAppStore } from '../../store/appStore';
import { Modal } from '../common/Modal';

interface ActionItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ActionItem;
}

export const ActionItemEditModal: React.FC<ActionItemEditModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const { editActionItem } = useAppStore();
  const [task, setTask] = useState(item.task);
  const [assignee, setAssignee] = useState(item.assignee || '');
  const [deadline, setDeadline] = useState(item.deadline || '');
  const [priority, setPriority] = useState<PriorityLevel>(item.priority);
  const [status, setStatus] = useState<TaskStatus>(item.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editActionItem(item.id, {
      task,
      assignee: assignee.trim() || null,
      deadline: deadline.trim() || null,
      priority,
      status,
      isConfirmed: true,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Action Item"
      subtitle="Modify task attributes extracted by MeetFlow AI"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Task Title
          </label>
          <input
            type="text"
            required
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Assignee
          </label>
          <input
            type="text"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="e.g. Rahul Patel"
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Deadline
          </label>
          <input
            type="text"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="e.g. Sep 11, 2026"
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg shadow-2xs transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};
