import React, { useEffect, useState } from "react";

const AI_STUDIO_KEY = "ai_studio_websites";

interface SavedSite {
  id: string;
  businessName: string;
  html: string;
}

const WebsitePreview: React.FC = () => {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      // Support legacy ?id= param to load a specific saved site
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const sites: SavedSite[] = JSON.parse(localStorage.getItem(AI_STUDIO_KEY) ?? "[]");
      const site = id ? sites.find((s) => s.id === id) : sites[0];
      if (!site?.html) { setError(true); return; }
      setHtml(site.html);
    } catch {
      setError(true);
    }
  }, []);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌐</div>
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>No preview available</h2>
          <p style={{ fontSize: 14 }}>Open this page from the Website Builder to preview your site.</p>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      title="Website Preview"
      style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
    />
  );
};

export default WebsitePreview;
