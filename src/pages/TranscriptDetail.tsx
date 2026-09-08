import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { TranscriptViewer } from '../components/transcript/TranscriptViewer';
import { ArrowLeft, FileText, Calendar, Clock, Video } from 'lucide-react';

export const TranscriptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { meetings } = useAppStore();

  const meeting = meetings.find((m) => m.id === id) || meetings[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <button
          onClick={() => navigate(`/meetings/${meeting.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Meeting Intelligence</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full w-fit border border-sky-200/80 mb-1">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              Verbatim Transcript
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
              {meeting.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {meeting.date}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {meeting.durationFormatted || `${meeting.duration} mins`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Viewer Full Stage */}
      <div className="h-[740px]">
        <TranscriptViewer messages={meeting.transcriptMessages || []} />
      </div>
    </div>
  );
};
