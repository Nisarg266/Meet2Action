import React, { useState } from 'react';
import { ActionItem } from '../../types';
import { useAppStore } from '../../store/appStore';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { PriorityBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import {
  ChevronDown,
  ChevronUp,
  Check,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  Quote,
  Tag,
  User
} from 'lucide-react';
import { ActionItemEditModal } from './ActionItemEditModal';

interface ActionItemCardProps {
  item: ActionItem;
  onJumpToTranscript?: (actionItemId: string) => void;
}

export const ActionItemCard: React.FC<ActionItemCardProps> = ({
  item,
  onJumpToTranscript,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { updateActionItemStatus, confirmActionItem, rejectActionItem } = useAppStore();

  const handleStatusChange = (newStatus: ActionItem['status']) => {
    updateActionItemStatus(item.id, newStatus);
  };

  return (
    <>
      <div
        id={`action-item-${item.id}`}
        className={`bg-white border rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all ${
          item.isConfirmed ? 'border-slate-200' : 'border-amber-200/80 bg-amber-50/15'
        }`}
      >
        {/* Card Header & Task Title */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Quick Complete Checkbox */}
            <button
              onClick={() => handleStatusChange(item.status === 'done' ? 'todo' : 'done')}
              className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                item.status === 'done'
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 hover:border-slate-400 bg-white'
              }`}
              title={item.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
            >
              {item.status === 'done' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>

            <div className="min-w-0">
              <h4
                className={`text-sm sm:text-base font-semibold text-slate-900 tracking-tight leading-snug ${
                  item.status === 'done' ? 'line-through text-slate-400' : ''
                }`}
              >
                {item.task}
              </h4>

              {item.meetingTitle && (
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                  {item.meetingTitle}
                </span>
              )}
            </div>
          </div>

          {/* Right Badges: Priority & Confidence */}
          <div className="flex items-center gap-2 self-start shrink-0 flex-wrap">
            <PriorityBadge priority={item.priority} size="sm" />
            <ConfidenceIndicator confidence={item.confidence} size="sm" />
          </div>
        </div>

        {/* Card Metadata Row: Assignee, Deadline, Status Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3 border-t border-slate-100">
          {/* Assignee */}
          <div className="flex items-center gap-2">
            <Avatar
              name={item.assignee || 'Unassigned'}
              src={item.assigneeAvatar}
              size="sm"
            />
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-800 block">
                {item.assignee || 'Unassigned'}
              </span>
              {item.assigneeRole && (
                <span className="text-[11px] text-slate-400 -mt-0.5 block">
                  {item.assigneeRole}
                </span>
              )}
            </div>
          </div>

          {/* Deadline with Spoken Context */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-mono text-[12px] text-slate-800">{item.deadline || 'No deadline'}</span>
            {item.originalDeadlinePhrase && (
              <span className="text-[11px] text-slate-400 font-normal italic hidden md:inline">
                (&ldquo;{item.originalDeadlinePhrase}&rdquo;)
              </span>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={item.status}
              onChange={(e) => handleStatusChange(e.target.value as ActionItem['status'])}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 hover:border-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        {/* Evidence Drawer Toggle ("WHY AI EXTRACTED THIS") */}
        <div className="mt-3 pt-2 flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>{isExpanded ? 'Hide AI extraction logic' : 'Why AI extracted this'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Action item control buttons: Confirm, Edit, Reject */}
          <div className="flex items-center gap-1.5">
            {!item.isConfirmed && (
              <button
                onClick={() => confirmActionItem(item.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                title="Confirm and validate AI extraction"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm</span>
              </button>
            )}

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              title="Edit action item details"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => rejectActionItem(item.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              title="Reject / Delete item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable "Why AI Extracted This" Panel */}
        {isExpanded && (
          <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Source Quote */}
            {item.sourceText && (
              <div>
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1">
                  <Quote className="w-3 h-3 text-slate-400" />
                  Source Evidence {item.sourceTimestamp ? `at ${item.sourceTimestamp}` : ''}
                </div>
                <blockquote className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
                  &ldquo;{item.sourceText}&rdquo;
                </blockquote>
              </div>
            )}

            {/* Detected Entities */}
            {item.detectedEntities && (
              <div>
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1.5">
                  <Tag className="w-3 h-3 text-slate-400" />
                  Detected Entities
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.detectedEntities.assignee && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      <User className="w-3 h-3" />
                      Assignee: <strong>{item.detectedEntities.assignee}</strong>
                    </span>
                  )}
                  {item.detectedEntities.deadline && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      <Calendar className="w-3 h-3" />
                      Deadline: <strong>{item.detectedEntities.deadline}</strong>
                    </span>
                  )}
                  {item.detectedEntities.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Jump to transcript link if available */}
            {onJumpToTranscript && (
              <div className="pt-1">
                <button
                  onClick={() => onJumpToTranscript(item.id)}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-800 underline flex items-center gap-1"
                >
                  View exact transcript utterance in context &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <ActionItemEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={item}
      />
    </>
  );
};
