import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Create axios instance with auth header
const createAuthenticatedRequest = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

interface PublicationRequest {
  agent_id: string;
  is_published: boolean;
}

interface PublicationResponse {
  success: boolean;
  message: string;
  data?: {
    agent_id: string;
    is_published: boolean;
    published_at?: string;
    unpublished_at?: string;
  };
}

// Publication API functions
export const publishAgent = async (agentId: string): Promise<PublicationResponse> => {
  try {
    const response: AxiosResponse<PublicationResponse> = await axios.patch(
      `${API_BASE_URL}/publications/update`,
      {
        agent_id: agentId,
        is_published: true,
      } as PublicationRequest,
      createAuthenticatedRequest()
    );
    return response.data;
  } catch (error: any) {
    console.error("Error publishing agent:", error);
    throw new Error(
      error.response?.data?.message || "Failed to publish agent"
    );
  }
};

export const unpublishAgent = async (agentId: string): Promise<PublicationResponse> => {
  try {
    const response: AxiosResponse<PublicationResponse> = await axios.post(
      `${API_BASE_URL}/publications`,
      {
        agent_id: agentId,
        is_published: false,
      } as PublicationRequest,
      createAuthenticatedRequest()
    );
    return response.data;
  } catch (error: any) {
    console.error("Error unpublishing agent:", error);
    throw new Error(
      error.response?.data?.message || "Failed to unpublish agent"
    );
  }
};

// Check if agent is static (no API integration needed)
export const isStaticAgent = (agentId: string): boolean => {
  // Static agents typically have specific IDs or patterns
  // Adjust this logic based on your static agent identification method
  return agentId?.startsWith('static-') || agentId?.includes('demo-') || agentId?.length < 10;
};

export default {
  publishAgent,
  unpublishAgent,
  isStaticAgent,
};