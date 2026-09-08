import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import {
  FileDown,
  FileText,
  Table,
  CheckCircle2,
  Copy,
  ExternalLink,
  Code2,
  Sparkles,
  Share2,
  Check
} from 'lucide-react';
import {
  exportTasksToCSV,
  exportTasksToMarkdown,
  exportTasksToJira,
  exportTasksToTrello,
  exportDecisionsDigest
} from '../utils/exportUtils';
import { Modal } from '../components/common/Modal';

export const Exports: React.FC = () => {
  const { actionItems, decisions, meetings, addToast } = useAppStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewModalContent, setPreviewModalContent] = useState<{ title: string; text: string } | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('Payload copied to clipboard', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const integrations = [
    {
      name: 'Jira Software Cloud',
      category: 'Issue Tracking',
      status: 'Connected',
      description: 'Auto-sync confirmed action items to designated project backlogs.',
      icon: '🔷',
    },
    {
      name: 'Linear',
      category: 'Engineering Sprint',
      status: 'Connected',
      description: 'Streamline sprint milestones with 1-click team ticket creation.',
      icon: '📐',
    },
    {
      name: 'Notion Workspace',
      category: 'Knowledge Hub',
      status: 'Connected',
      description: 'Publish executive summaries and governance decision changelogs.',
      icon: '📓',
    },
    {
      name: 'Slack Alerts',
      category: 'Team Messaging',
      status: 'Active',
      description: 'Post automated meeting digests into designated team channels.',
      icon: '💬',
    },
    {
      name: 'Google Calendar',
      category: 'Scheduling',
      status: 'Active',
      description: 'Two-way sync for meeting transcripts and calendar event debriefs.',
      icon: '📅',
    },
    {
      name: 'Custom Webhook API',
      category: 'Enterprise Pipeline',
      status: 'Ready',
      description: 'Deliver realtime JSON payloads on meeting analysis completion.',
      icon: '⚡',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
          <FileDown className="w-3.5 h-3.5 text-sky-600" />
          Data Portability &amp; Ecosystem
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
          Export Hub &amp; Integrations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Export meeting artifacts into enterprise formats or synchronize directly with your engineering toolstack.
        </p>
      </div>

      {/* Export Formats Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-500">
          Available Export Formats
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. CSV Tasks Export */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
                  <Table className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-medium text-slate-400">.csv</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Action Items Spreadsheet (CSV)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Complete execution ledger including Task, Assignee, Status, Priority, Deadline, and AI Extraction Confidence.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                {actionItems.length} records ready
              </span>
              <button
                onClick={() => exportTasksToCSV(actionItems)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl transition-all shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {/* 2. Markdown Executive Synthesis */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-medium text-slate-400">.md</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Executive Synthesis (Markdown)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Structured briefing including meeting metadata, consensus decisions, action item checkboxes, and transcript highlights.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Universal markdown format
              </span>
              <button
                onClick={() => exportTasksToMarkdown(actionItems)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl transition-all shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download Markdown</span>
              </button>
            </div>
          </div>

          {/* 3. Jira Import Bundle */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                  <Code2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-medium text-slate-400">Atlassian JSON</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Jira Issue Import Payload
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pre-formatted Atlassian schema mapping tasks to Issue Types, Summaries, Assignees, Due Dates, and Labels.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Jira Cloud REST schema
              </span>
              <button
                onClick={() => {
                  const content = exportTasksToJira(actionItems);
                  setPreviewModalContent({ title: 'Jira Cloud Import Payload', text: content });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
              >
                <span>View &amp; Copy Payload</span>
              </button>
            </div>
          </div>

          {/* 4. Trello Board Export */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-medium text-slate-400">Trello JSON</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Trello Board &amp; Cards Export
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Organized into To Do, In Progress, and In Review lists with card due dates and member mappings.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Trello API schema
              </span>
              <button
                onClick={() => {
                  const content = exportTasksToTrello(actionItems);
                  setPreviewModalContent({ title: 'Trello Board Payload', text: content });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
              >
                <span>View &amp; Copy Payload</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Integrations Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-500">
          Connected Ecosystem Services
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((item) => (
            <div
              key={item.name}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {item.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {item.category}
                </span>
                <button
                  onClick={() => addToast(`Triggered sync with ${item.name}`, 'info')}
                  className="text-xs font-semibold text-sky-700 hover:text-sky-800"
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewModalContent && (
        <Modal
          isOpen={Boolean(previewModalContent)}
          onClose={() => setPreviewModalContent(null)}
          title={previewModalContent.title}
          subtitle="Copy or download the formatted integration data"
          size="lg"
        >
          <div className="space-y-4">
            <div className="relative">
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono max-h-96 overflow-y-auto leading-relaxed">
                {previewModalContent.text}
              </pre>
              <button
                onClick={() => handleCopy('modal', previewModalContent.text)}
                className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono flex items-center gap-1"
              >
                {copiedKey === 'modal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'modal' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreviewModalContent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
