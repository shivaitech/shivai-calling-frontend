import axios, { AxiosResponse } from "axios";

const API_BASE_URL = "https://shivai-com-backend.onrender.com/api/v1";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
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

// Agent interface matching backend response
export interface ApiAgent {
  id: string;
  name: string;
  status: 'Pending' | 'Published';
  personality: string;
  language: string;
  voice: string;
  createdAt: string;
  updatedAt?: string;
  greeting_message?: {
    [key: string]: string; // Language codes as keys with greeting text as values
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
    total: number;
    page?: number;
    limit?: number;
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
  language?: string;
  voice?: string;
  status?: 'Pending' | 'Published';
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
  // Static agents fallback method
  private getStaticAgents(): ApiAgent[] {
    return [
      {
        id: '1',
        name: 'Ricky sales machine',
        status: 'Published',
        personality: 'Empathetic',
        language: 'English (US)',
        voice: 'Sarah - Professional',
        createdAt: new Date('2024-01-15').toISOString(),
        stats: {
          conversations: 1247,
          successRate: 94.2,
          avgResponseTime: 1.2,
          activeUsers: 328
        }
      },
      {
        id: '2',
        name: 'Ami support assistant',
        status: 'Pending',
        personality: 'Persuasive (Sales)',
        language: 'Hindi',
        voice: 'Arjun - Friendly',
        createdAt: new Date('2024-01-20').toISOString(),
        stats: {
          conversations: 0,
          successRate: 0,
          avgResponseTime: 0,
          activeUsers: 0
        }
      },
      {
        id: '3',
        name: 'Maya customer care',
        status: 'Pending',
        personality: 'Professional',
        language: 'English (US)',
        voice: 'Emma - Warm',
        createdAt: new Date('2024-01-25').toISOString(),
        stats: {
          conversations: 45,
          successRate: 87.5,
          avgResponseTime: 2.1,
          activeUsers: 12
        }
      }
    ];
  }

  // Get all agents
  async getAgents(): Promise<ApiAgent[]> {
    try {
      const response: AxiosResponse<AgentsResponse> = await apiClient.get('/agents');
      
      if (response.data.success && response.data.data.agents) {
        const agents = response.data.data.agents.map(agent => ({
          ...agent,
          stats: agent.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0
          }
        }));
        
        // If API returns empty array, use static data
        if (agents.length === 0) {
          console.log('API returned empty agents array, using fallback static data');
          return this.getStaticAgents();
        }
        
        return agents;
      }
      
      // If response structure is invalid, use static data
      console.log('Invalid API response structure, using fallback static data');
      return this.getStaticAgents();
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      
      // Return fallback static data if API fails
      console.log('API request failed, using fallback static agent data');
      return this.getStaticAgents();
    }
  }

  // Get agent by ID
  async getAgent(id: string): Promise<ApiAgent> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiAgent; message?: string }> = 
        await apiClient.get(`/agents/${id}`);
      
      if (response.data.success && response.data.data) {
        return {
          ...response.data.data,
          stats: response.data.data.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0
          }
        };
      }
      
      throw new Error(response.data.message || 'Agent not found');
    } catch (error: any) {
      console.error('Error fetching agent:', error);
      
      // Try to find agent in static data as fallback
      const staticAgents = this.getStaticAgents();
      const agent = staticAgents.find(a => a.id === id);
      if (agent) {
        console.log('Using fallback static agent data for ID:', id);
        return agent;
      }
      
      throw error;
    }
  }

  // Create a new agent
  async createAgent(agentData: CreateAgentRequest): Promise<ApiAgent> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiAgent; message?: string }> = 
        await apiClient.post('/agents/create-agent', agentData);
      
      if (response.data.success && response.data.data) {
        return {
          ...response.data.data,
          stats: response.data.data.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0
          }
        };
      }
      
      throw new Error(response.data.message || 'Failed to create agent');
    } catch (error: any) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  // Update an existing agent
  async updateAgent(id: string, agentData: UpdateAgentRequest): Promise<ApiAgent> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiAgent; message?: string }> = 
        await apiClient.put(`/agents/${id}`, agentData);
      
      if (response.data.success && response.data.data) {
        return {
          ...response.data.data,
          stats: response.data.data.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0
          }
        };
      }
      
      throw new Error(response.data.message || 'Failed to update agent');
    } catch (error: any) {
      console.error('Error updating agent:', error);
      throw error;
    }
  }

  // Delete an agent
  async deleteAgent(id: string): Promise<void> {
    try {
      const response: AxiosResponse<{ success: boolean; message?: string }> = 
        await apiClient.delete(`/agents/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete agent');
      }
    } catch (error: any) {
      console.error('Error deleting agent:', error);
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
      const response: AxiosResponse<{ success: boolean; data: any; message?: string }> = 
        await apiClient.get(`/agent-sessions/agent/${agentId}?${payload}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch agent sessions');
    } catch (error: any) {
      console.error('Error fetching agent sessions:', error);
      throw error;
    }
  }

  async getSessionTranscripts(sessionId: string): Promise<any> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any; message?: string }> = 
        await apiClient.get(`/agent-sessions/${sessionId}/transcripts`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch session transcripts');
    } catch (error: any) {
      console.error('Error fetching session transcripts:', error);
      throw error;
    }
  }

  // Get call summary for an agent
  async getCallSummary(agentId: string): Promise<any> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any; message?: string }> = 
        await apiClient.get(`/leads/agent/${agentId}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch call summary');
    } catch (error: any) {
      console.error('Error fetching call summary:', error);
      throw error;
    }
  }

  isStaticAgent(agentId: string): boolean {
    return agentId?.startsWith('static-') || agentId?.includes('demo-') || (agentId?.length < 10 && !agentId.includes('-'));
  }
}

export const agentAPI = new AgentAPI();

// Export convenience functions
export const publishAgent = (agentId: string): Promise<PublicationResponse> => 
  agentAPI.publishAgent(agentId);

export const unpublishAgent = (agentId: string): Promise<PublicationResponse> => 
  agentAPI.unpublishAgent(agentId);

export const isStaticAgent = (agentId: string): boolean => 
  agentAPI.isStaticAgent(agentId);