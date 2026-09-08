import React from 'react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`} />
);

export const ActionItemSkeleton: React.FC = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-5 w-2/5" />
      <SkeletonBox className="h-6 w-24 rounded-full" />
    </div>
    <div className="flex items-center gap-4 mt-2">
      <SkeletonBox className="h-8 w-8 rounded-full" />
      <SkeletonBox className="h-4 w-32" />
      <SkeletonBox className="h-4 w-24" />
      <SkeletonBox className="h-5 w-20 rounded-full ml-auto" />
    </div>
  </div>
);

export const DecisionCardSkeleton: React.FC = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-5 w-32 rounded-full" />
      <SkeletonBox className="h-5 w-28 rounded-full" />
    </div>
    <SkeletonBox className="h-6 w-3/4 mt-2" />
    <SkeletonBox className="h-4 w-full" />
    <SkeletonBox className="h-16 w-full rounded-lg mt-2" />
  </div>
);

export const MeetingCardSkeleton: React.FC = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-6 w-1/2" />
      <SkeletonBox className="h-5 w-20 rounded-full" />
    </div>
    <SkeletonBox className="h-4 w-1/3" />
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
      <SkeletonBox className="h-7 w-20 rounded-md" />
      <SkeletonBox className="h-7 w-24 rounded-md" />
    </div>
  </div>
);
