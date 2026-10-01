import { useCallback, useEffect, useState } from "react";

/**
 * ── Agent ↔ App (CRM) behavior config ────────────────────────────────────────
 *
 * Once an app's skill is assigned to an agent (see useAgentSkills.ts), this
 * stores HOW that agent is allowed to use the app's data to answer customer
 * inquiries: which data domains it can read, how it should respond, and when
 * it should hand off to a human. This is config, not a new agent — the Main
 * Agent architecture still applies: the agent reads/acts via the skill, this
 * just scopes what the skill is allowed to do.
 *
 * STORAGE: localStorage for now, keyed by `${agentId}:${appId}`. Swap
 * `readAgentCrmConfig` / `writeAgentCrmConfig` for API calls when the backend
 * lands — every consumer (AgentCrmConfigPanel) keeps working unchanged.
 */

export type UnknownQuestionAction = "escalate" | "apologize";
export type AgentTone = "formal" | "friendly" | "concise";

/** One piece of information the agent must collect before it can complete a flow. */
export interface FlowField {
  key: string;
  label: string;
  required: boolean;
}

/**
 * A conversation flow the agent handles for this app — e.g. "Book an
 * appointment". Each flow lists exactly what data the agent must collect
 * from the customer before it can act, so "what does the AI ask for" is a
 * real, editable checklist instead of a guess baked into a prompt somewhere.
 */
export interface AgentFlow {
  id: string;
  name: string;
  /** What triggers this flow, e.g. "Customer wants to book a new appointment". */
  trigger: string;
  enabled: boolean;
  fields: FlowField[];
}

export interface AgentCrmConfig {
  /** Which of the app's data domains (workspace section keys) the agent may read from. */
  dataAccess: string[];
  behavior: {
    /** Can the agent create/modify records (e.g. book an appointment) vs. only inform the customer. */
    canModifyRecords: boolean;
    unknownQuestionAction: UnknownQuestionAction;
    tone: AgentTone;
  };
  escalation: {
    enabled: boolean;
    /** Hand off to a human after this many consecutive failed/unclear replies. */
    maxFailedAttempts: number;
    /** Always escalate if the customer's message contains any of these (e.g. "cancel", "complaint", "refund"). */
    escalateOnKeywords: string[];
    notifyEmail: string;
  };
  /** Per-scenario data-collection flows — null until seeded from the app's defaults. */
  flows: AgentFlow[] | null;
}

export const DEFAULT_AGENT_CRM_CONFIG: AgentCrmConfig = {
  dataAccess: [],
  behavior: {
    canModifyRecords: false,
    unknownQuestionAction: "escalate",
    tone: "friendly",
  },
  escalation: {
    enabled: true,
    maxFailedAttempts: 2,
    escalateOnKeywords: ["cancel", "complaint", "refund"],
    notifyEmail: "",
  },
  flows: null,
};

/**
 * Starter flows per app — grounded in each app's real data model (e.g.
 * Appointment CRM's Booking fields: customer, phone, service, provider,
 * branch, department, date, time). Fully editable after seeding; this is
 * just a sensible first draft so the user isn't starting from a blank list.
 */
const DEFAULT_FLOWS_BY_APP: Record<string, Omit<AgentFlow, "id">[]> = {
  "appointment-crm": [
    {
      name: "Book an appointment",
      trigger: "Customer wants to schedule a new appointment",
      enabled: true,
      fields: [
        { key: "customer_name", label: "Full name", required: true },
        { key: "phone", label: "Phone number", required: true },
        { key: "service", label: "Service / reason for visit", required: true },
        { key: "department", label: "Department", required: false },
        { key: "provider", label: "Preferred staff member", required: false },
        { key: "branch", label: "Branch / location", required: true },
        { key: "date", label: "Preferred date", required: true },
        { key: "time", label: "Preferred time", required: true },
      ],
    },
    {
      name: "Reschedule an appointment",
      trigger: "Customer wants to move an existing appointment",
      enabled: true,
      fields: [
        { key: "phone", label: "Phone number (to find the booking)", required: true },
        { key: "booking_id", label: "Appointment reference / ID", required: false },
        { key: "new_date", label: "New preferred date", required: true },
        { key: "new_time", label: "New preferred time", required: true },
      ],
    },
    {
      name: "Cancel an appointment",
      trigger: "Customer wants to cancel a booked appointment",
      enabled: true,
      fields: [
        { key: "phone", label: "Phone number (to find the booking)", required: true },
        { key: "booking_id", label: "Appointment reference / ID", required: false },
        { key: "cancel_reason", label: "Reason for cancelling", required: false },
      ],
    },
    {
      name: "Check availability",
      trigger: "Customer asks what slots are open",
      enabled: true,
      fields: [
        { key: "department", label: "Department", required: false },
        { key: "provider", label: "Preferred staff member", required: false },
        { key: "date_range", label: "Date or date range", required: true },
      ],
    },
  ],
  "support-crm": [
    {
      name: "Log a new inquiry",
      trigger: "Customer raises a question or issue for the first time",
      enabled: true,
      fields: [
        { key: "customer_name", label: "Full name", required: true },
        { key: "contact", label: "Phone or email", required: true },
        { key: "issue_summary", label: "What they need help with", required: true },
        { key: "department", label: "Department", required: false },
      ],
    },
    {
      name: "Check ticket status",
      trigger: "Customer asks about an existing ticket",
      enabled: true,
      fields: [
        { key: "ticket_id", label: "Ticket reference / ID", required: false },
        { key: "contact", label: "Phone or email (to find the ticket)", required: true },
      ],
    },
  ],
};

export function defaultFlowsForApp(appId: string): AgentFlow[] {
  const preset = DEFAULT_FLOWS_BY_APP[appId] ?? [];
  return preset.map((f, i) => ({ ...f, id: `${appId}-flow-${i}` }));
}

const STORAGE_PREFIX = "shivai_agent_crm_config_";
const EVENT = "shivai:agent-crm-config-changed";

function storageKey(agentId: string, appId: string): string {
  return `${STORAGE_PREFIX}${agentId}__${appId}`;
}

export function readAgentCrmConfig(agentId: string, appId: string): AgentCrmConfig {
  try {
    const raw = localStorage.getItem(storageKey(agentId, appId));
    if (!raw) return { ...DEFAULT_AGENT_CRM_CONFIG, flows: defaultFlowsForApp(appId) };
    const parsed = JSON.parse(raw);
    return {
      dataAccess: Array.isArray(parsed?.dataAccess) ? parsed.dataAccess : [],
      behavior: { ...DEFAULT_AGENT_CRM_CONFIG.behavior, ...(parsed?.behavior ?? {}) },
      escalation: { ...DEFAULT_AGENT_CRM_CONFIG.escalation, ...(parsed?.escalation ?? {}) },
      flows: Array.isArray(parsed?.flows) ? parsed.flows : defaultFlowsForApp(appId),
    };
  } catch {
    return { ...DEFAULT_AGENT_CRM_CONFIG, flows: defaultFlowsForApp(appId) };
  }
}

function writeAgentCrmConfig(agentId: string, appId: string, config: AgentCrmConfig): void {
  try {
    localStorage.setItem(storageKey(agentId, appId), JSON.stringify(config));
  } catch {
    /* storage full / unavailable — ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { agentId, appId } }));
}

export interface UseAgentCrmConfig {
  config: AgentCrmConfig;
  save: (next: AgentCrmConfig) => void;
}

export function useAgentCrmConfig(agentId: string | null | undefined, appId: string): UseAgentCrmConfig {
  const [config, setConfig] = useState<AgentCrmConfig>(() =>
    agentId ? readAgentCrmConfig(agentId, appId) : DEFAULT_AGENT_CRM_CONFIG,
  );

  useEffect(() => {
    setConfig(agentId ? readAgentCrmConfig(agentId, appId) : DEFAULT_AGENT_CRM_CONFIG);
  }, [agentId, appId]);

  useEffect(() => {
    if (!agentId) return;
    const sync = (e: Event) => {
      const detail = (e as CustomEvent<{ agentId?: string; appId?: string }>).detail;
      if (!detail || (detail.agentId === agentId && detail.appId === appId)) {
        setConfig(readAgentCrmConfig(agentId, appId));
      }
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [agentId, appId]);

  const save = useCallback(
    (next: AgentCrmConfig) => {
      if (!agentId) return;
      writeAgentCrmConfig(agentId, appId, next);
    },
    [agentId, appId],
  );

  return { config, save };
}
