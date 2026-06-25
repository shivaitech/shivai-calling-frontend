import type { AgentWorkflowChip } from "./AgentCardWorkflows";
import type { AgentDocumentFile } from "../../../services/workflowAPI";

type IntegrationRecord = Record<string, unknown>;

function integrationAgentId(integration: IntegrationRecord): string {
  return String(integration.agent_id ?? integration.agentId ?? "");
}

function sheetIdFromIntegration(integration: IntegrationRecord): string | undefined {
  const gs = integration.config as { google_sheets?: { sheet_id?: string; sheet_name?: string } } | undefined;
  const googleSheets = gs?.google_sheets ?? (integration as { google_sheets?: { sheet_id?: string } }).google_sheets;
  return googleSheets?.sheet_id ?? (integration.sheet_id as string | undefined);
}

function sheetLabelFromIntegration(integration: IntegrationRecord): string {
  const gs = integration.config as { google_sheets?: { sheet_name?: string } } | undefined;
  return (
    integration.label as string | undefined ??
    gs?.google_sheets?.sheet_name ??
    "Google Sheet"
  );
}

function hasRosterLink(integration: IntegrationRecord): boolean {
  const gs = integration.config as {
    google_sheets?: { assignment?: { directory_sheet_id?: string } };
  } | undefined;
  const assignment = gs?.google_sheets?.assignment;
  return Boolean(assignment?.directory_sheet_id);
}

function rosterName(integration: IntegrationRecord): string {
  const gs = integration.config as {
    google_sheets?: { assignment?: { directory_sheet_name?: string } };
  } | undefined;
  return gs?.google_sheets?.assignment?.directory_sheet_name ?? "Staff roster";
}

export function buildAgentWorkflowChips(
  agentId: string,
  integrations: IntegrationRecord[],
  documentFiles: AgentDocumentFile[] = [],
): AgentWorkflowChip[] {
  const chips: AgentWorkflowChip[] = [];
  const seen = new Set<string>();

  const agentIntegrations = integrations.filter((i) => integrationAgentId(i) === agentId);

  for (const integration of agentIntegrations) {
    const sheetId = sheetIdFromIntegration(integration);
    if (!sheetId) continue;

    const sheetKey = `sheet-${sheetId}`;
    if (!seen.has(sheetKey)) {
      seen.add(sheetKey);
      const name = sheetLabelFromIntegration(integration);
      chips.push({
        id: sheetKey,
        label: name,
        kind: "google_sheets",
        href: `/google-sheets/${sheetId}/view?name=${encodeURIComponent(name)}`,
      });
    }

    if (hasRosterLink(integration)) {
      const gs = integration.config as {
        google_sheets?: { assignment?: { directory_sheet_id?: string; directory_sheet_name?: string } };
      } | undefined;
      const rosterId = gs?.google_sheets?.assignment?.directory_sheet_id;
      const rosterKey = `roster-${rosterId ?? integrationAgentId(integration)}`;
      if (!seen.has(rosterKey)) {
        seen.add(rosterKey);
        const rosterLabel = rosterName(integration);
        chips.push({
          id: rosterKey,
          label: rosterLabel,
          kind: "roster",
          href: rosterId
            ? `/google-sheets/${rosterId}/view?name=${encodeURIComponent(rosterLabel)}&role=directory`
            : undefined,
        });
      }
    }
  }

  const docNames = new Map<string, string>();
  for (const file of documentFiles) {
    const name = file.document_name || file.name || "Document";
    if (!docNames.has(file.document_id)) docNames.set(file.document_id, name);
  }

  for (const [docId, name] of docNames) {
    const docKey = `doc-${docId}`;
    if (seen.has(docKey)) continue;
    seen.add(docKey);
    chips.push({
      id: docKey,
      label: name,
      kind: "ai_document",
      href: `/agents/${agentId}`,
    });
  }

  return chips;
}

export async function loadWorkflowChipsForAgents(
  agentIds: string[],
  fetchIntegrations: () => Promise<IntegrationRecord[]>,
  fetchAgentDocuments: (agentId: string) => Promise<AgentDocumentFile[]>,
): Promise<Record<string, AgentWorkflowChip[]>> {
  if (!agentIds.length) return {};

  const integrations = await fetchIntegrations().catch(() => [] as IntegrationRecord[]);
  const docEntries = await Promise.all(
    agentIds.map(async (id) => {
      const files = await fetchAgentDocuments(id).catch(() => [] as AgentDocumentFile[]);
      return [id, files] as const;
    }),
  );

  const result: Record<string, AgentWorkflowChip[]> = {};
  for (const [agentId, files] of docEntries) {
    result[agentId] = buildAgentWorkflowChips(agentId, integrations, files);
  }
  return result;
}
