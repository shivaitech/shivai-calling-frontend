// Public HTML is served without Vite's normal HTML transform, so install the
// React refresh preamble before loading the local source entry. Production
// replaces this file with a loader for the bundled entry.
import RefreshRuntime from "/@react-refresh";

RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
await import("/src/pages/Website/LandingPreviewSections.tsx");
