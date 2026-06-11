import {
  Globe,
  Sparkles,
  Headphones,
  Target,
  CalendarClock,
  PhoneOutgoing,
  PhoneIncoming,
  HeartPulse,
  FileSpreadsheet,
  Table2,
  Star,
  Users,
  Ticket,
  Activity,
  BarChart3,
  Contact,
  Building2,
  LayoutDashboard,
  PanelsTopLeft,
  Settings as SettingsIcon,
  LucideIcon,
} from "lucide-react";

/**
 * ── ShivAI Features Marketplace — App Catalog ────────────────────────────────
 *
 * Single source of truth for every "feature app" available in the marketplace.
 * Browse, detail, sidebar "My Apps", and install logic all read from here.
 *
 * Adding a new app = add an entry to APPS below. Nothing else required for it
 * to appear in the marketplace. To make it openable, point `route` at a real
 * route registered in App.tsx.
 *
 * `status`:
 *   - "live"        → can be installed & opened
 *   - "coming-soon" → shown in catalog, install disabled
 */

export type AppStatus = "live" | "coming-soon";

/**
 * A sub-nav item shown in the app workspace's left rail. `key` is matched
 * against the `?section=` query param so the app can switch its own view.
 */
export interface WorkspaceSection {
  key: string;
  label: string;
  icon: LucideIcon;
}

export interface MarketplaceApp {
  /** Stable id — also the localStorage key. Never change once shipped. */
  id: string;
  name: string;
  /** One-line pitch shown on the catalog card. */
  tagline: string;
  /** Longer paragraph shown on the detail page. */
  description: string;
  icon: LucideIcon;
  category: AppCategory;
  status: AppStatus;
  /**
   * Legacy in-dashboard route (kept for redirects). The app actually opens in
   * its standalone workspace at `/app/{id}` — see `openAppWorkspace()`.
   */
  route: string;
  /** Left-rail sections shown inside the app's standalone workspace. */
  workspaceSections?: WorkspaceSection[];
  /** Brand gradient for the app tile (tailwind from/to classes). */
  gradient: string;
  /** Short feature bullets for the detail page. */
  features: string[];
  /** Optional badge, e.g. "New", "Popular". */
  badge?: string;
  /** Whether this app is free or part of a paid plan (display only for now). */
  pricing: "Free" | "Included" | "Premium";
}

export type AppCategory =
  | "CRM"
  | "Sales"
  | "Support"
  | "Scheduling"
  | "Campaigns"
  | "Healthcare"
  | "Productivity"
  | "Telephony"
  | "Customer Experience"
  | "Website & Web";

export const CATEGORIES: { id: AppCategory | "all"; label: string }[] = [
  { id: "all", label: "All Apps" },
  { id: "CRM", label: "CRM" },
  { id: "Sales", label: "Sales" },
  { id: "Support", label: "Support" },
  { id: "Scheduling", label: "Scheduling" },
  { id: "Campaigns", label: "Campaigns" },
  { id: "Healthcare", label: "Healthcare" },
  { id: "Productivity", label: "Productivity" },
  { id: "Telephony", label: "Telephony" },
  { id: "Customer Experience", label: "Customer Experience" },
  { id: "Website & Web", label: "Website & Web" },
];

export const APPS: MarketplaceApp[] = [
  {
    id: "website-builder",
    name: "Website Builder",
    tagline: "Generate a complete, conversion-ready website with AI in minutes.",
    description:
      "Spin up a professional, fully-responsive website without writing a line of code. Pick your industry, tone, and theme — then edit visually, preview on desktop & mobile, and publish a shareable link. Comes with 20+ industry templates and 10 design themes. How AI helps: generative AI writes your headlines and section copy, chooses the right layout and imagery for your industry, and assembles a complete, on-brand site in seconds — turning a one-line brief into a finished website.",
    icon: Globe,
    category: "Website & Web",
    status: "live",
    route: "/websites",
    gradient: "from-blue-500 to-cyan-400",
    pricing: "Included",
    badge: "New",
    workspaceSections: [
      { key: "builder", label: "Builder", icon: PanelsTopLeft },
      { key: "sites", label: "My Sites", icon: Globe },
      { key: "settings", label: "Settings", icon: SettingsIcon },
    ],
    features: [
      "AI-generated websites from a simple brief",
      "20+ industry templates, 10 design themes",
      "Visual editor with live desktop & mobile preview",
      "One-click publish to a shareable link",
      "Export clean HTML anytime",
    ],
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    tagline: "Auto-log every call, lead, and booking straight into Sheets.",
    description:
      "Connect a Google Sheet, create one from ready-made templates, assign an AI Employee to each, and view live rows right inside ShivAI. How AI helps: during every call the AI listens, understands the conversation, and extracts the fields you care about — name, phone, issue, outcome — then writes a clean, structured row to your sheet automatically. No manual data entry, no copy-paste.",
    icon: FileSpreadsheet,
    category: "Productivity",
    status: "live",
    route: "/google-sheets",
    gradient: "from-emerald-600 to-green-500",
    pricing: "Included",
    workspaceSections: [
      { key: "sheets", label: "My Sheets", icon: Table2 },
      { key: "settings", label: "Settings", icon: SettingsIcon },
    ],
    features: [
      "Auto-write leads, call logs & tickets to Sheets",
      "Ready-made templates (Leads, Support, Appointments…)",
      "Assign an AI Employee to each sheet",
      "View live sheet rows inside ShivAI",
    ],
  },
  {
    id: "support-crm",
    name: "Inquiry, Help & Support CRM",
    tagline: "A full-control support CRM for any industry — run your AI agents like a team.",
    description:
      "A complete, industry-adaptable help-desk CRM that lets you run your AI agents like a workforce — for telecom, government, healthcare, retail, and more. Manage agents as employees with full work history, track every inquiry as a ticket with SLAs, and get a 360° view of every customer including their active/resolved tickets and reviews. Bring your existing data in via CSV, Excel, webhook, or API. How AI helps: the AI answers common questions instantly to deflect easy tickets, understands and categorizes each inquiry in your industry's terms, sets priority from the customer's words, and escalates anything complex to a human — replacing routine calling work while your team handles the exceptions.",
    icon: Headphones,
    category: "Support",
    status: "live",
    route: "/app/support-crm",
    gradient: "from-blue-500 to-indigo-400",
    pricing: "Premium",
    badge: "New",
    workspaceSections: [
      { key: "overview", label: "Command Center", icon: LayoutDashboard },
      { key: "departments", label: "Departments", icon: Building2 },
      { key: "agents", label: "AI Agents", icon: Users },
      { key: "customers", label: "Customers", icon: Contact },
      { key: "tickets", label: "Inquiries & Tickets", icon: Ticket },
      { key: "live", label: "Live Activity", icon: Activity },
      { key: "reports", label: "Performance", icon: BarChart3 },
      { key: "settings", label: "Setup", icon: SettingsIcon },
    ],
    features: [
      "Works for any industry — telecom, government, healthcare & more",
      "Organise AI agents into departments & processes, like a real team",
      "Import existing customers & tickets via CSV, Excel, webhook or API",
      "Customer 360: active/resolved tickets, history & reviews",
      "Auto-ticket creation with SLA tracking & priority",
      "AI answers FAQs and escalates anything complex to a human",
    ],
  },
  {
    id: "lead-crm",
    name: "Lead Management CRM",
    tagline: "Capture, qualify, and convert leads with an AI-driven pipeline.",
    description:
      "Turn every conversation into a tracked lead and move it through a visual pipeline from new to won. How AI helps: the AI captures lead details from calls and forms, asks the right qualifying questions, scores each lead by intent and fit so your team works the hottest ones first, recommends the next best action, and triggers timely follow-ups automatically — so nothing slips through the cracks.",
    icon: Target,
    category: "Sales",
    status: "coming-soon",
    route: "/marketplace",
    gradient: "from-emerald-500 to-green-400",
    pricing: "Premium",
    features: [
      "Auto-capture leads from calls & forms",
      "AI lead qualification & scoring",
      "Visual drag-and-drop pipeline stages",
      "Automated follow-ups & reminders",
      "Source and conversion analytics",
    ],
  },
  {
    id: "appointment-crm",
    name: "Appointment Scheduling CRM",
    tagline: "Let customers book, reschedule, and get reminders automatically.",
    description:
      "A scheduling CRM that lets customers book, reschedule, and cancel in plain conversation. Sync with your calendar and keep every booking tied to the customer record. How AI helps: the AI understands natural requests like \"next Tuesday afternoon,\" checks real-time availability, books the slot on the spot, and sends smart confirmations and reminders that adapt to reduce no-shows — no back-and-forth, no booking forms.",
    icon: CalendarClock,
    category: "Scheduling",
    status: "coming-soon",
    route: "/marketplace",
    gradient: "from-violet-500 to-purple-400",
    pricing: "Premium",
    features: [
      "Real-time availability & booking on calls",
      "Calendar sync (Google, Outlook)",
      "Automated confirmations & reminders",
      "Reschedule & cancellation handling",
      "Bookings linked to customer records",
    ],
  },
  {
    id: "campaign-crm",
    name: "Inbound & Outbound Campaign CRM",
    tagline: "Run and manage AI calling campaigns end-to-end.",
    description:
      "Plan, launch, and track inbound and outbound calling campaigns from one CRM. Upload contact lists and review transcripts, outcomes, and performance — all tied back to each contact. How AI helps: AI Employees place and answer the calls at scale, hold natural two-way conversations for follow-ups, reminders, surveys and promotions, then auto-summarize each call, tag the outcome, and surface insights across the whole campaign — work that would take a room full of agents.",
    icon: PhoneOutgoing,
    category: "Campaigns",
    status: "coming-soon",
    route: "/marketplace",
    gradient: "from-orange-500 to-amber-400",
    pricing: "Premium",
    features: [
      "Inbound & outbound campaign management",
      "Bulk dialing from contact lists",
      "Follow-ups, reminders, surveys & promos",
      "Per-call transcripts & outcomes",
      "Campaign performance dashboard",
    ],
  },
  {
    id: "healthcare-crm",
    name: "Healthcare CRM",
    tagline: "Manage patients, appointments, and follow-ups for clinics.",
    description:
      "A CRM built for clinics and healthcare providers. Maintain patient records, book and remind appointments, capture inquiries, and run follow-up and recall campaigns. How AI helps: the AI answers routine patient calls 24/7, books and reschedules appointments, triages requests by urgency and routes urgent ones to staff, sends medication and check-up reminders, and logs every interaction to the patient record — freeing your front desk for in-person care.",
    icon: HeartPulse,
    category: "Healthcare",
    status: "coming-soon",
    route: "/marketplace",
    gradient: "from-rose-500 to-pink-400",
    pricing: "Premium",
    features: [
      "Patient records & contact history",
      "Appointment booking & reminders",
      "Inquiry capture and triage",
      "Follow-up & recall campaigns",
      "AI handles routine patient calls",
    ],
  },
  {
    id: "ai-receptionist",
    name: "AI Receptionist",
    tagline: "Answer and route every inbound call, 24/7 — never miss one again.",
    description:
      "A virtual front desk that picks up every call instantly so no call ever goes to voicemail — even after hours and during peak times. How AI helps: the AI greets callers in a natural voice, understands what they need, answers common questions on its own, takes accurate messages, books appointments, and intelligently routes or transfers each caller to the right person or department — handling the volume of a full-time receptionist without the wait.",
    icon: PhoneIncoming,
    category: "Telephony",
    status: "coming-soon",
    route: "/marketplace",
    gradient: "from-sky-500 to-blue-400",
    pricing: "Premium",
    features: [
      "Picks up every inbound call 24/7",
      "Smart call routing & transfers",
      "Takes messages and books appointments",
      "Answers FAQs in your business's voice",
      "After-hours & overflow coverage",
    ],
  },
  {
    id: "feedback-reviews",
    name: "Feedback & Reviews",
    tagline: "Run automated NPS/CSAT surveys and turn happy customers into reviews.",
    description:
      "Automatically measure satisfaction (NPS/CSAT) after every interaction and act on what you learn. How AI helps: the AI runs natural follow-up surveys by call or chat, interprets open-ended answers and detects sentiment, routes unhappy customers to a human for fast recovery, invites happy ones to leave a public review at the right moment, and rolls everything up into satisfaction and sentiment trends over time.",
    icon: Star,
    category: "Customer Experience",
    status: "coming-soon",
    route: "/marketplace",
    gradient: "from-amber-500 to-yellow-400",
    pricing: "Premium",
    features: [
      "Automated NPS & CSAT surveys after calls",
      "Routes unhappy customers to a human",
      "Invites happy customers to leave reviews",
      "Sentiment & satisfaction trends over time",
      "Structured feedback tied to each customer",
    ],
  },
];

/** Lookup a single app by id. */
export function getAppById(id: string): MarketplaceApp | undefined {
  return APPS.find((a) => a.id === id);
}

/** Default left-rail section when an app doesn't declare its own. */
export const DEFAULT_WORKSPACE_SECTION: WorkspaceSection = {
  key: "home",
  label: "Overview",
  icon: LayoutDashboard,
};

/** Canonical standalone workspace URL for an app. */
export function appWorkspacePath(appId: string, section?: string): string {
  return section ? `/app/${appId}?section=${section}` : `/app/${appId}`;
}

/**
 * Open an installed app in its dedicated workspace in a NEW browser tab.
 * Centralised so every entry point (card, detail, sidebar) behaves identically.
 */
export function openAppWorkspace(appId: string, section?: string): void {
  if (typeof window === "undefined") return;
  window.open(appWorkspacePath(appId, section), "_blank", "noopener");
}

/** Icon used for the marketplace nav/section header. */
export const MarketplaceIcon = Sparkles;
