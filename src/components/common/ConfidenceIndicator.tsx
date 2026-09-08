import React from 'react';

interface ConfidenceIndicatorProps {
  confidence: number;
  showNeedsReviewText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  showNeedsReviewText = true,
  size = 'md',
  className = '',
}) => {
  const isHigh = confidence >= 90;
  const isMedium = confidence >= 70 && confidence < 90;
  const isReview = confidence < 70;

  // Size mapping
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  if (isHigh) {
    return (
      <span
        id={`confidence-${confidence}`}
        className={`inline-flex items-center font-mono font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses} ${className}`}
        title={`AI Confidence: ${confidence}% (High precision extraction)`}
      >
        <span className={`rounded-full bg-emerald-500 animate-pulse ${dotSize}`} />
        <span>{confidence}% Confidence</span>
      </span>
    );
  }

  if (isMedium) {
    return (
      <span
        id={`confidence-${confidence}`}
        className={`inline-flex items-center font-mono font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses} ${className}`}
        title={`AI Confidence: ${confidence}% (Moderate precision)`}
      >
        <span className={`rounded-full bg-amber-500 ${dotSize}`} />
        <span>{confidence}% Confidence</span>
      </span>
    );
  }

  // <70% -> Needs Review
  return (
    <span
      id={`confidence-${confidence}`}
      className={`inline-flex items-center font-mono font-semibold rounded-full bg-amber-100/80 text-amber-900 border border-amber-300 ${sizeClasses} ${className}`}
      title={`AI Confidence: ${confidence}%. Extracted entities require human verification.`}
    >
      <span className={`rounded-full bg-amber-600 ${dotSize}`} />
      <span>{confidence}%</span>
      {showNeedsReviewText && <span className="font-sans font-semibold text-amber-800 ml-0.5">· Needs Review</span>}
    </span>
  );
};
