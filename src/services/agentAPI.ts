import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const tokens = localStorage.getItem("auth_tokens");
  if (tokens) {
    try {
      const { accessToken } = JSON.parse(tokens);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.warn("Failed to parse auth tokens:", error);
    }
  }
  return config;
});

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is 401 (Unauthorized) - token expired or invalid
    if (error.response?.status === 401) {
      // Clear auth tokens from localStorage
      localStorage.removeItem("auth_tokens");

      // Redirect to landing page
      window.location.href = "/landing";
    }

    return Promise.reject(error);
  }
);

export interface ApiAgent {
  id: string;
  name: string;
  status: "Pending" | "Published";
  personality: string;
  language: string;
  voice: string;
  createdAt: string;
  updatedAt?: string;
  gender?: string;
  business_process?: string;
  industry?: string;
  sub_industry?: string;
  custom_instructions?: string;
  guardrails_level?: string;
  response_style?: string;
  max_response_length?: string;
  context_window?: string;
  temperature?: number;
  greeting_message?: {
    [key: string]: string;
  };
  template?: {
    name: string;
    description: string;
    icon: string;
    features: string[];
    systemPrompt?: string;
    firstMessage?: string;
    openingScript?: string;
    keyTalkingPoints?: string;
    closingScript?: string;
    objections?: Array<{ objection: string; response: string }>;
    conversationExamples?: Array<{
      customerInput: string;
      expectedResponse: string;
    }>;
  };

  stats?: {
    conversations: number;
    successRate: number;
    avgResponseTime: number;
    activeUsers: number;
  };
}

interface AgentsResponse {
  success: boolean;
  data: {
    agents: ApiAgent[];
  };
  meta?: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp?: string;
  };
  message?: string;
}

interface CreateAgentRequest {
  name: string;
  gender: string;
  business_process: string;
  industry: string;
  personality: string;
  language: string;
  voice: string;
  custom_instructions: string;
  guardrails_level: string;
  response_style: string;
  max_response_length: string;
  context_window: string;
  temperature: number;
}

interface UpdateAgentRequest {
  name?: string;
  persona?: string;
  personality?: string;
  language?: string;
  voice?: string;
  gender?: string;
  business_process?: string;
  industry?: string;
  sub_industry?: string;
  custom_instructions?: string;
  guardrails_level?: string;
  response_style?: string;
  max_response_length?: string;
  context_window?: string;
  temperature?: number;
  status?: "Pending" | "Published";
  template?: {
    name: string;
    description: string;
    icon: string;
    features: string[];
    systemPrompt?: string;
    firstMessage?: string;
    openingScript?: string;
    keyTalkingPoints?: string;
    closingScript?: string;
    objections?: Array<{ objection: string; response: string }>;
    conversationExamples?: Array<{
      customerInput: string;
      expectedResponse: string;
    }>;
  };
}

export interface PublicationRequest {
  agent_id: string;
  is_published: boolean;
}

export interface PublicationResponse {
  success: boolean;
  message: string;
  data?: {
    agent_id: string;
    is_published: boolean;
    published_at?: string;
    unpublished_at?: string;
  };
}

class AgentAPI {
  // Get all agents
  async getAgents(): Promise<ApiAgent[]> {
    try {
      const response: AxiosResponse<AgentsResponse> = await apiClient.get(
        "/agents"
      );

      if (response.data.success && response.data.data.agents) {
        const agents = response.data.data.agents.map((agent) => ({
          ...agent,
          stats: agent.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0,
          },
        }));

        return agents;
      }

      return [];
    } catch (error: any) {
      console.error("Error fetching agents:", error);
      throw error;
    }
  }

  // Get agents with filters and pagination
  async getAgentsWithFilters(params: {
    gender?: string;
    sort?: string;
    search?: string;
    page?: number;
    limit?: number;
    industry?: string;
    business_process?: string;
  }): Promise<{
    agents: ApiAgent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      if (params.gender && params.gender !== 'all') {
        queryParams.append('gender', params.gender);
      }
      if (params.sort) {
        queryParams.append('sort', params.sort);
      }
      if (params.search) {
        queryParams.append('search', params.search);
      }
      if (params.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.industry) {
        queryParams.append('industry', params.industry);
      }
      if (params.business_process) {
        queryParams.append('business_process', params.business_process);
      }

      const queryString = queryParams.toString();
      const url = `/agents${queryString ? `?${queryString}` : ''}`;
      
      const response: AxiosResponse<AgentsResponse> = await apiClient.get(url);

      if (response.data.success && response.data.data.agents) {
        const agents = response.data.data.agents.map((agent) => ({
          ...agent,
          stats: agent.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0,
          },
        }));

        // Extract pagination from meta.pagination
        const pagination = response.data.meta?.pagination;
        const total = pagination?.total || agents.length;
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 6;
        const totalPages = pagination?.totalPages || Math.ceil(total / limit);

        return {
          agents,
          total,
          page,
          limit,
          totalPages,
        };
      }

      return {
        agents: [],
        total: 0,
        page: 1,
        limit: params.limit || 6,
        totalPages: 0,
      };
    } catch (error: any) {
      console.error("Error fetching agents with filters:", error);
      throw error;
    }
  }

  // Get agent by ID
  async getAgent(id: string): Promise<{ agent: ApiAgent }> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data?: {
          agent: ApiAgent;
          stats?: {
            conversations: number;
            successRate: number;
            avgResponseTime: number;
            activeUsers: number;
          };
        };
        message?: string;
      }> = await apiClient.get(`/agents/${id}`);

      if (response.data.success && response.data.data?.agent) {
        const agent = {
          ...response.data.data.agent,
          stats: response.data.data.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0,
          },
        };
        return { agent };
      }

      throw new Error(response.data.message || "Agent not found");
    } catch (error: any) {
      console.error("Error fetching agent:", error);
      throw error;
    }
  }

  // Create a new agent
  async createAgent(agentData: CreateAgentRequest): Promise<ApiAgent> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: ApiAgent;
        message?: string;
      }> = await apiClient.post("/agents/create-agent", agentData);

      if (response.data.success && response.data.data) {
        return {
          ...response.data.data,
          stats: response.data.data.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0,
          },
        };
      }

      throw new Error(response.data.message || "Failed to create agent");
    } catch (error: any) {
      console.error("Error creating agent:", error);
      throw error;
    }
  }

  // Update an existing agent
  async updateAgent(
    id: string,
    agentData: UpdateAgentRequest
  ): Promise<ApiAgent> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: ApiAgent;
        message?: string;
      }> = await apiClient.put(`/agents/${id}`, agentData);

      if (response.data.success && response.data.data) {
        return {
          ...response.data.data,
          stats: response.data.data.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0,
          },
        };
      }

      throw new Error(response.data.message || "Failed to update agent");
    } catch (error: any) {
      console.error("Error updating agent:", error);
      throw error;
    }
  }

  // Delete an agent
  async deleteAgent(id: string): Promise<void> {
    try {
      const response: AxiosResponse<{ success: boolean; message?: string }> =
        await apiClient.delete(`/agents/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete agent");
      }
    } catch (error: any) {
      console.error("Error deleting agent:", error);
      throw error;
    }
  }

  // Publication API functions
  async publishAgent(agentId: string): Promise<PublicationResponse> {
    try {
      const response: AxiosResponse<PublicationResponse> = await apiClient.post(
        `/publications/publish`,
        {
          agent_id: agentId,
          is_published: true,
        } as PublicationRequest
      );
      return response.data;
    } catch (error: any) {
      console.error("Error publishing agent:", error);
      throw new Error(
        error.response?.data?.message || "Failed to publish agent"
      );
    }
  }

  async unpublishAgent(agentId: string): Promise<PublicationResponse> {
    try {
      const response: AxiosResponse<PublicationResponse> = await apiClient.post(
        `/publications/publish`,
        {
          agent_id: agentId,
          is_published: false,
        } as PublicationRequest
      );
      return response.data;
    } catch (error: any) {
      console.error("Error unpublishing agent:", error);
      throw new Error(
        error.response?.data?.message || "Failed to unpublish agent"
      );
    }
  }

  // Get agent session history
  async getAgentSessions(payload: string, agentId: string): Promise<any> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: any;
        message?: string;
      }> = await apiClient.get(`/agent-sessions/agent/${agentId}?${payload}`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(
        response.data.message || "Failed to fetch agent sessions"
      );
    } catch (error: any) {
      console.error("Error fetching agent sessions:", error);
      throw error;
    }
  }

  async getSessionTranscripts(sessionId: string): Promise<any> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: any;
        message?: string;
      }> = await apiClient.get(`/agent-sessions/${sessionId}/transcripts`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(
        response.data.message || "Failed to fetch session transcripts"
      );
    } catch (error: any) {
      console.error("Error fetching session transcripts:", error);
      throw error;
    }
  }

  // Get call summary for an agent
  async getCallSummary(agentId: string): Promise<any> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: any;
        message?: string;
      }> = await apiClient.get(`/leads/agent/${agentId}`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to fetch call summary");
    } catch (error: any) {
      console.error("Error fetching call summary:", error);
      throw error;
    }
  }

  // Widget Configuration API
  async saveWidgetConfig(widgetData: {
    agent_id: string;
    company_logo?: string;
    ai_employee_name: string;
    ai_employee_description: string;
    theme?: string;
    position?: string;
    button_text?: string;
    welcome_message?: string;
    allowed_domains?: string[];
  }): Promise<any> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: any;
        message?: string;
      }> = await apiClient.post(`/widgets`, widgetData); // Assuming PUT for saving configuration

      return response.data;
    } catch (error: any) {
      console.error("Error saving widget configuration:", error);
      throw error;
    }
  }

  // Logo Upload API
  async uploadLogo(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await apiClient.post("/upload/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      throw error;
    }
  }

  // Generate AI Prompt API - with extended timeout for AI generation
  async generatePrompt(prompt: string): Promise<any> {
    try {
      const response = await apiClient.post("/generate-prompt/generate", {
        prompt,
      }, {
        timeout: 120000, // 2 minutes timeout for AI generation
      });
      return response.data;
    } catch (error: any) {
      console.error("Error generating prompt:", error);
      throw error;
    }
  }

  // Knowledge Base Upload API
  async uploadKnowledgeBase(files: File[]): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      files: Array<{
        filename: string;
        size: number;
        url: string;
      }>;
      count: number;
    };
  }> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      const response = await apiClient.post("/agents/upload/knowledge-bases", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 1 minute timeout for file uploads
      });
      return response.data;
    } catch (error: any) {
      console.error("Error uploading knowledge base files:", error);
      throw error;
    }
  }
}

export const agentAPI = new AgentAPI();

// Export convenience functions
export const publishAgent = (agentId: string): Promise<PublicationResponse> =>
  agentAPI.publishAgent(agentId);

export const unpublishAgent = (agentId: string): Promise<PublicationResponse> =>
  agentAPI.unpublishAgent(agentId);
