import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { agentAPI, ApiAgent, PublicationResponse, publishAgent, unpublishAgent, isStaticAgent } from "../services/agentAPI";

export interface Agent {
  id: string;
  name: string;
  status: "Draft" | "Training" | "Published";
  persona: string;
  language: string;
  greeting_message?: {
    text: string;
    [key: string]: any; // Allow for multiple language keys
  };
  voice: string;
  createdAt: Date;
  stats: {
    conversations: number;
    successRate: number;
    avgResponseTime: number;
    activeUsers: number;
  };
}

interface AgentContextType {
  agents: Agent[];
  currentAgent: Agent | null;
  isLoading: boolean;
  error: string | null;
  setCurrentAgent: (agent: Agent | null) => void;
  addAgent: (agent: Omit<Agent, "id" | "createdAt">) => Promise<void>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  refreshAgents: () => Promise<void>;
  publishAgentStatus: (id: string) => Promise<PublicationResponse>;
  unpublishAgentStatus: (id: string) => Promise<PublicationResponse>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
};

// Helper function to extract language from greeting_message object
const extractLanguageFromGreeting = (apiAgent: any): string => {
  // First check if greeting_message exists and has multiple language keys
  if (
    apiAgent.greeting_message &&
    typeof apiAgent.greeting_message === "object"
  ) {
    const languageKeys = Object.keys(apiAgent.greeting_message).filter(
      (key) =>
        typeof apiAgent.greeting_message[key] === "string" &&
        apiAgent.greeting_message[key].trim().length > 0 &&
        key.length <= 3 // Language codes are typically 2-3 characters
    );

    // If multiple languages found, return "Multi-lingual"
    if (languageKeys.length > 1) {
      return "Multi-lingual";
    }

    // If only one language in greeting, use that
    if (languageKeys.length === 1) {
      const language = languageKeys[0];
      return formatSingleLanguage(language);
    }
  }

  // Fallback to the language field from API
  return formatSingleLanguage(apiAgent.language || "en");
};

// Helper function to format single language display
const formatSingleLanguage = (language: string): string => {
  if (!language) return "English"; // Default fallback

  // Handle common language codes and formats
  const languageMap: { [key: string]: string } = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    hi: "Hindi",
    ar: "Arabic",
    multi: "Multi-lingual",
    multiple: "Multi-lingual",
  };

  const lowerLang = language.toLowerCase();

  // Check if it's a mapped language code
  if (languageMap[lowerLang]) {
    return languageMap[lowerLang];
  }

  // Check for multi-lingual indicators
  if (
    lowerLang.includes("multi") ||
    lowerLang.includes("multiple") ||
    lowerLang.includes(",") ||
    lowerLang.includes("&") ||
    lowerLang.includes("+")
  ) {
    return "Multi-lingual";
  }

  // Capitalize first letter for other languages
  return language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();
};

// Helper function to convert API agent to local agent format
const convertApiAgentToAgent = (apiAgent: ApiAgent): Agent => ({
  ...apiAgent,
  persona: apiAgent.personality,
  language: extractLanguageFromGreeting(apiAgent),
  greeting_message: apiAgent.greeting_message
    ? {
        text:
          typeof apiAgent.greeting_message === "string"
            ? apiAgent.greeting_message
            : apiAgent.greeting_message.text ||
              Object.values(apiAgent.greeting_message)[0] ||
              "Hello!",
        ...apiAgent.greeting_message,
      }
    : undefined,
  createdAt: new Date(apiAgent.createdAt),
  stats: apiAgent.stats || {
    conversations: 0,
    successRate: 0,
    avgResponseTime: 0,
    activeUsers: 0,
  },
});

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Check if we're on an agent-related page
  const isAgentPage =
    location.pathname.includes("/agents") ||
    location.pathname.includes("/agent") ||
    location.pathname.includes("/dashboard");

  // Load agents from API
  const loadAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiAgents = await agentAPI.getAgents();
      const convertedAgents = apiAgents.map(convertApiAgentToAgent);
      setAgents(convertedAgents);
      // Set first agent as current if none selected
      if (convertedAgents.length > 0 && !currentAgent) {
        setCurrentAgent(convertedAgents[0]);
      }
      setHasLoaded(true);
    } catch (err: any) {
      console.error("Failed to load agents:", err);
      setError(err.message || "Failed to load agents");
    } finally {
      setIsLoading(false);
    }
  };

  // Load agents only when on agent-related pages
  useEffect(() => {
    if (isAgentPage && !hasLoaded) {
      loadAgents();
    }
  }, [isAgentPage, hasLoaded]);

  const addAgent = async (agentData: Omit<Agent, "id" | "createdAt">) => {
    try {
      setError(null);

      // Call API to create agent
      const newApiAgent = await agentAPI.createAgent({
        name: agentData.name,
        persona: agentData.persona,
        language: agentData.language,
        voice: agentData.voice,
        status: agentData.status,
      });

      const newAgent = convertApiAgentToAgent(newApiAgent);
      setAgents((prev) => [...prev, newAgent]);

      // Set as current agent if it's the first one
      if (agents.length === 0) {
        setCurrentAgent(newAgent);
      }
    } catch (err: any) {
      console.error("Failed to create agent:", err);
      setError(err.message || "Failed to create agent");

      // Fallback to local creation if API fails
      const fallbackAgent: Agent = {
        ...agentData,
        id: Date.now().toString(),
        createdAt: new Date(),
        stats: {
          conversations: 0,
          successRate: 0,
          avgResponseTime: 0,
          activeUsers: 0,
        },
      };
      setAgents((prev) => [...prev, fallbackAgent]);

      if (agents.length === 0) {
        setCurrentAgent(fallbackAgent);
      }
    }
  };

  const updateAgent = async (id: string, updates: Partial<Agent>) => {
    try {
      setError(null);

      // Call API to update agent
      const updatedApiAgent = await agentAPI.updateAgent(id, {
        name: updates.name,
        persona: updates.persona,
        language: updates.language,
        voice: updates.voice,
        status: updates.status,
      });

      const updatedAgent = convertApiAgentToAgent(updatedApiAgent);

      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === id ? { ...agent, ...updatedAgent } : agent
        )
      );

      // Update current agent if it's the one being updated
      if (currentAgent?.id === id) {
        setCurrentAgent((prev) => (prev ? { ...prev, ...updatedAgent } : null));
      }
    } catch (err: any) {
      console.error("Failed to update agent:", err);
      setError(err.message || "Failed to update agent");

      // Fallback to local update if API fails
      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === id ? { ...agent, ...updates } : agent
        )
      );

      if (currentAgent?.id === id) {
        setCurrentAgent((prev) => (prev ? { ...prev, ...updates } : null));
      }
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      setError(null);

      // Call API to delete agent
      await agentAPI.deleteAgent(id);

      setAgents((prev) => prev.filter((agent) => agent.id !== id));

      // Clear current agent if it's the one being deleted
      if (currentAgent?.id === id) {
        setCurrentAgent(null);
      }
    } catch (err: any) {
      console.error("Failed to delete agent:", err);
      setError(err.message || "Failed to delete agent");

      // Fallback to local deletion if API fails
      setAgents((prev) => prev.filter((agent) => agent.id !== id));

      if (currentAgent?.id === id) {
        setCurrentAgent(null);
      }
    }
  };

  const publishAgentStatus = async (id: string): Promise<PublicationResponse> => {
    try {
      setError(null);

      // Check if it's a static agent - use existing flow
      if (isStaticAgent(id)) {
        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === id ? { ...agent, status: "Published" } : agent
          )
        );

        if (currentAgent?.id === id) {
          setCurrentAgent((prev) =>
            prev ? { ...prev, status: "Published" } : null
          );
        }
        return { success: true, message: "Static agent published successfully" };
      }

      // For API agents, use publication endpoint
      const response = await publishAgent(id);

      if (response.success) {
        // Update local state directly without calling agents API
        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === id ? { ...agent, status: "Published" } : agent
          )
        );

        if (currentAgent?.id === id) {
          setCurrentAgent((prev) =>
            prev ? { ...prev, status: "Published" } : null
          );
        }
      } else {
        throw new Error(response.message || "Failed to publish agent");
      }

      return response;
    } catch (err: any) {
      console.error("Failed to publish agent:", err);
      setError(err.message || "Failed to publish agent");
      throw err;
    }
  };

  const unpublishAgentStatus = async (id: string): Promise<PublicationResponse> => {
    try {
      setError(null);

      // Check if it's a static agent - use existing flow
      if (isStaticAgent(id)) {
        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === id ? { ...agent, status: "Draft" } : agent
          )
        );

        if (currentAgent?.id === id) {
          setCurrentAgent((prev) =>
            prev ? { ...prev, status: "Draft" } : null
          );
        }
        return { success: true, message: "Static agent unpublished successfully" };
      }

      // For API agents, use publication endpoint
      const response = await unpublishAgent(id);

      if (response.success) {
        // Update local state directly without calling agents API
        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === id ? { ...agent, status: "Draft" } : agent
          )
        );

        if (currentAgent?.id === id) {
          setCurrentAgent((prev) =>
            prev ? { ...prev, status: "Draft" } : null
          );
        }
      } else {
        throw new Error(response.message || "Failed to unpublish agent");
      }

      return response;
    } catch (err: any) {
      console.error("Failed to unpublish agent:", err);
      setError(err.message || "Failed to unpublish agent");
      throw err;
    }
  };

  const refreshAgents = async () => {
    if (isAgentPage) {
      await loadAgents();
    }
  };

  return (
    <AgentContext.Provider
      value={{
        agents,
        currentAgent,
        isLoading,
        error,
        setCurrentAgent,
        addAgent,
        updateAgent,
        deleteAgent,
        refreshAgents,
        publishAgentStatus,
        unpublishAgentStatus,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};
