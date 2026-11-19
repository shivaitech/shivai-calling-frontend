import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../contexts/AuthContext";
import CookieConsent from "../../components/CookieConsent";
import { ShivaiSubsPlanV2 } from "./ShivaiSubsPlanV2";
import { FAQ } from "./FAQ";
import { GlobalPresence } from "./GlobalPresence";
import Footer from "./Footer";
import styles from "../../index.css?inline";

// Keep the main site's Tailwind styles inside the reused sections so they do
// not change the standalone preview's existing design.
function mount(id: string, render: (root: ShadowRoot) => React.ReactNode) {
  const host = document.getElementById(id);
  if (!host) throw new Error(`Missing landing preview section: ${id}`);
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  // react-ai-orb injects its stylesheet into document.head at import time;
  // copy it into the shadow root as well so its shapes stay inside the orb.
  const orbStyles = Array.from(document.head.querySelectorAll("style"))
    .map((element) => element.textContent || "")
    .filter((text) => text.includes(".orb-main{"))
    .join("\n");
  style.textContent = `${styles}\n${orbStyles}`;
  const container = document.createElement("div");
  shadow.append(style, container);

  // React Router's links should navigate the full page rather than changing
  // the MemoryRouter used only to render the shared footer.
  shadow.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a");
    const href = link?.getAttribute("href");
    if (href?.startsWith("/") && !href.startsWith("//")) event.stopPropagation();
  }, true);

  createRoot(container).render(render(shadow));
}

mount("preview-pricing", () => <ShivaiSubsPlanV2 />);
mount("preview-faq", () => (
  <FAQ
    setAuthMode={() => {}}
    setShowAuthModal={(open) => {
      if (open) window.location.assign("/landing?auth=signup");
    }}
  />
));
mount("preview-presence", () => (
  <MemoryRouter>
    <GlobalPresence />
  </MemoryRouter>
));
mount("preview-footer", (shadow) => (
  <AuthProvider>
    <MemoryRouter>
      <Footer />
      <CookieConsent portalContainer={shadow} />
    </MemoryRouter>
  </AuthProvider>
));
