/** Public embed script served from callshivai.com (deployments use widget5.js). */
export const WIDGET_SCRIPT_FILE = "widget5.js";
export const WIDGET_SCRIPT_BASE_URL = "https://www.callshivai.com";
export const WIDGET_SCRIPT_URL = `${WIDGET_SCRIPT_BASE_URL}/${WIDGET_SCRIPT_FILE}`;

export function buildWidgetScriptUrl(
  params: Record<string, string | undefined | null>
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") search.set(key, value);
  });
  const query = search.toString();
  return query ? `${WIDGET_SCRIPT_URL}?${query}` : WIDGET_SCRIPT_URL;
}

export function buildWidgetEmbedScript(
  params: Record<string, string | undefined | null>,
  extraAttrs = ""
): string {
  const attrs = extraAttrs ? ` ${extraAttrs.trim()}` : "";
  return `<script src="${buildWidgetScriptUrl(params)}"${attrs}></script>`;
}
