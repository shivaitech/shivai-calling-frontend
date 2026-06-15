/**
 * ── Support CRM — mock data ──────────────────────────────────────────────────
 *
 * Realistic, call-center-grade sample data for the "AI workforce control CRM".
 * Models AI agents as EMPLOYEES with full work history, plus support tickets
 * and team-level metrics. Pure mock data — no backend wiring yet.
 *
 * Designed to be shared: the agent/work-history/metric shapes are generic so
 * the Lead and Campaign CRMs can reuse them later.
 */

export type AgentStatus = "on-call" | "available" | "wrap-up" | "paused" | "offline";
export type CallOutcome = "resolved" | "escalated" | "callback" | "dropped" | "transferred";
export type Sentiment = "positive" | "neutral" | "negative";
export type TicketStatus = "open" | "in-progress" | "pending" | "resolved" | "closed";
export type TicketPriority = "urgent" | "high" | "medium" | "low";
export type Channel = "voice" | "chat" | "email" | "whatsapp";

export interface CallRecord {
  id: string;
  time: string;            // e.g. "10:42 AM"
  customer: string;
  phone: string;
  durationSec: number;
  outcome: CallOutcome;
  sentiment: Sentiment;
  topic: string;
  summary: string;
  csat?: number;           // 1–5, if surveyed
}

export interface ShiftBlock {
  label: string;           // e.g. "09:00 – 10:00"
  calls: number;
  talkMinutes: number;
}

export interface AgentMetrics {
  callsToday: number;
  callsHandledTotal: number;
  avgHandleSec: number;     // average handle time
  resolutionRate: number;   // %
  csat: number;             // 1–5
  slaCompliance: number;    // %
  occupancy: number;        // % of shift on calls
}

export interface AIAgentEmployee {
  id: string;
  name: string;
  role: string;             // e.g. "Tier-1 Support", "Billing Specialist"
  avatarHue: number;        // for a consistent generated avatar color
  status: AgentStatus;
  languages: string[];
  hiredOn: string;          // "deployed" date, framed as employment
  shiftStart: string;
  shiftEnd: string;
  liveCustomer?: string;    // who they're talking to right now (if on-call)
  liveSinceSec?: number;    // current call elapsed
  metrics: AgentMetrics;
  todayShift: ShiftBlock[];
  recentCalls: CallRecord[];
}

export interface SupportTicket {
  id: string;               // e.g. "TKT-10482"
  subject: string;
  customer: string;
  channel: Channel;
  status: TicketStatus;
  priority: TicketPriority;
  assignedAgentId: string;
  createdAt: string;        // "10:12 AM"
  slaMinutesLeft: number;   // negative = breached
  lastMessage: string;
}

export interface LiveCall {
  id: string;
  agentId: string;
  customer: string;
  phone: string;
  elapsedSec: number;
  topic: string;
  sentiment: Sentiment;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function statusMeta(status: AgentStatus): { label: string; dot: string; text: string; bg: string } {
  switch (status) {
    case "on-call":
      return { label: "On Call", dot: "bg-green-500", text: "text-green-700 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20 border-green-200/70 dark:border-green-800/50" };
    case "available":
      return { label: "Available", dot: "bg-sky-500", text: "text-sky-700 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-900/20 border-sky-200/70 dark:border-sky-800/50" };
    case "wrap-up":
      return { label: "Wrap-up", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200/70 dark:border-amber-800/50" };
    case "paused":
      return { label: "Paused", dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600" };
    case "offline":
      return { label: "Offline", dot: "bg-slate-300", text: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700" };
  }
}

export function priorityMeta(p: TicketPriority): { label: string; cls: string } {
  switch (p) {
    case "urgent": return { label: "Urgent", cls: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200/70 dark:border-red-800/50" };
    case "high":   return { label: "High",   cls: "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200/70 dark:border-orange-800/50" };
    case "medium": return { label: "Medium", cls: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200/70 dark:border-amber-800/50" };
    case "low":    return { label: "Low",    cls: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600" };
  }
}

export function ticketStatusMeta(s: TicketStatus): { label: string; cls: string } {
  switch (s) {
    case "open":        return { label: "Open",        cls: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200/70 dark:border-blue-800/50" };
    case "in-progress": return { label: "In Progress", cls: "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-200/70 dark:border-violet-800/50" };
    case "pending":     return { label: "Pending",     cls: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200/70 dark:border-amber-800/50" };
    case "resolved":    return { label: "Resolved",    cls: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-800/50" };
    case "closed":      return { label: "Closed",      cls: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600" };
  }
}

export function sentimentMeta(s: Sentiment): { label: string; cls: string } {
  switch (s) {
    case "positive": return { label: "Positive", cls: "text-emerald-600 dark:text-emerald-400" };
    case "neutral":  return { label: "Neutral",  cls: "text-slate-500 dark:text-slate-400" };
    case "negative": return { label: "Negative", cls: "text-red-600 dark:text-red-400" };
  }
}

export function outcomeMeta(o: CallOutcome): { label: string; cls: string } {
  switch (o) {
    case "resolved":    return { label: "Resolved",    cls: "text-emerald-600 dark:text-emerald-400" };
    case "escalated":   return { label: "Escalated",   cls: "text-orange-600 dark:text-orange-400" };
    case "callback":    return { label: "Callback",    cls: "text-blue-600 dark:text-blue-400" };
    case "transferred": return { label: "Transferred", cls: "text-violet-600 dark:text-violet-400" };
    case "dropped":     return { label: "Dropped",     cls: "text-red-600 dark:text-red-400" };
  }
}

// ── The AI workforce ──────────────────────────────────────────────────────────

const mkCalls = (seed: string): CallRecord[] => {
  const topics = ["Billing query", "Plan upgrade", "Network issue", "SIM activation", "Refund request", "Recharge failure", "KYC verification", "Complaint follow-up"];
  const names = ["Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sneha Reddy", "Vikram Singh", "Anjali Mehta", "Karan Gupta", "Pooja Nair"];
  const outcomes: CallOutcome[] = ["resolved", "resolved", "resolved", "escalated", "callback", "transferred", "resolved"];
  const sentiments: Sentiment[] = ["positive", "neutral", "positive", "negative", "neutral", "positive"];
  const times = ["10:42 AM", "10:31 AM", "10:18 AM", "10:04 AM", "09:51 AM", "09:39 AM", "09:22 AM", "09:08 AM"];
  return Array.from({ length: 8 }).map((_, i) => {
    const outcome = outcomes[i % outcomes.length];
    return {
      id: `${seed}-c${i}`,
      time: times[i % times.length],
      customer: names[(i + seed.length) % names.length],
      phone: `+91 9${(800000000 + i * 1234567 + seed.length * 1000).toString().slice(0, 9)}`,
      durationSec: 120 + ((i * 47 + seed.length * 13) % 360),
      outcome,
      sentiment: sentiments[(i + seed.length) % sentiments.length],
      topic: topics[(i + seed.length) % topics.length],
      summary:
        outcome === "resolved"
          ? "Customer's issue was understood and resolved on the call; confirmation shared."
          : outcome === "escalated"
          ? "Complex case beyond Tier-1 scope; escalated to a human specialist with full context."
          : "Customer requested a follow-up; callback scheduled and logged automatically.",
      csat: outcome === "resolved" ? 4 + (i % 2) : i % 2 === 0 ? 3 : undefined,
    };
  });
};

const mkShift = (peak: number): ShiftBlock[] =>
  ["09:00 – 10:00", "10:00 – 11:00", "11:00 – 12:00", "12:00 – 13:00", "13:00 – 14:00", "14:00 – 15:00"].map((label, i) => ({
    label,
    calls: Math.max(2, peak - Math.abs(i - 2) * 2 + (i % 2)),
    talkMinutes: Math.max(12, (peak - Math.abs(i - 2)) * 6 + (i % 3) * 4),
  }));

export const AGENTS: AIAgentEmployee[] = [
  {
    id: "agent-aria",
    name: "Aria",
    role: "Tier-1 Support",
    avatarHue: 210,
    status: "on-call",
    languages: ["English", "Hindi"],
    hiredOn: "Deployed 14 Mar 2026",
    shiftStart: "09:00 AM",
    shiftEnd: "06:00 PM",
    liveCustomer: "Rajesh Kumar",
    liveSinceSec: 184,
    metrics: { callsToday: 63, callsHandledTotal: 4821, avgHandleSec: 228, resolutionRate: 89, csat: 4.6, slaCompliance: 96, occupancy: 82 },
    todayShift: mkShift(14),
    recentCalls: mkCalls("aria"),
  },
  {
    id: "agent-kabir",
    name: "Kabir",
    role: "Billing Specialist",
    avatarHue: 150,
    status: "available",
    languages: ["English", "Hindi", "Marathi"],
    hiredOn: "Deployed 02 Feb 2026",
    shiftStart: "09:00 AM",
    shiftEnd: "06:00 PM",
    metrics: { callsToday: 58, callsHandledTotal: 6190, avgHandleSec: 256, resolutionRate: 92, csat: 4.7, slaCompliance: 98, occupancy: 76 },
    todayShift: mkShift(12),
    recentCalls: mkCalls("kabir"),
  },
  {
    id: "agent-meera",
    name: "Meera",
    role: "Retention Agent",
    avatarHue: 280,
    status: "on-call",
    languages: ["English", "Hindi", "Tamil"],
    hiredOn: "Deployed 21 Jan 2026",
    shiftStart: "10:00 AM",
    shiftEnd: "07:00 PM",
    liveCustomer: "Sneha Reddy",
    liveSinceSec: 47,
    metrics: { callsToday: 49, callsHandledTotal: 5402, avgHandleSec: 312, resolutionRate: 85, csat: 4.4, slaCompliance: 93, occupancy: 88 },
    todayShift: mkShift(11),
    recentCalls: mkCalls("meera"),
  },
  {
    id: "agent-rohan",
    name: "Rohan",
    role: "Technical Support",
    avatarHue: 25,
    status: "wrap-up",
    languages: ["English", "Hindi"],
    hiredOn: "Deployed 09 Mar 2026",
    shiftStart: "09:00 AM",
    shiftEnd: "06:00 PM",
    metrics: { callsToday: 41, callsHandledTotal: 3110, avgHandleSec: 374, resolutionRate: 81, csat: 4.2, slaCompliance: 90, occupancy: 79 },
    todayShift: mkShift(9),
    recentCalls: mkCalls("rohan"),
  },
  {
    id: "agent-zoya",
    name: "Zoya",
    role: "Tier-1 Support",
    avatarHue: 330,
    status: "paused",
    languages: ["English", "Hindi", "Bengali"],
    hiredOn: "Deployed 28 Feb 2026",
    shiftStart: "11:00 AM",
    shiftEnd: "08:00 PM",
    metrics: { callsToday: 34, callsHandledTotal: 2740, avgHandleSec: 241, resolutionRate: 88, csat: 4.5, slaCompliance: 95, occupancy: 71 },
    todayShift: mkShift(8),
    recentCalls: mkCalls("zoya"),
  },
  {
    id: "agent-dev",
    name: "Dev",
    role: "Escalations",
    avatarHue: 190,
    status: "available",
    languages: ["English", "Hindi", "Telugu"],
    hiredOn: "Deployed 12 Jan 2026",
    shiftStart: "12:00 PM",
    shiftEnd: "09:00 PM",
    metrics: { callsToday: 27, callsHandledTotal: 4015, avgHandleSec: 421, resolutionRate: 94, csat: 4.8, slaCompliance: 97, occupancy: 68 },
    todayShift: mkShift(7),
    recentCalls: mkCalls("dev"),
  },
];

// ── Live calls in progress (derived from on-call agents) ──────────────────────

export const LIVE_CALLS: LiveCall[] = AGENTS.filter((a) => a.status === "on-call").map((a) => ({
  id: `live-${a.id}`,
  agentId: a.id,
  customer: a.liveCustomer || "Customer",
  phone: "+91 98XXXXXX21",
  elapsedSec: a.liveSinceSec || 60,
  topic: a.recentCalls[0]?.topic || "Support",
  sentiment: "neutral",
}));

// ── Support tickets / inquiries ───────────────────────────────────────────────

export const TICKETS: SupportTicket[] = [
  { id: "TKT-10492", subject: "Double charged on monthly recharge", customer: "Rajesh Kumar", channel: "voice", status: "in-progress", priority: "urgent", assignedAgentId: "agent-kabir", createdAt: "10:12 AM", slaMinutesLeft: 14, lastMessage: "AI confirmed duplicate transaction; refund initiated, awaiting finance approval." },
  { id: "TKT-10491", subject: "Network down in Andheri East", customer: "Priya Sharma", channel: "voice", status: "open", priority: "high", assignedAgentId: "agent-rohan", createdAt: "10:05 AM", slaMinutesLeft: 28, lastMessage: "Outage logged; customer notified of ETA. Monitoring restoration." },
  { id: "TKT-10489", subject: "Unable to activate new SIM", customer: "Amit Patel", channel: "chat", status: "pending", priority: "medium", assignedAgentId: "agent-aria", createdAt: "09:48 AM", slaMinutesLeft: 52, lastMessage: "Awaiting customer to share alternate ID proof for KYC." },
  { id: "TKT-10487", subject: "Request to downgrade plan", customer: "Sneha Reddy", channel: "voice", status: "in-progress", priority: "low", assignedAgentId: "agent-meera", createdAt: "09:39 AM", slaMinutesLeft: 91, lastMessage: "Retention offer presented; customer considering. Follow-up scheduled." },
  { id: "TKT-10485", subject: "Refund not received after 7 days", customer: "Vikram Singh", channel: "email", status: "open", priority: "high", assignedAgentId: "agent-dev", createdAt: "09:21 AM", slaMinutesLeft: -6, lastMessage: "SLA breached — escalated to specialist for priority handling." },
  { id: "TKT-10482", subject: "Roaming charges clarification", customer: "Anjali Mehta", channel: "whatsapp", status: "resolved", priority: "medium", assignedAgentId: "agent-kabir", createdAt: "09:02 AM", slaMinutesLeft: 0, lastMessage: "AI explained roaming slabs; customer satisfied. Ticket closed." },
  { id: "TKT-10480", subject: "Add-on data pack not reflecting", customer: "Karan Gupta", channel: "chat", status: "in-progress", priority: "medium", assignedAgentId: "agent-aria", createdAt: "08:54 AM", slaMinutesLeft: 33, lastMessage: "Provisioning re-triggered; customer asked to recheck in 10 minutes." },
  { id: "TKT-10478", subject: "Bill explanation request", customer: "Pooja Nair", channel: "voice", status: "resolved", priority: "low", assignedAgentId: "agent-zoya", createdAt: "08:40 AM", slaMinutesLeft: 0, lastMessage: "Line-by-line bill walkthrough completed; customer satisfied." },
];

// ── Team-level metrics for Overview & Reports ─────────────────────────────────

export const TEAM_METRICS = {
  callsToday: AGENTS.reduce((s, a) => s + a.metrics.callsToday, 0),
  liveCalls: LIVE_CALLS.length,
  inQueue: 7,
  avgWaitSec: 18,
  resolutionRate: Math.round(AGENTS.reduce((s, a) => s + a.metrics.resolutionRate, 0) / AGENTS.length),
  avgHandleSec: Math.round(AGENTS.reduce((s, a) => s + a.metrics.avgHandleSec, 0) / AGENTS.length),
  csat: (AGENTS.reduce((s, a) => s + a.metrics.csat, 0) / AGENTS.length).toFixed(1),
  slaCompliance: Math.round(AGENTS.reduce((s, a) => s + a.metrics.slaCompliance, 0) / AGENTS.length),
  openTickets: TICKETS.filter((t) => t.status !== "resolved" && t.status !== "closed").length,
  breachedSla: TICKETS.filter((t) => t.slaMinutesLeft < 0).length,
  // Hourly call volume for the chart (09:00 → 18:00)
  hourlyVolume: [
    { hour: "09", calls: 142 },
    { hour: "10", calls: 198 },
    { hour: "11", calls: 231 },
    { hour: "12", calls: 176 },
    { hour: "13", calls: 121 },
    { hour: "14", calls: 209 },
    { hour: "15", calls: 244 },
    { hour: "16", calls: 218 },
    { hour: "17", calls: 167 },
  ],
};

export function getAgent(id: string): AIAgentEmployee | undefined {
  return AGENTS.find((a) => a.id === id);
}

// ── Customers ─────────────────────────────────────────────────────────────────

export interface CustomerReview {
  rating: number;          // 1–5
  comment: string;
  date: string;
  ticketId: string;
}

export interface CustomerTicketRef {
  id: string;
  subject: string;
  status: TicketStatus;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  since: string;            // first seen
  source: "ai-call" | "import" | "chat" | "form";
  tags: string[];
  activeTickets: number;
  totalTickets: number;
  avgRating?: number;       // average review rating
  lastContact: string;
  tickets: CustomerTicketRef[];
  reviews: CustomerReview[];
}

const mkCustomerTickets = (seed: number): CustomerTicketRef[] => {
  const subs = ["Billing query", "Network issue", "Plan upgrade", "Refund request", "SIM activation", "Complaint follow-up", "Roaming clarification"];
  const statuses: TicketStatus[] = ["resolved", "resolved", "in-progress", "open", "closed", "pending"];
  const dates = ["Today", "Yesterday", "3 days ago", "1 week ago", "2 weeks ago", "1 month ago"];
  const n = 2 + (seed % 4);
  return Array.from({ length: n }).map((_, i) => ({
    id: `TKT-${10400 + seed * 7 + i}`,
    subject: subs[(seed + i) % subs.length],
    status: statuses[(seed + i) % statuses.length],
    date: dates[i % dates.length],
  }));
};

const mkReviews = (seed: number): CustomerReview[] => {
  const comments = [
    "Issue resolved quickly, the assistant was very clear.",
    "Got my answer without waiting on hold — impressive.",
    "Polite and helpful, understood my problem first time.",
    "Took a couple of tries but finally sorted out.",
    "Fast and accurate. Didn't expect this from an AI.",
  ];
  const dates = ["2 days ago", "1 week ago", "3 weeks ago"];
  const n = seed % 3; // 0–2 reviews
  return Array.from({ length: n }).map((_, i) => ({
    rating: 5 - ((seed + i) % 3),
    comment: comments[(seed + i) % comments.length],
    date: dates[i % dates.length],
    ticketId: `TKT-${10400 + seed * 7 + i}`,
  }));
};

const CUSTOMER_SEED = [
  { name: "Rajesh Kumar", location: "Delhi", source: "ai-call" as const },
  { name: "Priya Sharma", location: "Mumbai", source: "import" as const },
  { name: "Amit Patel", location: "Ahmedabad", source: "ai-call" as const },
  { name: "Sneha Reddy", location: "Hyderabad", source: "chat" as const },
  { name: "Vikram Singh", location: "Jaipur", source: "import" as const },
  { name: "Anjali Mehta", location: "Pune", source: "form" as const },
  { name: "Karan Gupta", location: "Bengaluru", source: "ai-call" as const },
  { name: "Pooja Nair", location: "Kochi", source: "import" as const },
  { name: "Rahul Verma", location: "Lucknow", source: "ai-call" as const },
  { name: "Divya Iyer", location: "Chennai", source: "chat" as const },
  { name: "Sahil Khan", location: "Hyderabad", source: "import" as const },
  { name: "Neha Joshi", location: "Indore", source: "ai-call" as const },
];

export const CUSTOMERS: Customer[] = CUSTOMER_SEED.map((c, i) => {
  const tickets = mkCustomerTickets(i + 1);
  const reviews = mkReviews(i + 1);
  const active = tickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : undefined;
  return {
    id: `cust-${i + 1}`,
    name: c.name,
    phone: `+91 9${(800000000 + i * 4567321).toString().slice(0, 9)}`,
    email: `${c.name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
    location: c.location,
    since: ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"][i % 4],
    source: c.source,
    tags: i % 3 === 0 ? ["VIP"] : i % 4 === 0 ? ["At-risk"] : [],
    activeTickets: active,
    totalTickets: tickets.length,
    avgRating: avg,
    lastContact: ["Today", "Yesterday", "2 days ago", "1 week ago"][i % 4],
    tickets,
    reviews,
  };
});

export function getCustomer(id: string): Customer | undefined {
  return CUSTOMERS.find((c) => c.id === id);
}

export const CUSTOMER_STATS = {
  total: CUSTOMERS.length,
  withActive: CUSTOMERS.filter((c) => c.activeTickets > 0).length,
  resolved: CUSTOMERS.filter((c) => c.activeTickets === 0).length,
  avgRating: (
    CUSTOMERS.filter((c) => c.avgRating).reduce((s, c) => s + (c.avgRating || 0), 0) /
    Math.max(1, CUSTOMERS.filter((c) => c.avgRating).length)
  ).toFixed(1),
  reviewsCount: CUSTOMERS.reduce((s, c) => s + c.reviews.length, 0),
};

export function sourceMeta(s: Customer["source"]): { label: string; cls: string } {
  switch (s) {
    case "ai-call": return { label: "AI Call", cls: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200/70 dark:border-blue-800/50" };
    case "import":  return { label: "Imported", cls: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-200/70 dark:border-violet-800/50" };
    case "chat":    return { label: "Chat", cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-800/50" };
    case "form":    return { label: "Form", cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200/70 dark:border-amber-800/50" };
  }
}

// ── Import history ────────────────────────────────────────────────────────────

export type ImportSource = "csv" | "excel" | "webhook" | "api";
export type ImportStatus = "completed" | "processing" | "failed" | "partial";

export interface ImportJob {
  id: string;
  source: ImportSource;
  fileName: string;
  records: number;
  imported: number;
  failed: number;
  status: ImportStatus;
  date: string;
  by: string;
}

export const IMPORT_HISTORY: ImportJob[] = [
  { id: "imp-1", source: "csv", fileName: "subscribers_q1_2026.csv", records: 4820, imported: 4791, failed: 29, status: "completed", date: "Today, 09:12 AM", by: "You" },
  { id: "imp-2", source: "excel", fileName: "legacy_complaints.xlsx", records: 12450, imported: 12450, failed: 0, status: "completed", date: "Yesterday, 04:30 PM", by: "You" },
  { id: "imp-3", source: "api", fileName: "Zendesk sync (tickets)", records: 880, imported: 862, failed: 18, status: "partial", date: "2 days ago", by: "Integration" },
  { id: "imp-4", source: "webhook", fileName: "Live form intake", records: 156, imported: 156, failed: 0, status: "processing", date: "Live", by: "Webhook" },
];

export function importSourceMeta(s: ImportSource): { label: string; cls: string } {
  switch (s) {
    case "csv":     return { label: "CSV", cls: "text-emerald-600 dark:text-emerald-400" };
    case "excel":   return { label: "Excel", cls: "text-green-700 dark:text-green-400" };
    case "webhook": return { label: "Webhook", cls: "text-violet-600 dark:text-violet-400" };
    case "api":     return { label: "API", cls: "text-blue-600 dark:text-blue-400" };
  }
}

export function importStatusMeta(s: ImportStatus): { label: string; cls: string } {
  switch (s) {
    case "completed":  return { label: "Completed", cls: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-800/50" };
    case "processing": return { label: "Processing", cls: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200/70 dark:border-blue-800/50" };
    case "partial":    return { label: "Partial", cls: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200/70 dark:border-amber-800/50" };
    case "failed":     return { label: "Failed", cls: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200/70 dark:border-red-800/50" };
  }
}
