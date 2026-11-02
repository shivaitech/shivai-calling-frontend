/**
 * Visitor events from a public card, for the owner's Monitoring (views, taps, where visitors
 * came from). Anonymous and fire-and-forget: a failed event never affects the visitor.
 *
 *   POST /business-cards/public/:slug/events   { type, source? }
 */
const API = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export type CardEventType = "view" | "qr_scan" | "call" | "whatsapp" | "email" | "ask_ai" | "linkedin" | "save_contact" | "link" | "share" | "pay";
export type CardEventSource = "qr" | "direct" | "whatsapp" | "social" | "other";

/** Where this visit came from: ?src=qr (or utm_source=qr) on the link, else the referrer. */
export function visitSource(): CardEventSource {
  try {
    const q = new URLSearchParams(window.location.search);
    const tag = (q.get("src") || q.get("utm_source") || "").toLowerCase();
    if (tag === "qr") return "qr";
    if (tag === "whatsapp") return "whatsapp";
    const ref = document.referrer.toLowerCase();
    if (!ref) return "direct";
    if (ref.includes("whatsapp") || ref.includes("wa.me")) return "whatsapp";
    if (/(facebook|instagram|linkedin|t\.co|twitter|x\.com|youtube|tiktok)/.test(ref)) return "social";
    return "other";
  } catch {
    return "other";
  }
}

export function trackCardEvent(slug: string | undefined, type: CardEventType): void {
  if (!slug || !API) return;
  try {
    // keepalive lets a tap that navigates away (call, WhatsApp, a link) still send its event.
    void fetch(`${API}/business-cards/public/${encodeURIComponent(slug)}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, source: visitSource() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never block the visitor */
  }
}

/** One "view" per card per browser tab session, so reloads don't inflate the count. */
export function trackCardView(slug: string | undefined): void {
  if (!slug) return;
  try {
    const k = `shivai_card_viewed_${slug}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch {
    /* storage blocked: still count it */
  }
  trackCardEvent(slug, "view");
  if (visitSource() === "qr") trackCardEvent(slug, "qr_scan");
}
