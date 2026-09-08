import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppStore } from '../store/appStore';
import { ActionItemCard } from '../components/action-items/ActionItemCard';
import { ActionItemTable } from '../components/action-items/ActionItemTable';
import { ActionItem, PriorityLevel, TaskStatus } from '../types';
import { ActionItemEditModal } from '../components/action-items/ActionItemEditModal';
import {
  CheckSquare,
  Search,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Plus,
  FileDown,
  Sparkles,
  X,
  RotateCcw
} from 'lucide-react';
import { exportTasksToCSV, exportTasksToMarkdown } from '../utils/exportUtils';
import { Modal } from '../components/common/Modal';

export const ActionItems: React.FC = () => {
  const { actionItems, addActionItem, addToast } = useAppStore();
  const [searchParams] = useSearchParams();
  const filterQuery = searchParams.get('filter');

  const [search, setSearch] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>(
    filterQuery === 'my' ? 'all' : filterQuery === 'review' ? 'all' : 'all'
  );
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [confidenceMin, setConfidenceMin] = useState<number>(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);

  // New item form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Rahul Patel');
  const [newTaskDeadline, setNewTaskDeadline] = useState('Sep 15, 2026');
  const [newTaskPriority, setNewTaskPriority] = useState<PriorityLevel>('High');

  const assignees = useMemo(() => {
    const set = new Set<string>();
    actionItems.forEach((i) => {
      if (i.assignee) set.add(i.assignee);
    });
    return Array.from(set);
  }, [actionItems]);

  const filteredItems = useMemo(() => {
    return actionItems.filter((item) => {
      // My tasks shortcut
      if (filterQuery === 'my' && item.assignee !== 'Alex Mercer') {
        return false;
      }
      // Needs review shortcut
      if (filterQuery === 'review' && item.confidence >= 70) {
        return false;
      }

      const matchesSearch =
        !search.trim() ||
        item.task.toLowerCase().includes(search.toLowerCase()) ||
        (item.assignee && item.assignee.toLowerCase().includes(search.toLowerCase())) ||
        (item.meetingTitle && item.meetingTitle.toLowerCase().includes(search.toLowerCase()));

      const matchesAssignee = selectedAssignee === 'all' || item.assignee === selectedAssignee;
      const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesConfidence = item.confidence >= confidenceMin;

      return matchesSearch && matchesAssignee && matchesPriority && matchesStatus && matchesConfidence;
    });
  }, [actionItems, search, selectedAssignee, selectedPriority, selectedStatus, confidenceMin, filterQuery]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedAssignee('all');
    setSelectedPriority('all');
    setSelectedStatus('all');
    setConfidenceMin(0);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addActionItem({
      meetingId: 'meet-q4-strategy',
      meetingTitle: 'Sprint Backlog',
      task: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      deadline: newTaskDeadline,
      priority: newTaskPriority,
      status: 'todo',
      confidence: 98,
      isConfirmed: true,
      originalDeadlinePhrase: 'manually added',
    });

    setNewTaskTitle('');
    setIsAddModalOpen(false);
  };

  const hasActiveFilters =
    search || selectedAssignee !== 'all' || selectedPriority !== 'all' || selectedStatus !== 'all' || confidenceMin > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
            <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
            Execution Ledger
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Action Items &amp; Deliverables
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Normalized commitments extracted from speech with assignees, dates, and precision confidence.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportTasksToCSV(filteredItems)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => exportTasksToMarkdown(filteredItems)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Markdown</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filter & View Mode Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by task, assignee, or meeting..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Switcher: Cards vs Table */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Cards view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Assignee */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-slate-400 font-medium">Assignee:</span>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All ({actionItems.length})</option>
              {assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-slate-400 font-medium">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Confidence Minimum */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-slate-400 font-medium">Confidence:</span>
            <select
              value={confidenceMin}
              onChange={(e) => setConfidenceMin(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-800 outline-hidden cursor-pointer"
            >
              <option value={0}>All Confidence</option>
              <option value={90}>&gt;= 90% High</option>
              <option value={70}>&gt;= 70% Medium</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 ml-auto px-2 py-1 text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Items Display */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              <ActionItemCard item={item} />
            </motion.div>
          ))}
        </div>
      ) : (
        <ActionItemTable
          items={filteredItems}
          onEditItem={(item) => setEditingItem(item)}
        />
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 font-display">
            No action items match your filters
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Try adjusting search terms or resetting the assignee and confidence filters to view the full ledger.
          </p>
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Action Item"
        subtitle="Manually register an action commitment"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Description
            </label>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Conduct user feedback interviews with enterprise leads"
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
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Deadline
              </label>
              <input
                type="text"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
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

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-lg"
            >
              Create Action Item
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      {editingItem && (
        <ActionItemEditModal
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          item={editingItem}
        />
      )}
    </motion.div>
  );
};
