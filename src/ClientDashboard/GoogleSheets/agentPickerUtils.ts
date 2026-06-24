/** Agent IDs already linked to a Google Sheets integration (optionally skip one sheet when editing). */
export function getLinkedGoogleSheetsAgentIds(
  integrations: unknown[],
  options?: { excludeSheetId?: string },
): Set<string> {
  const blocked = new Set<string>();
  for (const raw of integrations) {
    const i = raw as Record<string, unknown>;
    const config = i.config as Record<string, unknown> | undefined;
    const gs = config?.google_sheets as Record<string, unknown> | undefined;
    const sheetId = String(gs?.sheet_id ?? i.sheet_id ?? "");
    if (options?.excludeSheetId && sheetId === options.excludeSheetId) continue;
    const agentId = String(i.agent_id ?? i.agentId ?? "");
    if (agentId) blocked.add(agentId);
  }
  return blocked;
}

export function mergeAgentsById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const a of existing) map.set(a.id, a);
  for (const a of incoming) map.set(a.id, a);
  return Array.from(map.values());
}
