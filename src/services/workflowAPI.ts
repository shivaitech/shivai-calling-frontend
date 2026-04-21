const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAccessToken(): string | null {
  try {
    const tokens = localStorage.getItem("auth_tokens");
    if (tokens) {
      const { accessToken } = JSON.parse(tokens);
      return accessToken ?? null;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

async function apiFetch(path: string, init: RequestInit): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401) {
    localStorage.removeItem("auth_tokens");
    window.location.href = "/landing";
  }

  return response;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type DocType = "pdf" | "image" | "docx" | "txt" | "website" | "social";

export interface CreateDocumentPayload {
  agentId: string;           // primary agent (used as :id in URL path)
  agentIds: string[];        // all selected agents (for multi-agent linking)
  documentName: string;
  documentType: string;      // API value: 'pdf' | 'image' | 'docx' | 'text' | 'website' | 'social'
  description?: string;
  keywords?: string[];
  // Exactly one of the following must be provided:
  file?: File;
  websiteUrl?: string;
  socialUrl?: string;
  rawText?: string;
}

export interface CreateDocumentResponse {
  documents: any[];
  linked_agents_count: number;
  linked_agent_ids: string[];
}

// ── Service ───────────────────────────────────────────────────────────────────

class WorkflowAPI {
  async createDocument(payload: CreateDocumentPayload): Promise<CreateDocumentResponse> {
    const formData = new FormData();

    formData.append("documentName", payload.documentName);
    formData.append("documentType", payload.documentType);
    formData.append("assignToAgent", payload.agentId);

    if (payload.agentIds.length > 1) {
      payload.agentIds.forEach((id) => formData.append("assignToAgents[]", id));
    }

    if (payload.description) formData.append("description", payload.description);
    if (payload.keywords && payload.keywords.length > 0) {
      formData.append("keywords", payload.keywords.join(","));
    }

    if (payload.websiteUrl) {
      formData.append("websiteUrl", payload.websiteUrl);
    } else if (payload.socialUrl) {
      formData.append("socialUrl", payload.socialUrl);
    } else if (payload.rawText) {
      formData.append("rawText", payload.rawText);
    } else if (payload.file) {
      formData.append("file", payload.file);
    }

    const response = await apiFetch(
      `/agents/${payload.agentId}/documents`,
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error((errData as any)?.message || `Request failed (${response.status})`);
    }

    return response.json();
  }
}

export const workflowAPI = new WorkflowAPI();
