// Translation layer between the Schedule-adjacent /ai-config API (backend
// contract: dataAccess as 6 fixed booleans, responseBehavior, escalation,
// scenarios[].fields[]) and the existing local AgentCrmConfig shape the
// AgentCrmConfigPanel UI already renders (dataAccess as a string[] of
// workspace-section keys, behavior, escalation, flows[].fields[]).
//
// The six dataAccess keys the backend defines (calendar, bookings, branches,
// staff, customers, reminders) are exactly the Appointment CRM app's
// non-overview/agents/settings workspace-section keys — see marketplace/apps.ts.
import type {
  AgentCrmConfig,
  AgentFlow,
  AgentTone,
  FlowField,
  UnknownQuestionAction,
} from "../../../../marketplace/useAgentCrmConfig";
import type {
  AiTone,
  AiWhenUnknown,
  ApiAiConfig,
  ApiAiConfigDataAccess,
  ApiAiConfigField,
  ApiAiConfigScenario,
} from "./types";

const DATA_ACCESS_KEYS: (keyof ApiAiConfigDataAccess)[] = [
  "calendar",
  "bookings",
  "branches",
  "staff",
  "customers",
  "reminders",
];

export function mapDataAccessFromApi(dataAccess: ApiAiConfigDataAccess): string[] {
  return DATA_ACCESS_KEYS.filter((k) => dataAccess[k]);
}

export function mapDataAccessToApi(keys: string[]): ApiAiConfigDataAccess {
  const set = new Set(keys);
  return {
    calendar: set.has("calendar"),
    bookings: set.has("bookings"),
    branches: set.has("branches"),
    staff: set.has("staff"),
    customers: set.has("customers"),
    reminders: set.has("reminders"),
  };
}

export function mapFieldFromApi(field: ApiAiConfigField): FlowField {
  return { key: field.key, label: field.label, required: field.required };
}

/** New rows (no key yet) are sent with only label/required per the API's
 * "omit key only for brand-new rows" rule; existing rows send key back
 * unchanged so the server doesn't orphan already-collected answers. */
export function fieldToApiBody(field: FlowField, isNew: boolean): Record<string, unknown> {
  if (isNew) return { label: field.label, required: field.required };
  return { key: field.key, label: field.label, required: field.required };
}

export function mapScenarioFromApi(scenario: ApiAiConfigScenario): AgentFlow {
  return {
    id: scenario.key,
    name: scenario.label,
    trigger: scenario.description ?? "",
    enabled: scenario.enabled,
    fields: scenario.fields.map(mapFieldFromApi),
  };
}

/** `knownKeys` are the field keys that existed in the config as loaded from
 * the server — any field key NOT in this set is treated as new (so its key
 * is omitted rather than sent back, per the API's new-row convention). */
export function scenarioToApiBody(flow: AgentFlow, knownFieldKeys: Set<string>): Record<string, unknown> {
  return {
    key: flow.id,
    label: flow.name,
    description: flow.trigger || undefined,
    enabled: flow.enabled,
    fields: flow.fields.map((f) => fieldToApiBody(f, !knownFieldKeys.has(f.key))),
  };
}

const WHEN_UNKNOWN_FROM_API: Record<AiWhenUnknown, UnknownQuestionAction> = {
  escalate: "escalate",
  apologize: "apologize",
};
const WHEN_UNKNOWN_TO_API: Record<UnknownQuestionAction, AiWhenUnknown> = {
  escalate: "escalate",
  apologize: "apologize",
};
const TONE_FROM_API: Record<AiTone, AgentTone> = {
  friendly: "friendly",
  formal: "formal",
  concise: "concise",
};
const TONE_TO_API: Record<AgentTone, AiTone> = {
  friendly: "friendly",
  formal: "formal",
  concise: "concise",
};

export function mapAiConfigFromApi(config: ApiAiConfig): AgentCrmConfig {
  return {
    dataAccess: mapDataAccessFromApi(config.dataAccess),
    behavior: {
      canModifyRecords: config.responseBehavior.canTakeAction,
      unknownQuestionAction: WHEN_UNKNOWN_FROM_API[config.responseBehavior.whenUnknown],
      tone: TONE_FROM_API[config.responseBehavior.tone],
    },
    escalation: {
      enabled: config.escalation.enabled,
      maxFailedAttempts: config.escalation.afterUnclearReplies,
      escalateOnKeywords: config.escalation.keywords,
      notifyEmail: config.escalation.notifyEmail,
    },
    flows: config.scenarios.map(mapScenarioFromApi),
  };
}

/** `knownFieldKeysByFlowId` — per flow, which field keys were already known
 * (loaded from the server) so new rows can correctly omit `key`. */
export function aiConfigToApiBody(
  draft: AgentCrmConfig,
  opts: { assigned: boolean; status: "active" | "paused"; knownFieldKeysByFlowId: Map<string, Set<string>> },
): Record<string, unknown> {
  return {
    assigned: opts.assigned,
    status: opts.status,
    dataAccess: mapDataAccessToApi(draft.dataAccess),
    responseBehavior: {
      canTakeAction: draft.behavior.canModifyRecords,
      whenUnknown: WHEN_UNKNOWN_TO_API[draft.behavior.unknownQuestionAction],
      tone: TONE_TO_API[draft.behavior.tone],
    },
    escalation: {
      enabled: draft.escalation.enabled,
      afterUnclearReplies: draft.escalation.maxFailedAttempts,
      notifyEmail: draft.escalation.notifyEmail,
      keywords: draft.escalation.escalateOnKeywords,
    },
    scenarios: (draft.flows ?? []).map((flow) =>
      scenarioToApiBody(flow, opts.knownFieldKeysByFlowId.get(flow.id) ?? new Set()),
    ),
  };
}
