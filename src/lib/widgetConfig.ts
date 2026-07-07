/** Public embed script served from callshivai.com (deployments use widget5.js). */
export const WIDGET_SCRIPT_FILE = "widget5.js";
export const PRODUCTION_APP_BASE_URL = "https://www.callshivai.com";

export function isStagingEnv(): boolean {
  return import.meta.env.VITE_API_BASE_URL?.includes("staging") ?? false;
}

/** App origin for share links / embed scripts — staging uses current deployment host. */
export function getAppBaseUrl(): string {
  if (isStagingEnv() && typeof window !== "undefined") {
    return window.location.origin;
  }
  return PRODUCTION_APP_BASE_URL;
}

export function getWidgetScriptBaseUrl(): string {
  return getAppBaseUrl();
}

export function buildWidgetScriptUrl(
  params: Record<string, string | undefined | null>
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") search.set(key, value);
  });
  const query = search.toString();
  const scriptUrl = `${getWidgetScriptBaseUrl()}/${WIDGET_SCRIPT_FILE}`;
  return query ? `${scriptUrl}?${query}` : scriptUrl;
}

export function buildAgentPageUrl(
  agentId: string,
  params?: { userId?: string | undefined | null }
): string {
  const search = new URLSearchParams();
  search.set("agentId", agentId);
  if (params?.userId) search.set("userId", params.userId);
  return `${getAppBaseUrl()}/MyAIEmployee/${agentId}/?${search.toString()}`;
}

export function buildWidgetEmbedScript(
  params: Record<string, string | undefined | null>,
  extraAttrs = ""
): string {
  const attrs = extraAttrs ? ` ${extraAttrs.trim()}` : "";
  return `<script src="${buildWidgetScriptUrl(params)}"${attrs}></script>`;
}
