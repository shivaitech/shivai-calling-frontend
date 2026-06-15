import React, { useState } from "react";
import GlassCard from "../../../components/GlassCard";
import {
  Users, UserCheck, CheckCircle2, Star, Search, ChevronRight,
  ArrowLeft, Phone, Mail, MapPin, Clock, MessageSquare, Ticket, Upload,
} from "lucide-react";
import {
  CUSTOMERS, CUSTOMER_STATS, getCustomer, sourceMeta, ticketStatusMeta,
  Customer,
} from "./mockData";
import { useIndustry } from "./industryConfig";
import { AgentAvatar, StatCard, SectionTitle } from "./ui";
import { ImportCenter } from "./ImportCenter";

export const Customers: React.FC = () => {
  const { terms } = useIndustry();
  const [selected, setSelected] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "resolved" | "reviews">("all");
  const [q, setQ] = useState("");

  // Import is a sub-view of the Customers module (the only place to import data).
  if (importing) return <ImportCenter onBack={() => setImporting(false)} />;

  if (selected) {
    const c = getCustomer(selected);
    if (c) return <CustomerDetail customer={c} onBack={() => setSelected(null)} />;
  }

  const filtered = CUSTOMERS.filter((c) => {
    if (q && !`${c.name} ${c.phone} ${c.email} ${c.location}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "active") return c.activeTickets > 0;
    if (filter === "resolved") return c.activeTickets === 0;
    if (filter === "reviews") return c.reviews.length > 0;
    return true;
  });

  const filters: { key: typeof filter; label: string; count: number }[] = [
    { key: "all", label: `All ${terms.customers}`, count: CUSTOMERS.length },
    { key: "active", label: "Active Tickets", count: CUSTOMER_STATS.withActive },
    { key: "resolved", label: "Resolved", count: CUSTOMER_STATS.resolved },
    { key: "reviews", label: "With Reviews", count: CUSTOMERS.filter((c) => c.reviews.length > 0).length },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        title={terms.customers}
        subtitle={`Everyone your AI workforce has helped — ${terms.customers.toLowerCase()}, tickets & reviews`}
        right={
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${terms.customers.toLowerCase()}…`}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm common-bg-icons" />
            </div>
            <button onClick={() => setImporting(true)} className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm flex-shrink-0">
              <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Import</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users} color="blue" label={`Total ${terms.customers}`} value={CUSTOMER_STATS.total} />
        <StatCard icon={UserCheck} color="amber" label="With Active Tickets" value={CUSTOMER_STATS.withActive} />
        <StatCard icon={CheckCircle2} color="emerald" label="Fully Resolved" value={CUSTOMER_STATS.resolved} />
        <StatCard icon={Star} color="purple" label="Avg Rating" value={CUSTOMER_STATS.avgRating} sub={`${CUSTOMER_STATS.reviewsCount} reviews`} subTone="muted" />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                active ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}>
              {f.label} <span className="opacity-60">({f.count})</span>
            </button>
          );
        })}
      </div>

      <GlassCard>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {filtered.map((c) => <CustomerRow key={c.id} customer={c} onOpen={() => setSelected(c.id)} />)}
          {filtered.length === 0 && <div className="p-10 text-center text-sm text-slate-400">No {terms.customers.toLowerCase()} in this view.</div>}
        </div>
      </GlassCard>
    </div>
  );
};

const hueFor = (name: string) => (name.charCodeAt(0) * 37) % 360;

const CustomerRow: React.FC<{ customer: Customer; onOpen: () => void }> = ({ customer: c, onOpen }) => {
  const src = sourceMeta(c.source);
  return (
    <button onClick={onOpen} className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left">
      <AgentAvatar name={c.name} hue={hueFor(c.name)} size={42} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{c.name}</p>
          {c.tags.map((t) => (
            <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${t === "VIP" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate">{c.phone}</span>
          <span className="hidden sm:inline">· {c.location}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4 flex-shrink-0">
        {c.avgRating && (
          <span className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Star className="w-3.5 h-3.5 text-amber-400" /> {c.avgRating.toFixed(1)}
          </span>
        )}
        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${src.cls}`}>{src.label}</span>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          {c.activeTickets > 0 ? (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{c.activeTickets} active</span>
          ) : (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Resolved</span>
          )}
          <p className="text-[11px] text-slate-400">{c.totalTickets} total</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
      </div>
    </button>
  );
};

// ── Customer detail ───────────────────────────────────────────────────────────
const CustomerDetail: React.FC<{ customer: Customer; onBack: () => void }> = ({ customer: c, onBack }) => {
  const { terms } = useIndustry();
  const src = sourceMeta(c.source);
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> All {terms.customers.toLowerCase()}
      </button>

      <GlassCard>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <AgentAvatar name={c.name} hue={hueFor(c.name)} size={64} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{c.name}</h2>
                {c.tags.map((t) => (
                  <span key={t} className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${t === "VIP" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>{t}</span>
                ))}
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${src.cls}`}>{src.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {c.phone}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {c.email}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {c.location}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Last contact {c.lastContact}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm"><Phone className="w-4 h-4" /> Call</button>
              <button className="common-button-bg2 flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm"><MessageSquare className="w-4 h-4" /> Message</button>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Ticket} color="blue" label="Total Tickets" value={c.totalTickets} />
        <StatCard icon={UserCheck} color="amber" label="Active" value={c.activeTickets} />
        <StatCard icon={CheckCircle2} color="emerald" label="Resolved" value={c.totalTickets - c.activeTickets} />
        <StatCard icon={Star} color="purple" label="Avg Rating" value={c.avgRating ? c.avgRating.toFixed(1) : "—"} sub={`${c.reviews.length} reviews`} subTone="muted" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Ticket history */}
        <GlassCard>
          <div className="p-4 sm:p-6">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Ticket History</h3>
            <div className="space-y-2">
              {c.tickets.map((t) => {
                const st = ticketStatusMeta(t.status);
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <span className="w-9 h-9 rounded-lg common-bg-icons flex items-center justify-center flex-shrink-0">
                      <Ticket className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{t.subject}</p>
                        <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">{t.id}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{t.date}</p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${st.cls}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* Reviews */}
        <GlassCard>
          <div className="p-4 sm:p-6">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Reviews & Feedback</h3>
            {c.reviews.length === 0 ? (
              <div className="py-10 text-center">
                <Star className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No reviews yet from this {terms.customer.toLowerCase()}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {c.reviews.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400">{r.date}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">“{r.comment}”</p>
                    <p className="text-[11px] text-slate-400 mt-1.5 font-mono">{r.ticketId}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
