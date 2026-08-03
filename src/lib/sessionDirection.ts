/** Normalize call direction from agent-session payloads (inbound / outbound). */
export function resolveSessionCallType(session: any): string {
  const raw = String(
    session?.direction?.type ||
      session?.call_type ||
      session?.direction_type ||
      session?.type ||
      ""
  )
    .toLowerCase()
    .trim();

  if (raw === "inbound" || raw === "in" || raw.includes("inbound")) return "inbound";
  if (raw === "outbound" || raw === "out" || raw.includes("outbound")) return "outbound";

  const sid = String(
    session?.session_id || session?.id || session?.call_id || session?.room_name || ""
  ).toLowerCase();
  if (sid.includes("inbound")) return "inbound";
  if (sid.includes("outbound")) return "outbound";

  return raw;
}

export function resolveSessionLeadNumber(session: any): string {
  return String(
    session?.direction?.number ||
      session?.phone_number ||
      session?.to_number ||
      session?.from_number ||
      session?.caller_number ||
      session?.user_phone ||
      session?.lead_number ||
      session?.customer_number ||
      ""
  ).trim();
}

export function formatCallTypeLabel(type: string): string {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

export function callTypeBadgeClass(type: string): string {
  const t = type.toLowerCase();
  if (t === "outbound") {
    return "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300";
  }
  if (t === "inbound") {
    return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
  }
  return "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
}
