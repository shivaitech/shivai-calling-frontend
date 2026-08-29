import type { ApiAgent, PublicationResponse } from './agentAPI';

/** Loosely-typed create/update payloads — mirrors the shape of the real
 * (module-private) CreateAgentRequest/UpdateAgentRequest closely enough for
 * this mock store's purposes without depending on agentAPI's internals. */
type MockAgentCreateInput = Partial<ApiAgent> & Record<string, any>;
type MockAgentUpdateInput = Partial<ApiAgent> & Record<string, any>;

/**
 * In-memory mock agent store, keyed by tenantId — backs the Sub Tenants
 * module's "AI Employees" tab (SubTenantAgents.tsx), which mirrors
 * AgentManagement.tsx's card/grid UI and CRUD actions but is a fully
 * self-contained view (no shared routing/context with the real agents
 * feature) since there's no backend tenant-scoping yet
 * (see SUB_TENANTS_MODULE_SPEC.md §9).
 */
export interface MockAgentRecord extends ApiAgent {
  is_active?: boolean;
  knowledge_base_status?: 'idle' | 'processing' | 'completed' | 'failed';
  knowledge_base_file_urls?: string[];
  knowledge_base_error?: string;
  website_urls?: string[];
  social_media_urls?: string[];
}

const DEFAULT_STATS = { conversations: 0, successRate: 0, avgResponseTime: 0, activeUsers: 0 };

function seedAgentsFor(tenantId: string): MockAgentRecord[] {
  const seeds: Record<string, MockAgentRecord[]> = {
    'tenant-sub-1': [
      {
        id: 'magent-1a', name: 'Nora — Appointment Concierge', status: 'Published', is_active: true,
        personality: 'friendly', voice: 'Aria', agent_type: 'inbound', gender: 'female', language: 'en',
        business_process: 'Appointment Scheduling', industry: 'Healthcare', sub_industry: 'Dental',
        custom_instructions: 'You are Nora, the appointment concierge for Northwind Dental Clinic. Greet callers warmly, confirm their name and reason for calling, and help them book, reschedule, or cancel an appointment.',
        guardrails_level: 'standard', response_style: 'conversational', max_response_length: 'medium',
        context_window: 'standard', temperature: 0.7,
        greeting_message: { en: "Hi, thanks for calling Northwind Dental! This is Nora — how can I help you today?" },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
        knowledge_base_status: 'completed',
        stats: { conversations: 512, successRate: 93, avgResponseTime: 1.8, activeUsers: 120 },
      },
      {
        id: 'magent-1b', name: 'Reminder Caller', status: 'Published', is_active: true,
        personality: 'professional', voice: 'Kore', agent_type: 'outbound', gender: 'male', language: 'en',
        business_process: 'Appointment Reminders', industry: 'Healthcare', sub_industry: 'Dental',
        custom_instructions: 'You place outbound reminder calls for upcoming dental appointments. Confirm the patient can still make it, and offer to reschedule if not.',
        guardrails_level: 'standard', response_style: 'concise', max_response_length: 'short',
        context_window: 'standard', temperature: 0.5,
        greeting_message: { en: "Hello, this is a reminder call from Northwind Dental about your upcoming appointment." },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
        knowledge_base_status: 'completed',
        stats: { conversations: 280, successRate: 89, avgResponseTime: 1.2, activeUsers: 80 },
      },
      {
        id: 'magent-1c', name: 'After-Hours Triage', status: 'Pending', is_active: false,
        personality: 'calm', voice: 'Charon', agent_type: 'inbound', gender: 'male', language: 'en',
        business_process: 'Emergency Triage', industry: 'Healthcare', sub_industry: 'Dental',
        custom_instructions: 'Handle after-hours calls, assess urgency, and direct genuine emergencies to the on-call number.',
        guardrails_level: 'strict', response_style: 'empathetic', max_response_length: 'medium',
        context_window: 'standard', temperature: 0.6,
        greeting_message: { en: "Thanks for calling Northwind Dental after hours — I'm here to help." },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
        knowledge_base_status: 'processing',
        stats: { conversations: 50, successRate: 88, avgResponseTime: 2.1, activeUsers: 20 },
      },
    ],
    'tenant-sub-2': [
      {
        id: 'magent-2a', name: 'Listing Assistant', status: 'Published', is_active: true,
        personality: 'enthusiastic', voice: 'Puck', agent_type: 'inbound', gender: 'male', language: 'en',
        business_process: 'Lead Qualification', industry: 'Real Estate',
        custom_instructions: 'You help callers find listings that match their needs and schedule viewings for Bluewave Realty Group.',
        guardrails_level: 'standard', response_style: 'conversational', max_response_length: 'medium',
        context_window: 'standard', temperature: 0.8,
        greeting_message: { en: "Hi there! Thanks for calling Bluewave Realty — looking for a new place?" },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
        knowledge_base_status: 'completed',
        stats: { conversations: 210, successRate: 85, avgResponseTime: 1.6, activeUsers: 65 },
      },
      {
        id: 'magent-2b', name: 'Lead Follow-up', status: 'Published', is_active: true,
        personality: 'professional', voice: 'Aria', agent_type: 'outbound', gender: 'female', language: 'en',
        business_process: 'Lead Follow-up', industry: 'Real Estate',
        custom_instructions: 'Follow up with leads who inquired about a listing in the last 48 hours.',
        guardrails_level: 'standard', response_style: 'concise', max_response_length: 'short',
        context_window: 'standard', temperature: 0.6,
        greeting_message: { en: "Hi, this is Bluewave Realty following up on your inquiry." },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
        knowledge_base_status: 'completed',
        stats: { conversations: 100, successRate: 90, avgResponseTime: 1.4, activeUsers: 40 },
      },
    ],
    'tenant-sub-3': [
      {
        id: 'magent-3a', name: 'Service Booking Line', status: 'Published', is_active: true,
        personality: 'friendly', voice: 'Fenrir', agent_type: 'inbound', gender: 'male', language: 'en',
        business_process: 'Service Booking', industry: 'Automotive Services',
        custom_instructions: 'Book service appointments for Crestline Auto Service, ask for vehicle make/model and the issue.',
        guardrails_level: 'standard', response_style: 'conversational', max_response_length: 'medium',
        context_window: 'standard', temperature: 0.7,
        greeting_message: { en: "Crestline Auto Service, how can I help with your vehicle today?" },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
        knowledge_base_status: 'completed',
        stats: { conversations: 12, successRate: 76, avgResponseTime: 2.4, activeUsers: 8 },
      },
    ],
    'tenant-sub-4': [],
  };
  return seeds[tenantId] || [];
}

const STORE: Record<string, MockAgentRecord[]> = {};

function getStore(tenantId: string): MockAgentRecord[] {
  if (!STORE[tenantId]) STORE[tenantId] = seedAgentsFor(tenantId);
  return STORE[tenantId];
}

function genId(): string {
  return `magent-${Math.random().toString(36).slice(2, 10)}`;
}

export const mockAgentStore = {
  list(tenantId: string): ApiAgent[] {
    return getStore(tenantId).map((a) => ({ ...a }));
  },

  listFiltered(
    tenantId: string,
    params: { search?: string; page?: number; limit?: number; gender?: string; industry?: string; business_process?: string },
  ): { agents: ApiAgent[]; total: number; page: number; limit: number; totalPages: number } {
    let agents = getStore(tenantId);
    if (params.search) {
      const q = params.search.toLowerCase();
      agents = agents.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (params.industry) agents = agents.filter((a) => a.industry === params.industry);
    if (params.business_process) agents = agents.filter((a) => a.business_process === params.business_process);
    if (params.gender && params.gender !== 'all') agents = agents.filter((a) => a.gender === params.gender);

    const total = agents.length;
    const limit = params.limit || 6;
    const page = params.page || 1;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paged = agents.slice(start, start + limit).map((a) => ({ ...a }));
    return { agents: paged, total, page, limit, totalPages };
  },

  get(tenantId: string, id: string): { agent: MockAgentRecord } {
    const agent = getStore(tenantId).find((a) => a.id === id);
    if (!agent) throw new Error('Agent not found');
    return { agent: { ...agent } };
  },

  create(tenantId: string, data: MockAgentCreateInput): ApiAgent {
    const now = new Date().toISOString();
    const agent: MockAgentRecord = {
      id: genId(),
      name: data.name || 'Untitled Agent',
      status: 'Pending',
      is_active: false,
      personality: data.personality || 'friendly',
      language: data.language || 'en',
      voice: data.voice || 'Aria',
      gender: data.gender,
      business_process: data.business_process,
      industry: data.industry,
      sub_industry: data.sub_industry,
      custom_instructions: data.custom_instructions,
      guardrails_level: data.guardrails_level,
      response_style: data.response_style,
      max_response_length: data.max_response_length,
      context_window: data.context_window,
      temperature: data.temperature,
      agent_type: data.agent_type,
      tts: data.tts,
      greeting_message: data.greeting_message,
      template: data.template,
      createdAt: now,
      updatedAt: now,
      knowledge_base_status: data.knowledge_base_file_urls?.length ? 'completed' : 'idle',
      knowledge_base_file_urls: data.knowledge_base_file_urls || [],
      website_urls: data.website_urls || [],
      social_media_urls: data.social_media_urls || [],
      stats: { ...DEFAULT_STATS },
    };
    getStore(tenantId).push(agent);
    return { ...agent };
  },

  update(tenantId: string, id: string, data: MockAgentUpdateInput): ApiAgent {
    const store = getStore(tenantId);
    const idx = store.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Agent not found');
    const updated: MockAgentRecord = {
      ...store[idx],
      ...data,
      id: store[idx].id,
      updatedAt: new Date().toISOString(),
      stats: store[idx].stats || { ...DEFAULT_STATS },
    };
    store[idx] = updated;
    return { ...updated };
  },

  remove(tenantId: string, id: string): void {
    const store = getStore(tenantId);
    const idx = store.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Agent not found');
    store.splice(idx, 1);
  },

  setPublished(tenantId: string, id: string, published: boolean): PublicationResponse {
    const store = getStore(tenantId);
    const agent = store.find((a) => a.id === id);
    if (!agent) return { success: false, message: 'Agent not found' };
    agent.status = published ? 'Published' : 'Pending';
    agent.is_active = published;
    return {
      success: true,
      message: published ? 'Agent published' : 'Agent unpublished',
      data: { agent_id: id, is_published: published },
    };
  },

  /** Mocked KB upload — no real file storage, just fabricates URLs so the
   * upload flow completes and knowledge_base_status transitions normally. */
  uploadKnowledgeBase(files: File[]): { files: Array<{ filename: string; size: number; url: string }>; count: number } {
    const uploaded = files.map((f) => ({
      filename: f.name,
      size: f.size,
      url: `mock://kb/${Math.random().toString(36).slice(2, 10)}/${encodeURIComponent(f.name)}`,
    }));
    return { files: uploaded, count: uploaded.length };
  },
};
