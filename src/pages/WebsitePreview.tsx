import React, { useEffect, useState } from "react";
import { WebsiteRenderer } from "../ClientDashboard/WebsiteBuilder/WebsiteBuilder";
import { WebsiteContent, TemplateId } from "../services/websiteBuilderAPI";

interface PreviewData {
  templateId: TemplateId;
  content: WebsiteContent;
  primaryColor: string;
  secondaryColor: string;
  name: string;
}

const WebsitePreview: React.FC = () => {
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("website_preview");
      if (!raw) { setError(true); return; }
      setData(JSON.parse(raw));
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

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <WebsiteRenderer
      templateId={data.templateId}
      content={data.content}
      primaryColor={data.primaryColor}
      secondaryColor={data.secondaryColor}
      agentName={data.name}
    />
  );
};

export default WebsitePreview;
