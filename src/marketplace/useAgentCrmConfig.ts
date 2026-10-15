import { useCallback, useEffect, useState } from "react";
import appointmentCrmAPI from "../ClientDashboard/apps/AppointmentCRM/api/index";
import { AppointmentCrmApiError } from "../ClientDashboard/apps/AppointmentCRM/api/client";
import {
  aiConfigToApiBody,
  mapAiConfigFromApi,
} from "../ClientDashboard/apps/AppointmentCRM/api/aiConfigMappers";

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
 * STORAGE: the Appointment CRM's /ai-config API (crm_agent_configs
 * collection) — the ONLY app wired to the real backend so far, since it's
 * the only one with a deployed endpoint. Other apps (support-crm, etc.) still
 * have no backend for this, so this module intentionally stays
 * Appointment-CRM-specific rather than generic across apps.
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
  /** Per-scenario data-collection flows — null until the server config loads. */
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

const APPOINTMENT_CRM_APP_ID = "appointment-crm";
const EVENT = "shivai:agent-crm-config-changed";

// In-memory cache of the last fetch/save response per agentId — never
// persisted to localStorage. Business config always comes from the API.
const memoryConfigs = new Map<string, AgentCrmConfig>();
// Which field keys were already known (present in the server's last response)
// per flow id, so new rows can correctly omit `key` on save per the API's
// "omit key only for brand-new rows" rule.
const knownFieldKeysByAgent = new Map<string, Map<string, Set<string>>>();

function knownFieldKeysFromConfig(config: AgentCrmConfig): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  (config.flows ?? []).forEach((flow) => {
    map.set(flow.id, new Set(flow.fields.map((f) => f.key)));
  });
  return map;
}

function notify(agentId: string): void {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { agentId, appId: APPOINTMENT_CRM_APP_ID } }));
}

export function readAgentCrmConfig(agentId: string, appId: string): AgentCrmConfig {
  if (appId !== APPOINTMENT_CRM_APP_ID) return DEFAULT_AGENT_CRM_CONFIG;
  return memoryConfigs.get(agentId) ?? DEFAULT_AGENT_CRM_CONFIG;
}

/** Loads the real config for one agent from the API — until this resolves,
 * readAgentCrmConfig returns the (empty) default. Safe to call repeatedly. */
export async function fetchAgentCrmConfig(agentId: string, appId: string): Promise<AgentCrmConfig> {
  if (appId !== APPOINTMENT_CRM_APP_ID) return DEFAULT_AGENT_CRM_CONFIG;
  const apiConfig = await appointmentCrmAPI.fetchAiConfig(agentId);
  const config = mapAiConfigFromApi(apiConfig);
  memoryConfigs.set(agentId, config);
  knownFieldKeysByAgent.set(agentId, knownFieldKeysFromConfig(config));
  notify(agentId);
  return config;
}

/** Saves the full config (the server always does a full replace of
 * scenarios) and re-renders from the response, which fills in
 * server-generated keys/types for any new field rows. */
export async function saveAgentCrmConfig(
  agentId: string,
  appId: string,
  next: AgentCrmConfig,
  opts?: { assigned?: boolean; status?: "active" | "paused" },
): Promise<AgentCrmConfig> {
  if (appId !== APPOINTMENT_CRM_APP_ID) throw new Error(`No AI configuration backend for app "${appId}"`);
  const knownFieldKeys = knownFieldKeysByAgent.get(agentId) ?? new Map<string, Set<string>>();
  const body = aiConfigToApiBody(next, {
    assigned: opts?.assigned ?? true,
    status: opts?.status ?? "active",
    knownFieldKeysByFlowId: knownFieldKeys,
  });
  const apiConfig = await appointmentCrmAPI.saveAiConfig(agentId, body);
  const saved = mapAiConfigFromApi(apiConfig);
  memoryConfigs.set(agentId, saved);
  knownFieldKeysByAgent.set(agentId, knownFieldKeysFromConfig(saved));
  notify(agentId);
  return saved;
}

/** Registers an agent as assigned to the Appointment CRM with the real
 * backend — there is no separate "assign" endpoint; per the API spec,
 * assignment IS a saved /ai-config record with `assigned: true`. Called the
 * moment a user picks an agent (not deferred until they later open the
 * config panel and hit Save), using whatever default/unconfigured shape the
 * server already returns for that agent. */
export async function assignAgentCrmConfig(agentId: string, appId: string): Promise<AgentCrmConfig> {
  if (appId !== APPOINTMENT_CRM_APP_ID) throw new Error(`No AI configuration backend for app "${appId}"`);
  const current = await fetchAgentCrmConfig(agentId, appId);
  return saveAgentCrmConfig(agentId, appId, current, { assigned: true, status: "active" });
}

/** The real source of truth for "which agent(s) are assigned to Appointment
 * CRM" — GET /ai-config with no agentId returns every agent's config; an
 * agent is assigned iff its config has `assigned: true`. Appointment CRM
 * does not use useAgentSkills.ts's localStorage for this. */
export async function fetchAssignedAgentIds(): Promise<string[]> {
  const configs = await appointmentCrmAPI.fetchAiConfigs();
  return configs.filter((c) => c.assigned).map((c) => c.agentId);
}

/** React-hook wrapper around fetchAssignedAgentIds — the agent id(s) (at
 * most one, in practice) currently assigned to Appointment CRM per the real
 * backend. Re-fetches whenever an assignment changes anywhere in the app. */
export function useAssignedAgentCrmConfigIds(): { agentIds: string[]; loading: boolean } {
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      setLoading(true);
      fetchAssignedAgentIds()
        .then((ids) => {
          if (!cancelled) setAgentIds(ids);
        })
        .catch(() => {
          if (!cancelled) setAgentIds([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    sync();
    window.addEventListener(EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, sync);
    };
  }, []);

  return { agentIds, loading };
}

/** Whether Appointment CRM has any agent assigned yet, per the real backend
 * (not localStorage) — drives AppWorkspace's persistent "no agent assigned"
 * nag for this app specifically. */
export function useHasAssignedAgentCrmConfig(): { assigned: boolean; loading: boolean } {
  const { agentIds, loading } = useAssignedAgentCrmConfigIds();
  return { assigned: agentIds.length > 0, loading };
}

/** Loads the four shipped default scenarios from the server (GET
 * /ai-config/defaults), so the "Reset to defaults" link never drifts from
 * what the backend actually ships. */
export async function fetchDefaultFlows(): Promise<AgentFlow[]> {
  const defaults = await appointmentCrmAPI.fetchAiConfigDefaults();
  return defaults.scenarios.map((s) => ({
    id: s.key,
    name: s.label,
    trigger: s.description ?? "",
    enabled: s.enabled,
    fields: s.fields.map((f) => ({ key: f.key, label: f.label, required: f.required })),
  }));
}

export async function deleteAgentCrmConfig(agentId: string, appId: string): Promise<void> {
  if (appId !== APPOINTMENT_CRM_APP_ID) return;
  await appointmentCrmAPI.deleteAiConfig(agentId);
  memoryConfigs.delete(agentId);
  knownFieldKeysByAgent.delete(agentId);
  notify(agentId);
}

export interface UseAgentCrmConfig {
  config: AgentCrmConfig;
  loading: boolean;
  error: string | null;
  save: (next: AgentCrmConfig) => Promise<void>;
  reload: () => void;
}

export function useAgentCrmConfig(agentId: string | null | undefined, appId: string): UseAgentCrmConfig {
  const [config, setConfig] = useState<AgentCrmConfig>(() =>
    agentId ? readAgentCrmConfig(agentId, appId) : DEFAULT_AGENT_CRM_CONFIG,
  );
  const [loading, setLoading] = useState(Boolean(agentId));
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!agentId) {
      setConfig(DEFAULT_AGENT_CRM_CONFIG);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAgentCrmConfig(agentId, appId)
      .then((loaded) => {
        if (!cancelled) setConfig(loaded);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof AppointmentCrmApiError ? err.message : "Couldn't load the AI configuration.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId, appId, reloadToken]);

  useEffect(() => {
    if (!agentId) return;
    const sync = (e: Event) => {
      const detail = (e as CustomEvent<{ agentId?: string; appId?: string }>).detail;
      if (detail && detail.agentId === agentId && detail.appId === appId) {
        setConfig(readAgentCrmConfig(agentId, appId));
      }
    };
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [agentId, appId]);

  const save = useCallback(
    async (next: AgentCrmConfig) => {
      if (!agentId) return;
      const saved = await saveAgentCrmConfig(agentId, appId, next);
      setConfig(saved);
    },
    [agentId, appId],
  );

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  return { config, loading, error, save, reload };
}
