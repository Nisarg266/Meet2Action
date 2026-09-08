import React from 'react';
import { ActionItem } from '../../types';
import { useAppStore } from '../../store/appStore';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { PriorityBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { Check, Edit2, Trash2 } from 'lucide-react';

interface ActionItemTableProps {
  items: ActionItem[];
  onEditItem: (item: ActionItem) => void;
}

export const ActionItemTable: React.FC<ActionItemTableProps> = ({ items, onEditItem }) => {
  const { updateActionItemStatus, confirmActionItem, rejectActionItem } = useAppStore();

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3 px-4 w-10">Done</th>
              <th className="py-3 px-4 min-w-[220px]">Task</th>
              <th className="py-3 px-4 min-w-[140px]">Assignee</th>
              <th className="py-3 px-4 min-w-[120px]">Deadline</th>
              <th className="py-3 px-4 min-w-[100px]">Priority</th>
              <th className="py-3 px-4 min-w-[120px]">Status</th>
              <th className="py-3 px-4 min-w-[140px]">AI Confidence</th>
              <th className="py-3 px-4 text-right min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Complete Checkbox */}
                <td className="py-3 px-4">
                  <button
                    onClick={() =>
                      updateActionItemStatus(item.id, item.status === 'done' ? 'todo' : 'done')
                    }
                    className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors ${
                      item.status === 'done'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                  >
                    {item.status === 'done' && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </button>
                </td>

                {/* Task Name */}
                <td className="py-3 px-4 font-medium text-slate-900">
                  <span
                    className={item.status === 'done' ? 'line-through text-slate-400' : ''}
                  >
                    {item.task}
                  </span>
                  {item.meetingTitle && (
                    <span className="block text-[11px] text-slate-400 font-normal">
                      {item.meetingTitle}
                    </span>
                  )}
                </td>

                {/* Assignee */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Avatar name={item.assignee || 'Unassigned'} size="xs" src={item.assigneeAvatar} />
                    <span className="font-medium text-slate-800">{item.assignee || 'Unassigned'}</span>
                  </div>
                </td>

                {/* Deadline */}
                <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                  {item.deadline || 'No deadline'}
                </td>

                {/* Priority */}
                <td className="py-3 px-4">
                  <PriorityBadge priority={item.priority} size="sm" />
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      updateActionItemStatus(item.id, e.target.value as ActionItem['status'])
                    }
                    className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 cursor-pointer"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </td>

                {/* Confidence */}
                <td className="py-3 px-4">
                  <ConfidenceIndicator confidence={item.confidence} size="sm" />
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                    {!item.isConfirmed && (
                      <button
                        onClick={() => confirmActionItem(item.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Confirm"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onEditItem(item)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => rejectActionItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Reject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
