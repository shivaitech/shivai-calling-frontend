import { useMemo, useState } from 'react';
import {
  Search,
  Users,
  Handshake,
  Phone,
  Mail,
  Building2,
  Calendar,
  Wallet,
  Flame,
  Snowflake,
  Thermometer,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import SearchableSelect from '../../components/SearchableSelect';
import Pagination from '../../components/Pagination';

/**
 * Mock data shaped exactly like the real Zoho CRM REST API (module: Leads / Deals)
 * so wiring the real GET /crm/v2/Leads and GET /crm/v2/Deals endpoints later is a
 * drop-in replacement for these two arrays — same fields, same shape.
 */

type LeadStatus =
  | 'Not Contacted'
  | 'Attempted to Contact'
  | 'Contacted'
  | 'Junk Lead'
  | 'Lost Lead'
  | 'Converted';

type LeadRating = 'Hot' | 'Warm' | 'Cold';

interface ZohoLead {
  id: string;
  Full_Name: string;
  Company: string;
  Email: string;
  Phone: string;
  Lead_Source: string;
  Lead_Status: LeadStatus;
  Rating: LeadRating;
  Owner: { name: string };
  Created_Time: string;
  Modified_Time: string;
  Industry?: string;
  Annual_Revenue?: number;
  Description?: string;
  /** Present once ShivAI has pushed a call-derived lead here — not a real Zoho field. */
  shivaiSourceCallId?: string;
}

type DealStage =
  | 'Qualification'
  | 'Needs Analysis'
  | 'Proposal'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

interface ZohoDeal {
  id: string;
  Deal_Name: string;
  Account_Name: string;
  Contact_Name: string;
  Stage: DealStage;
  Amount: number;
  Closing_Date: string;
  Owner: { name: string };
  Next_Step?: string;
}

const MOCK_LEADS: ZohoLead[] = [
  {
    id: '4600000123001',
    Full_Name: 'Rajiv Menon',
    Company: 'Christ University',
    Email: 'rajiv.menon@christuniv.in',
    Phone: '+91 98450 12345',
    Lead_Source: 'ShivAI — Inbound Call',
    Lead_Status: 'Contacted',
    Rating: 'Hot',
    Owner: { name: 'Priya Sharma' },
    Created_Time: '2026-08-24T11:02:09.000Z',
    Modified_Time: '2026-08-24T11:03:21.000Z',
    Industry: 'Education',
    Description: 'Booking enquiry for a college festival — Sukhwinder Singh, Feb 14, budget 25 lakhs.',
    shivaiSourceCallId: 'call_1787474039816',
  },
  {
    id: '4600000123002',
    Full_Name: 'Ananya Iyer',
    Company: 'Iyer & Sons Retail',
    Email: 'ananya@iyerretail.com',
    Phone: '+91 90080 44521',
    Lead_Source: 'ShivAI — Outbound Campaign',
    Lead_Status: 'Not Contacted',
    Rating: 'Warm',
    Owner: { name: 'Priya Sharma' },
    Created_Time: '2026-08-23T09:15:00.000Z',
    Modified_Time: '2026-08-23T09:15:00.000Z',
    Industry: 'Retail',
  },
  {
    id: '4600000123003',
    Full_Name: 'David Fernandes',
    Company: 'Fernandes Events',
    Email: 'david@fernandesevents.co',
    Phone: '+91 88009 12233',
    Lead_Source: 'ShivAI — Inbound Call',
    Lead_Status: 'Attempted to Contact',
    Rating: 'Cold',
    Owner: { name: 'Arjun Nair' },
    Created_Time: '2026-08-22T14:40:00.000Z',
    Modified_Time: '2026-08-22T16:02:00.000Z',
    Industry: 'Events',
  },
  {
    id: '4600000123004',
    Full_Name: 'Meera Krishnan',
    Company: 'Krishnan Wellness',
    Email: 'meera@krishnanwellness.in',
    Phone: '+91 97400 55678',
    Lead_Source: 'ShivAI — Outbound Campaign',
    Lead_Status: 'Converted',
    Rating: 'Hot',
    Owner: { name: 'Arjun Nair' },
    Created_Time: '2026-08-18T10:00:00.000Z',
    Modified_Time: '2026-08-21T09:30:00.000Z',
    Industry: 'Healthcare',
  },
];

const MOCK_DEALS: ZohoDeal[] = [
  {
    id: '4600000144001',
    Deal_Name: 'Christ University — Festival Booking',
    Account_Name: 'Christ University',
    Contact_Name: 'Rajiv Menon',
    Stage: 'Proposal',
    Amount: 2500000,
    Closing_Date: '2026-09-10',
    Owner: { name: 'Priya Sharma' },
    Next_Step: 'Share corporate event fee sheet',
  },
  {
    id: '4600000144002',
    Deal_Name: 'Krishnan Wellness — Annual Retainer',
    Account_Name: 'Krishnan Wellness',
    Contact_Name: 'Meera Krishnan',
    Stage: 'Closed Won',
    Amount: 480000,
    Closing_Date: '2026-08-21',
    Owner: { name: 'Arjun Nair' },
  },
  {
    id: '4600000144003',
    Deal_Name: 'Iyer Retail — Onboarding',
    Account_Name: 'Iyer & Sons Retail',
    Contact_Name: 'Ananya Iyer',
    Stage: 'Qualification',
    Amount: 150000,
    Closing_Date: '2026-09-30',
    Owner: { name: 'Priya Sharma' },
  },
];

const LEAD_STATUS_STYLE: Record<LeadStatus, string> = {
  'Not Contacted': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  'Attempted to Contact': 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  Contacted: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  'Junk Lead': 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  'Lost Lead': 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  Converted: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
};

const RATING_META: Record<LeadRating, { icon: typeof Flame; className: string }> = {
  Hot: { icon: Flame, className: 'text-red-600 dark:text-red-400' },
  Warm: { icon: Thermometer, className: 'text-amber-600 dark:text-amber-400' },
  Cold: { icon: Snowflake, className: 'text-sky-600 dark:text-sky-400' },
};

const DEAL_STAGE_STYLE: Record<DealStage, string> = {
  Qualification: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  'Needs Analysis': 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  Proposal: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  Negotiation: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  'Closed Won': 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  'Closed Lost': 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const PAGE_SIZE = 10;

const ZohoCrmDashboard = () => {
  const [tab, setTab] = useState<'leads' | 'deals'>('leads');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<ZohoLead | null>(null);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_LEADS.filter((lead) => {
      if (statusFilter !== 'all' && lead.Lead_Status !== statusFilter) return false;
      if (!q) return true;
      return (
        lead.Full_Name.toLowerCase().includes(q) ||
        lead.Company.toLowerCase().includes(q) ||
        lead.Email.toLowerCase().includes(q) ||
        lead.Phone.includes(q)
      );
    });
  }, [search, statusFilter]);

  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_DEALS.filter((deal) => {
      if (stageFilter !== 'all' && deal.Stage !== stageFilter) return false;
      if (!q) return true;
      return (
        deal.Deal_Name.toLowerCase().includes(q) ||
        deal.Account_Name.toLowerCase().includes(q) ||
        deal.Contact_Name.toLowerCase().includes(q)
      );
    });
  }, [search, stageFilter]);

  const totalPages = Math.max(1, Math.ceil((tab === 'leads' ? filteredLeads.length : filteredDeals.length) / PAGE_SIZE));
  const pagedLeads = filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedDeals = filteredDeals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const switchTab = (next: 'leads' | 'deals') => {
    setTab(next);
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-3">
      {/* Preview banner — this is mock data until the Zoho Leads/Deals API is wired up */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          Preview with sample data — will show your real Zoho Leads and Deals once the sync API is live.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-slate-700 w-full sm:w-auto">
        {(
          [
            { id: 'leads' as const, label: 'Leads', icon: Users, count: MOCK_LEADS.length },
            { id: 'deals' as const, label: 'Deals', icon: Handshake, count: MOCK_DEALS.length },
          ]
        ).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                active
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <t.icon className={`w-3.5 h-3.5 ${active ? 'opacity-100' : 'opacity-70'}`} />
              {t.label}
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-md tabular-nums font-semibold ${
                  active
                    ? 'bg-white/20 dark:bg-slate-900/15 text-white dark:text-slate-900'
                    : 'bg-slate-300/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <GlassCard>
        <div className="p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
              <input
                type="text"
                placeholder={tab === 'leads' ? 'Search leads by name, company, email…' : 'Search deals by name, account…'}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white text-sm transition-all"
              />
            </div>
            <div className="hidden sm:block min-w-[160px]">
              {tab === 'leads' ? (
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'All statuses' },
                    { value: 'Not Contacted', label: 'Not Contacted' },
                    { value: 'Attempted to Contact', label: 'Attempted to Contact' },
                    { value: 'Contacted', label: 'Contacted' },
                    { value: 'Converted', label: 'Converted' },
                    { value: 'Junk Lead', label: 'Junk Lead' },
                    { value: 'Lost Lead', label: 'Lost Lead' },
                  ]}
                  value={statusFilter}
                  onChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                  placeholder="Filter by status…"
                />
              ) : (
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'All stages' },
                    { value: 'Qualification', label: 'Qualification' },
                    { value: 'Needs Analysis', label: 'Needs Analysis' },
                    { value: 'Proposal', label: 'Proposal' },
                    { value: 'Negotiation', label: 'Negotiation' },
                    { value: 'Closed Won', label: 'Closed Won' },
                    { value: 'Closed Lost', label: 'Closed Lost' },
                  ]}
                  value={stageFilter}
                  onChange={(v) => {
                    setStageFilter(v);
                    setPage(1);
                  }}
                  placeholder="Filter by stage…"
                />
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Leads list */}
      {tab === 'leads' && (
        <GlassCard>
          <div className="p-2 sm:p-3">
            {pagedLeads.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No leads match your search</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pagedLeads.map((lead) => {
                  const RatingIcon = RATING_META[lead.Rating].icon;
                  return (
                    <div
                      key={lead.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedLead(lead)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedLead(lead)}
                      className="group flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                        <RatingIcon className={`w-3.5 h-3.5 ${RATING_META[lead.Rating].className}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{lead.Full_Name}</p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${LEAD_STATUS_STYLE[lead.Lead_Status]}`}>
                            {lead.Lead_Status}
                          </span>
                          {lead.shivaiSourceCallId && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              From AI call
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{lead.Company}</span>
                          <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3" />{lead.Phone}</span>
                          <span className="hidden sm:flex items-center gap-1"><Mail className="w-3 h-3" />{lead.Email}</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                        <span>{lead.Owner.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredLeads.length}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
                className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700"
              />
            )}
          </div>
        </GlassCard>
      )}

      {/* Deals list */}
      {tab === 'deals' && (
        <GlassCard>
          <div className="p-2 sm:p-3">
            {pagedDeals.length === 0 ? (
              <div className="text-center py-10">
                <Handshake className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No deals match your search</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pagedDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                      <Handshake className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{deal.Deal_Name}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${DEAL_STAGE_STYLE[deal.Stage]}`}>
                          {deal.Stage}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{deal.Account_Name}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(deal.Closing_Date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
                      <Wallet className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {formatCurrency(deal.Amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredDeals.length}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
                className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700"
              />
            )}
          </div>
        </GlassCard>
      )}

      {/* Lead detail modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/80 dark:border-slate-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{selectedLead.id}</p>
                <h3 className="text-base font-semibold text-slate-800 dark:text-white truncate">{selectedLead.Full_Name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{selectedLead.Company}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEAD_STATUS_STYLE[selectedLead.Lead_Status]}`}>
                  {selectedLead.Lead_Status}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {(() => {
                    const RatingIcon = RATING_META[selectedLead.Rating].icon;
                    return <RatingIcon className={`w-3 h-3 ${RATING_META[selectedLead.Rating].className}`} />;
                  })()}
                  {selectedLead.Rating}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Phone</p>
                  <p className="text-xs font-mono text-slate-700 dark:text-slate-300">{selectedLead.Phone}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Email</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{selectedLead.Email}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Source</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{selectedLead.Lead_Source}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Owner</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{selectedLead.Owner.name}</p>
                </div>
              </div>

              {selectedLead.Description && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Notes</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selectedLead.Description}</p>
                </div>
              )}

              {selectedLead.shivaiSourceCallId && (
                <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-2">
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    Created from an AI call summary — <span className="font-mono">{selectedLead.shivaiSourceCallId}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZohoCrmDashboard;
