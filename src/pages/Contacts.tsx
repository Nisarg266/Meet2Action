import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/appStore';
import {
  Contact,
  Search,
  Plus,
  Mail,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink,
  Phone,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

interface StakeholderContact {
  id: string;
  name: string;
  organization: string;
  title: string;
  email: string;
  phone?: string;
  category: 'Client Enterprise' | 'Investor' | 'Vendor Partner' | 'Contractor';
  lastMeeting: string;
  lastMeetingDate: string;
  keyDeliverable?: string;
}

const INITIAL_CONTACTS: StakeholderContact[] = [
  {
    id: 'ct-1',
    name: 'Sarah Lin',
    organization: 'FinTech Capital Partners',
    title: 'Managing Partner',
    email: 'sarah.lin@fintechcapital.io',
    phone: '+1 (415) 890-2100',
    category: 'Investor',
    lastMeeting: 'Q4 Product Strategy & Sprint Planning',
    lastMeetingDate: 'Sep 8, 2026',
    keyDeliverable: 'Share Series B data room telemetry and cohort growth charts',
  },
  {
    id: 'ct-2',
    name: 'Carlos Gomez',
    organization: 'CloudScale Enterprises',
    title: 'VP of Infrastructure',
    email: 'carlos@cloudscale.net',
    phone: '+1 (512) 340-9112',
    category: 'Client Enterprise',
    lastMeeting: 'Architecture Review: Cloud Pipeline',
    lastMeetingDate: 'Sep 5, 2026',
    keyDeliverable: 'Finalize SOC2 Type II vendor assessment review',
  },
  {
    id: 'ct-3',
    name: 'Elena Rostova',
    organization: 'Horizon Media Ventures',
    title: 'GTM & PR Strategist',
    email: 'elena@horizonmv.com',
    category: 'Vendor Partner',
    lastMeeting: 'Marketing Strategy Review',
    lastMeetingDate: 'Sep 7, 2026',
    keyDeliverable: 'Tech publication embargo list for Version 2 launch',
  },
  {
    id: 'ct-4',
    name: 'Mark Vance',
    organization: 'Apex Legal Group',
    title: 'Corporate Counsel',
    email: 'mvance@apexlegal.org',
    category: 'Vendor Partner',
    lastMeeting: 'Executive Pricing Council',
    lastMeetingDate: 'Sep 7, 2026',
    keyDeliverable: 'Enterprise seat minimum contract addendum clause review',
  },
  {
    id: 'ct-5',
    name: 'David K.',
    organization: 'Stripe Global Partnerships',
    title: 'Senior Solutions Architect',
    email: 'dk@stripe.com',
    category: 'Client Enterprise',
    lastMeeting: 'Weekly Product Sync',
    lastMeetingDate: 'Sep 8, 2026',
    keyDeliverable: 'Stripe Billing v3 custom portal migration verification',
  },
];

export const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<StakeholderContact[]>(INITIAL_CONTACTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { addToast } = useAppStore();

  // Form state
  const [newName, setNewName] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCategory, setNewCategory] = useState<StakeholderContact['category']>('Client Enterprise');

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.organization.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newContact: StakeholderContact = {
      id: `ct-${Date.now()}`,
      name: newName.trim(),
      organization: newOrg.trim() || 'Independent',
      title: newTitle.trim() || 'Advisor',
      email: newEmail.trim(),
      category: newCategory,
      lastMeeting: 'Upcoming Session',
      lastMeetingDate: 'Sep 2026',
    };

    setContacts([newContact, ...contacts]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewOrg('');
    setNewTitle('');
    setNewEmail('');
    addToast(`Added "${newContact.name}" to directory`, 'success');
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
            <Contact className="w-3.5 h-3.5 text-sky-600" />
            External Stakeholders
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Contacts &amp; Meeting Guests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            External attendees, enterprise clients, investors, and vendors extracted from cross-platform calls.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by contact name, organization, email..."
            className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['all', 'Client Enterprise', 'Investor', 'Vendor Partner'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                categoryFilter === cat
                  ? 'bg-sky-700 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Contacts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((c, idx) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-sky-300/80 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
                  {c.category}
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {c.lastMeetingDate}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 font-display">
                {c.name}
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-0.5">{c.title}</p>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">{c.organization}</span>
              </div>

              {c.keyDeliverable && (
                <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-0.5">
                    Associated Action
                  </span>
                  <p className="text-slate-700 line-clamp-2 leading-relaxed font-medium">
                    {c.keyDeliverable}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <a
                href={`mailto:${c.email}`}
                className="text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1.5 truncate max-w-[200px]"
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{c.email}</span>
              </a>

              <span className="text-slate-400 text-[11px] font-mono">
                {c.lastMeeting.split(':')[0]}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Contact Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Stakeholder Contact"
        subtitle="Track external attendees and link meeting transcripts to client accounts"
      >
        <form onSubmit={handleCreateContact} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Jessica Chen"
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                value={newOrg}
                onChange={(e) => setNewOrg(e.target.value)}
                placeholder="e.g. Sequoia Horizon"
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Principal Partner"
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Classification
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as StakeholderContact['category'])}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Client Enterprise">Client Enterprise</option>
                <option value="Investor">Investor</option>
                <option value="Vendor Partner">Vendor Partner</option>
                <option value="Contractor">Contractor</option>
              </select>
            </div>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-[#006194] hover:bg-[#004b73] rounded-lg shadow-2xs"
            >
              Save Contact
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
