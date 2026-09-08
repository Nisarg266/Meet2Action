import React from 'react';
import { PriorityLevel, TaskStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'outline' | 'mono';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  }[size];

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-sky-50 text-sky-700 border-sky-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    outline: 'bg-transparent text-slate-600 border-slate-300',
    mono: 'bg-slate-100 text-slate-800 border-slate-300 font-mono font-medium',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border whitespace-nowrap leading-none transition-colors ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'md',
}) => {
  if (priority === 'High') {
    return (
      <Badge variant="danger" size={size}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        High Priority
      </Badge>
    );
  }
  if (priority === 'Medium') {
    return (
      <Badge variant="warning" size={size}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Medium
      </Badge>
    );
  }
  return (
    <Badge variant="default" size={size}>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Low
    </Badge>
  );
};

export const StatusBadge: React.FC<{ status: TaskStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const map: Record<TaskStatus, { label: string; variant: 'default' | 'primary' | 'warning' | 'success' }> = {
    todo: { label: 'To Do', variant: 'default' },
    'in-progress': { label: 'In Progress', variant: 'primary' },
    review: { label: 'In Review', variant: 'warning' },
    done: { label: 'Done', variant: 'success' },
  };

  const item = map[status] || map.todo;
  return (
    <Badge variant={item.variant} size={size}>
      {item.label}
    </Badge>
  );
};
