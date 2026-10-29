import { isStagingEnv } from "../../../lib/widgetConfig";

/**
 * "Ask My AI" on a public card: load the ShivAI chat widget (widget5.js, the client
 * embed) for the card's own agent and open it right on the card — instead of sending
 * the visitor to the /MyAIEmployee page.
 *
 * bypass=true lets widget5 run on card pages (same as QR/agent test pages). The widget is
 * ready once it has rendered its launcher (.shivai-trigger); openWidget() needs that.
 * Resolves false if it doesn't come up (agent inactive/blocked, network) so the caller
 * can fall back to the agent page.
 */

type Widget = { open?: () => void };
const widget = () => (window as unknown as { ShivAIWidget?: Widget }).ShivAIWidget;
const ready = () => !!document.querySelector(".shivai-trigger") && typeof widget()?.open === "function";

let loading: Promise<boolean> | null = null;
let loadedAgent: string | null = null;

function load(agentId: string, userId?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const params = new URLSearchParams({ agentId, bypass: "true" });
    if (userId) params.set("userId", userId);
    if (isStagingEnv()) params.set("env", "staging");
    const script = document.createElement("script");
    script.id = `shivai-card-agent-${agentId}`;
    script.src = `/widget5.js?${params.toString()}`;
    script.async = true;
    script.onerror = () => resolve(false);
    script.onload = () => {
      const started = Date.now();
      const tick = () => {
        if (ready()) return resolve(true);
        if (Date.now() - started > 12000) return resolve(false);
        setTimeout(tick, 150);
      };
      tick();
    };
    document.body.appendChild(script);
  });
}

export async function openCardAgent(agentId: string, userId?: string): Promise<boolean> {
  if (loadedAgent !== agentId || !loading) {
    loadedAgent = agentId;
    loading = load(agentId, userId);
  }
  const ok = await loading;
  if (!ok) {
    loading = null; // allow a retry on the next tap
    return false;
  }
  widget()?.open?.();
  return true;
}
