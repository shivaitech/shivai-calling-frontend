/** Open a same-origin path in a normal browser tab (not an installed PWA window). */
export function openInNewBrowserTab(path: string): void {
  const url = new URL(path, window.location.origin).href;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
