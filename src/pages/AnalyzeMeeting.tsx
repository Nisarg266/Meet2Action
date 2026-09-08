import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { analyzeMeeting, DEFAULT_PROCESSING_STEPS, ProcessingStep } from '../services/aiService';
import { DEMO_SAMPLE_TRANSCRIPT } from '../data/mockMeetings';
import {
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  Clock,
  ArrowRight,
  RefreshCw,
  Copy,
  Zap,
  Info
} from 'lucide-react';

export const AnalyzeMeeting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [transcriptText, setTranscriptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>(DEFAULT_PROCESSING_STEPS);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { addMeeting, addToast } = useAppStore();
  const navigate = useNavigate();

  const handleLoadSample = () => {
    setTranscriptText(DEMO_SAMPLE_TRANSCRIPT);
    addToast('Loaded Q4 Sprint Planning sample transcript', 'info');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setTranscriptText(text);
        setActiveTab('paste');
        addToast(`Uploaded "${file.name}"`, 'success');
      }
    };
    reader.readAsText(file);
  };

  const handleStartAnalysis = async () => {
    const textToAnalyze = transcriptText.trim();
    if (!textToAnalyze) {
      addToast('Please paste a transcript or load a sample first', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      const newMeeting = await analyzeMeeting(textToAnalyze, (updatedSteps) => {
        setSteps(updatedSteps);
      });

      addMeeting(newMeeting);
      // Wait a moment for celebration, then navigate
      setTimeout(() => {
        navigate(`/meetings/${newMeeting.id}`);
      }, 700);
    } catch (error) {
      setIsProcessing(false);
      addToast('Failed to complete analysis. Please try again.', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          Neural Pipeline
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
          Analyze Meeting Transcript
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload or paste any meeting recording transcript to extract action items, owners, deadlines, and governance decisions.
        </p>
      </div>

      {!isProcessing ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 pt-3 bg-slate-50/70">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('paste')}
                className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'paste'
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                Paste Transcript
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'upload'
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload File (.txt, .vtt, .doc)
              </button>
            </div>

            {activeTab === 'paste' && (
              <button
                onClick={handleLoadSample}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 px-3 py-1.5 rounded-lg transition-colors mb-2"
              >
                <Zap className="w-3.5 h-3.5" />
                Load Sample Demo
              </button>
            )}
          </div>

          <div className="p-6 space-y-4">
            {activeTab === 'paste' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Raw Transcript Text
                  </label>
                  {transcriptText && (
                    <button
                      onClick={() => setTranscriptText('')}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <textarea
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Paste dialogue transcript here, e.g.:&#10;&#10;Alex: 'Welcome everyone. Let's align on the v2 sprint.'&#10;Rahul: 'I will finish the landing page redesign by Friday.'&#10;Amit: 'I'll complete the payment API integration before Wednesday.'&#10;Alex: 'Confirmed, we will launch v2 next Monday.'"
                  rows={12}
                  className="w-full text-xs sm:text-sm font-mono p-4 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/30 leading-relaxed text-slate-800"
                />

                <div className="flex sm:hidden">
                  <button
                    onClick={handleLoadSample}
                    className="w-full text-center text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 py-2 rounded-lg"
                  >
                    Load Sample Demo Transcript
                  </button>
                </div>
              </div>
            ) : (
              /* Drag and Drop Zone */
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center transition-colors ${
                  dragActive
                    ? 'border-sky-500 bg-sky-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                  Drag and drop your transcript file here
                </h4>
                <p className="text-xs text-slate-500 mb-4 max-w-sm">
                  Supports .txt, .vtt, .srt, .docx, and plain text transcripts exported from Zoom, Google Meet, or Microsoft Teams.
                </p>

                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors">
                  <input
                    type="file"
                    accept=".txt,.vtt,.srt,.docx,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  Browse Local Files
                </label>

                {fileName && (
                  <div className="mt-4 text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                    Selected: {fileName}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Bar: Action CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Extracts tasks, normalized dates, consensus decisions, and speaker talk times.</span>
              </div>

              <button
                onClick={handleStartAnalysis}
                disabled={!transcriptText.trim()}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all ${
                  transcriptText.trim()
                    ? 'bg-[#006194] hover:bg-[#004b73] text-white cursor-pointer hover:shadow-md'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Analyze with MeetFlow AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Processing Animation Container */
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-xs text-center max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto shadow-inner">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 font-display">
              Processing Meeting Intelligence
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Whisper NeMo transcript ingestion &amp; Gemini neural entity normalization
            </p>
          </div>

          {/* Sequential Step Checklist */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3">
            {steps.map((step) => {
              const isDone = step.status === 'done';
              const isCurrent = step.status === 'processing';

              return (
                <div
                  key={step.id}
                  className="flex items-center justify-between text-xs py-1"
                >
                  <div className="flex items-center gap-2.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span
                      className={`font-medium ${
                        isDone
                          ? 'text-slate-900'
                          : isCurrent
                          ? 'text-sky-700 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-slate-400">
                    {isDone ? 'Completed' : isCurrent ? 'Analyzing...' : 'Waiting'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
