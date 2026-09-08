import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { DecisionCard } from '../components/decisions/DecisionCard';
import { Decision } from '../types';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  FileDown,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { exportDecisionsDigest } from '../utils/exportUtils';
import { Modal } from '../components/common/Modal';

export const Decisions: React.FC = () => {
  const { decisions, addDecision, addToast } = useAppStore();
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'confirmed' | 'pending' | 'open'>('all');
  const [search, setSearch] = useState('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // New decision modal state
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<'Consensus' | 'Sign-off Required' | 'Unresolved Debate'>('Consensus');
  const [newDetails, setNewDetails] = useState('');

  const confirmedList = useMemo(() => decisions.filter((d) => d.status === 'confirmed'), [decisions]);
  const pendingList = useMemo(() => decisions.filter((d) => d.status === 'pending'), [decisions]);
  const openList = useMemo(() => decisions.filter((d) => d.status === 'open'), [decisions]);

  const filteredDecisions = useMemo(() => {
    return decisions.filter((d) => {
      if (activeFilterTab !== 'all' && d.status !== activeFilterTab) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesText = d.text.toLowerCase().includes(q);
        const matchesDetails = d.details ? d.details.toLowerCase().includes(q) : false;
        const matchesSource = d.sourceText ? d.sourceText.toLowerCase().includes(q) : false;
        return matchesText || matchesDetails || matchesSource;
      }
      return true;
    });
  }, [decisions, activeFilterTab, search]);

  const handleCreateDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    addDecision({
      meetingId: 'meet-q4-strategy',
      meetingTitle: 'Executive Council',
      text: newText.trim(),
      status: newCategory === 'Consensus' ? 'confirmed' : newCategory === 'Sign-off Required' ? 'pending' : 'open',
      category: newCategory,
      confidence: 96,
      details: newDetails.trim() || undefined,
      quorumStatus: newCategory === 'Consensus' ? '100% Consensus' : 'Awaiting Sign-off',
      timestamp: 'Sep 8, 2026 · 11:00',
    });

    setNewText('');
    setNewDetails('');
    setIsLogModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full w-fit border border-sky-200/80 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            Consensus &amp; Policy Ledger
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Decision Record &amp; Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Automated extraction and classification of organizational agreements, consensus items, and unresolved debates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportDecisionsDigest(decisions)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Export Digest</span>
          </button>
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Decision</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row (Identical to Stitch Image 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Validated Agreement
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-display">
            {confirmedList.length.toString().padStart(2, '0')}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Formal consensus documented with verbatim transcript evidence.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Awaiting Sign-off
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-display">
            {pendingList.length.toString().padStart(2, '0')}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Identified agreements pending required stakeholder confirmation.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Unresolved Debates
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-display">
            {openList.length.toString().padStart(2, '0')}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Active divergence requiring scheduled alignment syncs.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 overflow-x-auto">
          <button
            onClick={() => setActiveFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilterTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Records ({decisions.length})
          </button>
          <button
            onClick={() => setActiveFilterTab('confirmed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilterTab === 'confirmed'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Confirmed Only ({confirmedList.length})
          </button>
          <button
            onClick={() => setActiveFilterTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilterTab === 'pending'
                ? 'bg-white text-amber-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Needs Vote ({pendingList.length})
          </button>
          <button
            onClick={() => setActiveFilterTab('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilterTab === 'open'
                ? 'bg-white text-rose-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Open Debates ({openList.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions or quotes..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
      </div>

      {/* Decision Sections */}
      {activeFilterTab === 'all' && !search ? (
        <div className="space-y-8">
          {/* Section 1: Confirmed Organizational Decisions */}
          <div className="space-y-3.5">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Confirmed Organizational Decisions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Decisions with recorded consensus, transcript citations, and explicit sign-offs.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {confirmedList.map((d) => (
                <DecisionCard key={d.id} decision={d} />
              ))}
            </div>
          </div>

          {/* Section 2: Decisions Pending Approval */}
          <div className="space-y-3.5">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700">
                Decisions Pending Approval
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Proposals requiring executive tie-breaker or designated lead sign-off before engineering sprint allocation.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {pendingList.map((d) => (
                <DecisionCard key={d.id} decision={d} />
              ))}
            </div>
          </div>

          {/* Section 3: Open Discussions & Unresolved Debates */}
          <div className="space-y-3.5">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-700">
                Open Discussions &amp; Unresolved Debates
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Detected discussion threads where participants expressed divergent stances or deferred outcomes.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {openList.map((d) => (
                <DecisionCard key={d.id} decision={d} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Filtered Stream */
        <div className="space-y-4">
          {filteredDecisions.map((d) => (
            <DecisionCard key={d.id} decision={d} />
          ))}

          {filteredDecisions.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-900 font-display">
                No decisions match your search
              </h4>
              <p className="text-xs text-slate-500">
                Try clearing search terms or switching tabs to view other governance categories.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Executive Matrix Banner (Matches Stitch Image 3) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Executive Consensus Suite
          </div>
          <h3 className="text-xl font-bold font-display tracking-tight text-white">
            Executive Decision Matrix
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Generate unified governance PDF digest or export structured consensus changelog to Notion, Linear, or Jira.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => exportDecisionsDigest(decisions)}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
          >
            Export Decision Digest
          </button>
          <button
            onClick={() => addToast('Synced 18 decisions to Linear & Jira Milestone #v2-launch', 'success')}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>Sync to Linear &amp; Jira</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Decision Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Decision or Policy"
        subtitle="Manually commit an organizational decision to the consensus ledger"
      >
        <form onSubmit={handleCreateDecision} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Decision Statement
            </label>
            <input
              type="text"
              required
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="e.g. Standardize all staging database backups on daily automated snapshots"
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) =>
                setNewCategory(e.target.value as 'Consensus' | 'Sign-off Required' | 'Unresolved Debate')
              }
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              <option value="Consensus">Consensus (Confirmed)</option>
              <option value="Sign-off Required">Sign-off Required (Pending Vote)</option>
              <option value="Unresolved Debate">Unresolved Debate (Requires Follow-up)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Context &amp; Details
            </label>
            <textarea
              rows={3}
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              placeholder="Provide context, stakeholder agreement or voting notes..."
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsLogModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-lg"
            >
              Log Decision
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
