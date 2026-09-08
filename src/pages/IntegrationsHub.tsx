import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/appStore';
import {
  Cpu,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Send,
  Sparkles,
  Zap,
  Key,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'configuring';
  lastSync: string;
  payloadCount: number;
}

const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  {
    id: 'jira',
    name: 'Jira Software Cloud',
    category: 'Issue Tracking',
    description: 'Auto-sync confirmed meeting action items to designated project sprint backlogs.',
    icon: '🔷',
    status: 'connected',
    lastSync: '2 minutes ago',
    payloadCount: 38,
  },
  {
    id: 'linear',
    name: 'Linear',
    category: 'Engineering Milestones',
    description: 'Create engineer-assigned issues with priority tags and verbatim transcript context.',
    icon: '📐',
    status: 'connected',
    lastSync: '14 minutes ago',
    payloadCount: 24,
  },
  {
    id: 'slack',
    name: 'Slack Enterprise Alerts',
    category: 'Team Messaging',
    description: 'Post automated meeting digests and urgent decision polls into designated #eng-sync channels.',
    icon: '💬',
    status: 'connected',
    lastSync: 'Live Webhook Active',
    payloadCount: 89,
  },
  {
    id: 'notion',
    name: 'Notion Workspace',
    category: 'Knowledge Base',
    description: 'Publish verified governance consensus records, debrief notes, and meeting recordings.',
    icon: '📓',
    status: 'connected',
    lastSync: '1 hour ago',
    payloadCount: 19,
  },
  {
    id: 'gcal',
    name: 'Google Calendar API',
    category: 'Provisioning',
    description: 'Permits autonomous MeetFlow Notetaker bot to parse invites and ingest multi-speaker streams.',
    icon: '📅',
    status: 'connected',
    lastSync: 'Synchronized',
    payloadCount: 42,
  },
  {
    id: 'github',
    name: 'GitHub Issues & PRs',
    category: 'Dev Workflow',
    description: 'Link code architectural decisions directly to release milestones and pull request threads.',
    icon: '🐙',
    status: 'disconnected',
    lastSync: 'Not configured',
    payloadCount: 0,
  },
];

export const IntegrationsHub: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INITIAL_INTEGRATIONS);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number } | null>(null);
  const { addToast } = useAppStore();

  const handleToggle = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'connected' ? 'disconnected' : 'connected';
          addToast(
            `${item.name} is now ${nextStatus === 'connected' ? 'Connected & Active' : 'Disconnected'}`,
            nextStatus === 'connected' ? 'success' : 'info'
          );
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const handleTestWebhook = () => {
    setIsTestingWebhook(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTestingWebhook(false);
      setTestResult({ success: true, latency: 118 });
      addToast('Webhook test payload acknowledged with 200 OK (118ms latency)', 'success');
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
            <Cpu className="w-3.5 h-3.5 text-sky-600" />
            Enterprise Ecosystem
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Integrations &amp; Real-Time Pipelines
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Connect meeting intelligence with your sprint trackers, issue boards, and company wiki.
          </p>
        </div>

        {/* Global Webhook Status */}
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          5 Active Pipelines Connected
        </div>
      </div>

      {/* Integrations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((item, idx) => {
          const isConnected = item.status === 'connected';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-sky-300/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shadow-2xs">
                    {item.icon}
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      isConnected ? 'bg-[#006194]' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isConnected ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 font-display">
                      {item.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-block">
                    {item.category}
                  </span>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                  {isConnected ? item.lastSync : 'Disconnected'}
                </span>

                {isConnected && (
                  <span className="text-sky-700 font-medium">
                    {item.payloadCount} synced
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Live Webhook Simulator Tester Card */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-400 mb-1">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              Developer Endpoint
            </div>
            <h3 className="text-xl font-bold font-display text-white">
              Enterprise Webhook Dispatcher
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Test end-to-end delivery of JSON deliverables on meeting transcript processing completion.
            </p>
          </div>

          <button
            onClick={handleTestWebhook}
            disabled={isTestingWebhook}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-60 transition-all self-start sm:self-auto"
          >
            {isTestingWebhook ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Simulating Dispatch...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Test Webhook Ping</span>
              </>
            )}
          </button>
        </div>

        {/* Code Snippet Payload */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-xs font-mono space-y-2 overflow-x-auto">
          <div className="text-slate-400 flex items-center justify-between border-b border-slate-800 pb-2">
            <span>POST https://api.yourcompany.com/v1/meetflow-events</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              HMAC-SHA256 Signed
            </span>
          </div>
          <pre className="text-sky-300">
{`{
  "event": "meeting.intelligence.analyzed",
  "meeting_id": "meet-q4-strategy",
  "total_action_items": 8,
  "decisions_confirmed": 2,
  "confidence_average": 94.2,
  "timestamp": "${new Date().toISOString()}"
}`}
          </pre>
        </div>

        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-300"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Response: 200 OK</span>
            </div>
            <span>Roundtrip Latency: {testResult.latency}ms</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
