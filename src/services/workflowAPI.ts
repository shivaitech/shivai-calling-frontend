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

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
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

async function apiFetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((json as any)?.message || `Request failed (${response.status})`);
  }
  return json as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type DocType = "pdf" | "image" | "docx" | "txt" | "website" | "social" | "custom-link";

// ── Model 1: Document Library document ───────────────────────────────────────
export interface LibraryDocument {
  id: string;
  tenant_id: string;
  document_name: string;
  document_type: string;
  source_type: "file" | "link";
  name: string | null;        // original file name on S3
  s3_url: string | null;
  mime_type: string | null;
  website_url: string | null;
  keywords: string[];
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Alias so existing `WorkflowDocument` imports continue to work
export type WorkflowDocument = LibraryDocument;

// ── Model 2: Agent document attachment file entry ─────────────────────────────
export interface AgentDocumentFile {
  id: string;
  document_id: string;        // reference to LibraryDocument.id
  name: string | null;
  s3_url: string | null;
  mime_type: string | null;
  document_name: string;
  document_type: string;
  website_url: string | null;
  keywords: string[];
  description: string | null;
}

// ── Agents list ───────────────────────────────────────────────────────────────

export interface ListAgentsResponse {
  success: boolean;
  data: {
    agents: Array<{ id: string; name: string; is_active?: boolean; status?: string; [key: string]: any }>;
    total?: number;
  };
}

// ── POST /documents — create one document (file upload or link) ───────────────

export interface CreateDocumentPayload {
  file?: File;                // for file uploads
  documentName: string;
  documentType: string;
  websiteUrl?: string;        // for link creation
  keywords?: string[];
  description?: string;
}

export interface CreateDocumentResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: { document: LibraryDocument };
}

// ── GET /documents — list all library documents ───────────────────────────────

export interface ListDocumentsFilters {
  search?: string;
  sourceType?: "file" | "link";
  documentType?: string;
}

export interface ListDocumentsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: { documents: LibraryDocument[]; total: number };
}

// ── GET /documents/:id ────────────────────────────────────────────────────────

export interface GetDocumentResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: { document: LibraryDocument };
}

// ── PATCH /documents/:id ──────────────────────────────────────────────────────

export interface UpdateDocumentPayload {
  documentName?: string;
  documentType?: string;
  websiteUrl?: string;
  keywords?: string[];
  description?: string;
}

export interface UpdateDocumentResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: { document: LibraryDocument };
}

// ── DELETE /documents/:id ─────────────────────────────────────────────────────

export interface DeleteDocumentResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: { deleted: boolean; documentId: string };
}

// ── POST /agent-documents/:agentId/assign ─────────────────────────────────────

export interface AssignDocumentsPayload {
  documentIds: string[];
}

export interface AssignDocumentsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    document: {
      id: string;
      agent_id: string;
      tenant_id: string;
      files: AgentDocumentFile[];
      created_at: string;
      updated_at: string;
    };
  };
}

// ── GET /agent-documents/:agentId ─────────────────────────────────────────────

export interface GetAgentDocumentsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    document: {
      id: string;
      agent_id: string;
      tenant_id: string;
      files: AgentDocumentFile[];
      created_at: string;
      updated_at: string;
    } | null;
  };
}

// ── DELETE /agent-documents/:agentId/files/:documentId ───────────────────────

export interface RemoveAgentDocumentResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    document: {
      id: string;
      agent_id: string;
      tenant_id: string;
      files: AgentDocumentFile[];
    };
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

class WorkflowAPI {
  // Get agents list (used by workflow builder)
  async getAgents(): Promise<ListAgentsResponse> {
    return apiFetchJson<ListAgentsResponse>("/agents");
  }

  // API 1 — Create one document (file upload OR link) — one at a time
  async createDocument(payload: CreateDocumentPayload): Promise<CreateDocumentResponse> {
    const formData = new FormData();
    if (payload.file) formData.append("file", payload.file);
    formData.append("documentName", payload.documentName);
    formData.append("documentType", payload.documentType);
    if (payload.websiteUrl) formData.append("websiteUrl", payload.websiteUrl);
    if (payload.keywords && payload.keywords.length > 0) {
      formData.append("keywords", JSON.stringify(payload.keywords));
    }
    if (payload.description) formData.append("description", payload.description);
    // Do NOT set Content-Type — browser sets it with the correct multipart boundary
    return apiFetchJson<CreateDocumentResponse>("/documents", {
      method: "POST",
      body: formData,
    });
  }

  // API 2 — List all documents in library
  async listDocuments(filters?: ListDocumentsFilters): Promise<ListDocumentsResponse> {
    const params = new URLSearchParams();
    if (filters?.search)       params.set("search", filters.search);
    if (filters?.sourceType)   params.set("sourceType", filters.sourceType);
    if (filters?.documentType) params.set("documentType", filters.documentType);
    const qs = params.toString();
    return apiFetchJson<ListDocumentsResponse>(`/documents${qs ? `?${qs}` : ""}`);
  }

  // API 3 — Get single document
  async getDocument(documentId: string): Promise<GetDocumentResponse> {
    return apiFetchJson<GetDocumentResponse>(`/documents/${documentId}`);
  }

  // API 4 — Update document metadata
  async updateDocument(documentId: string, payload: UpdateDocumentPayload): Promise<UpdateDocumentResponse> {
    return apiFetchJson<UpdateDocumentResponse>(`/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  // API 5 — Delete document from library (also removes from all agents)
  async deleteDocument(documentId: string): Promise<DeleteDocumentResponse> {
    return apiFetchJson<DeleteDocumentResponse>(`/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  // API 6 — Assign multiple documents to one agent
  async assignDocumentsToAgent(agentId: string, payload: AssignDocumentsPayload): Promise<AssignDocumentsResponse> {
    return apiFetchJson<AssignDocumentsResponse>(`/agent-documents/${agentId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  // API 7 — Get all documents assigned to an agent
  async getAgentDocuments(agentId: string): Promise<GetAgentDocumentsResponse> {
    return apiFetchJson<GetAgentDocumentsResponse>(`/agent-documents/${agentId}`);
  }

  // API 8 — Remove one document from agent (does NOT delete from library)
  async removeDocumentFromAgent(agentId: string, documentId: string): Promise<RemoveAgentDocumentResponse> {
    return apiFetchJson<RemoveAgentDocumentResponse>(`/agent-documents/${agentId}/files/${documentId}`, {
      method: "DELETE",
    });
  }
}

export const workflowAPI = new WorkflowAPI();
