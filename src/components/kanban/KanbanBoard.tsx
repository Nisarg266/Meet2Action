import React, { useState } from 'react';
import { ActionItem, TaskStatus } from '../../types';
import { useAppStore } from '../../store/appStore';
import { PriorityBadge } from '../common/Badge';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { Avatar } from '../common/Avatar';
import {
  Calendar,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CheckSquare
} from 'lucide-react';
import { ActionItemEditModal } from '../action-items/ActionItemEditModal';

const COLUMNS: { id: TaskStatus; label: string; color: string; countColor: string }[] = [
  { id: 'todo', label: 'To Do', color: 'border-slate-300', countColor: 'bg-slate-200 text-slate-700' },
  { id: 'in-progress', label: 'In Progress', color: 'border-sky-400', countColor: 'bg-sky-100 text-sky-800' },
  { id: 'review', label: 'In Review', color: 'border-amber-400', countColor: 'bg-amber-100 text-amber-800' },
  { id: 'done', label: 'Done', color: 'border-emerald-400', countColor: 'bg-emerald-100 text-emerald-800' },
];

export const KanbanBoard: React.FC = () => {
  const { actionItems, updateActionItemStatus, addActionItem } = useAppStore();
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [quickAddColumn, setQuickAddColumn] = useState<TaskStatus | null>(null);
  const [quickTaskText, setQuickTaskText] = useState('');

  const handleDragStart = (id: string) => {
    setDraggedItemId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: TaskStatus) => {
    if (draggedItemId) {
      updateActionItemStatus(draggedItemId, status);
      setDraggedItemId(null);
    }
  };

  const moveItem = (id: string, currentStatus: TaskStatus, direction: 'prev' | 'next') => {
    const statusOrder: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < statusOrder.length) {
      updateActionItemStatus(id, statusOrder[targetIndex]);
    }
  };

  const handleQuickAdd = (status: TaskStatus) => {
    if (!quickTaskText.trim()) return;
    addActionItem({
      meetingId: 'meet-q4-strategy',
      meetingTitle: 'Sprint Backlog',
      task: quickTaskText.trim(),
      assignee: 'Alex Mercer',
      deadline: 'Sep 15, 2026',
      priority: 'Medium',
      confidence: 95,
      status,
      isConfirmed: true,
    });
    setQuickTaskText('');
    setQuickAddColumn(null);
  };

  return (
    <div className="w-full h-full pb-8">
      {/* 4 Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4.5 items-start">
        {COLUMNS.map((col) => {
          const colItems = actionItems.filter((item) => item.status === col.id);

          return (
            <div
              key={col.id}
              id={`kanban-column-${col.id}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
              className="bg-slate-100/70 border border-slate-200/90 rounded-2xl p-3.5 flex flex-col min-h-[560px] transition-colors"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.color.replace('border-', 'bg-')}`} />
                  <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-800">
                    {col.label}
                  </h3>
                  <span
                    className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${col.countColor}`}
                  >
                    {colItems.length}
                  </span>
                </div>

                <button
                  onClick={() => setQuickAddColumn(quickAddColumn === col.id ? null : col.id)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
                  title="Add card"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Add Card Input */}
              {quickAddColumn === col.id && (
                <div className="mb-3 bg-white p-3 rounded-xl border border-sky-300 shadow-xs animate-in fade-in">
                  <input
                    type="text"
                    autoFocus
                    value={quickTaskText}
                    onChange={(e) => setQuickTaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd(col.id);
                      if (e.key === 'Escape') setQuickAddColumn(null);
                    }}
                    placeholder="Enter task title and press Enter..."
                    className="w-full text-xs text-slate-800 placeholder:text-slate-400 outline-hidden pb-2"
                  />
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setQuickAddColumn(null)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleQuickAdd(col.id)}
                      className="text-[11px] font-semibold text-white bg-sky-600 hover:bg-sky-700 px-2.5 py-1 rounded-md"
                    >
                      Add Card
                    </button>
                  </div>
                </div>
              )}

              {/* Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[75vh] pr-0.5">
                {colItems.map((item) => (
                  <div
                    key={item.id}
                    id={`kanban-card-${item.id}`}
                    draggable
                    onDragStart={() => handleDragStart(item.id)}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing group select-none"
                  >
                    {/* Priority & Confidence */}
                    <div className="flex items-center justify-between gap-1.5 mb-2.5">
                      <PriorityBadge priority={item.priority} size="sm" />
                      <ConfidenceIndicator confidence={item.confidence} size="sm" showNeedsReviewText={false} />
                    </div>

                    {/* Task Title */}
                    <h4
                      onClick={() => setEditingItem(item)}
                      className="text-xs font-semibold text-slate-900 line-clamp-2 hover:text-sky-700 cursor-pointer leading-snug"
                    >
                      {item.task}
                    </h4>

                    {/* Deadline */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-2.5">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{item.deadline || 'No deadline'}</span>
                    </div>

                    {/* Footer: Assignee & Column Mover Arrows */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar
                          name={item.assignee || 'Unassigned'}
                          size="xs"
                          src={item.assigneeAvatar}
                        />
                        <span className="text-xs font-medium text-slate-700 truncate">
                          {item.assignee || 'Unassigned'}
                        </span>
                      </div>

                      {/* Direction Shift Controls */}
                      <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        {col.id !== 'todo' && (
                          <button
                            onClick={() => moveItem(item.id, col.id, 'prev')}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="Move back"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        )}
                        {col.id !== 'done' && (
                          <button
                            onClick={() => moveItem(item.id, col.id, 'next')}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="Move forward"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {col.id === 'done' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {colItems.length === 0 && (
                  <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center flex flex-col items-center justify-center p-4">
                    <CheckSquare className="w-6 h-6 text-slate-300 mb-1" />
                    <span className="text-xs text-slate-400">Drag tasks here</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editingItem && (
        <ActionItemEditModal
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          item={editingItem}
        />
      )}
    </div>
  );
};
