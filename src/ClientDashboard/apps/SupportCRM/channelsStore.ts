import { useCallback, useEffect, useState } from "react";
import { buildWidgetEmbedScript } from "../../../lib/widgetConfig";

/**
 * ── Agent channels store ─────────────────────────────────────────────────────
 *
 * Each AI agent can operate over two channels and can do BOTH at once:
 *   • inbound  — answers inbound phone calls (a provisioned number)
 *   • web      — handles chats/calls from a website widget (embed snippet)
 *
 * Enable/disable persists in localStorage. Phone number + embed are realistic
 * mock values for now; when the backend lands this becomes an API read/write.
 */

export interface AgentChannels {
  inbound: boolean;
  web: boolean;
}

const STORAGE_KEY = "shivai_supportcrm_agent_channels";
const CHANNELS_EVENT = "shivai:agent-channels-changed";

// Default: every agent starts web-enabled (most common), inbound off.
const DEFAULT_CHANNELS: AgentChannels = { inbound: false, web: true };

function readAll(): Record<string, AgentChannels> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function writeAll(map: Record<string, AgentChannels>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(CHANNELS_EVENT));
}

/** A stable, realistic-looking mock inbound number derived from the agent id. */
export function mockNumberFor(agentId: string): string {
  let h = 0;
  for (let i = 0; i < agentId.length; i++) h = (h * 31 + agentId.charCodeAt(i)) >>> 0;
  const last4 = (h % 9000) + 1000;
  return `+91 80 4000 ${last4}`;
}

/** A copyable web embed snippet for the agent's website widget. */
export function webEmbedFor(agentId: string): string {
  return buildWidgetEmbedScript({ agentId }, "async");
}

export function useAgentChannels() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(CHANNELS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANNELS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const getChannels = useCallback((agentId: string): AgentChannels => {
    const all = readAll();
    return all[agentId] ? { ...DEFAULT_CHANNELS, ...all[agentId] } : { ...DEFAULT_CHANNELS };
  }, []);

  const setChannel = useCallback((agentId: string, key: keyof AgentChannels, value: boolean) => {
    const all = readAll();
    const current = all[agentId] ? { ...DEFAULT_CHANNELS, ...all[agentId] } : { ...DEFAULT_CHANNELS };
    all[agentId] = { ...current, [key]: value };
    writeAll(all);
  }, []);

  return { getChannels, setChannel };
}
