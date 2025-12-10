import React, { createContext, useContext, useState, useEffect } from 'react';
import { agentAPI, ApiAgent } from '../services/agentAPI';

export interface Agent {
  id: string;
  name: string;
  status: 'Draft' | 'Training' | 'Published';
  persona: string;
  language: string;
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
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt'>) => Promise<void>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  refreshAgents: () => Promise<void>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

// Helper function to convert API agent to local agent format
const convertApiAgentToAgent = (apiAgent: ApiAgent): Agent => ({
  ...apiAgent,
  createdAt: new Date(apiAgent.createdAt),
  stats: apiAgent.stats || {
    conversations: 0,
    successRate: 0,
    avgResponseTime: 0,
    activeUsers: 0
  }
});

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error('Failed to load agents:', err);
      setError(err.message || 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  };

  // Load agents on component mount
  useEffect(() => {
    loadAgents();
  }, []);

  const addAgent = async (agentData: Omit<Agent, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      
      // Call API to create agent
      const newApiAgent = await agentAPI.createAgent({
        name: agentData.name,
        persona: agentData.persona,
        language: agentData.language,
        voice: agentData.voice,
        status: agentData.status
      });
      
      const newAgent = convertApiAgentToAgent(newApiAgent);
      setAgents(prev => [...prev, newAgent]);
      
      // Set as current agent if it's the first one
      if (agents.length === 0) {
        setCurrentAgent(newAgent);
      }
    } catch (err: any) {
      console.error('Failed to create agent:', err);
      setError(err.message || 'Failed to create agent');
      
      // Fallback to local creation if API fails
      const fallbackAgent: Agent = {
        ...agentData,
        id: Date.now().toString(),
        createdAt: new Date(),
        stats: {
          conversations: 0,
          successRate: 0,
          avgResponseTime: 0,
          activeUsers: 0
        }
      };
      setAgents(prev => [...prev, fallbackAgent]);
      
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
        status: updates.status
      });
      
      const updatedAgent = convertApiAgentToAgent(updatedApiAgent);
      
      setAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, ...updatedAgent } : agent
      ));
      
      // Update current agent if it's the one being updated
      if (currentAgent?.id === id) {
        setCurrentAgent(prev => prev ? { ...prev, ...updatedAgent } : null);
      }
    } catch (err: any) {
      console.error('Failed to update agent:', err);
      setError(err.message || 'Failed to update agent');
      
      // Fallback to local update if API fails
      setAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, ...updates } : agent
      ));
      
      if (currentAgent?.id === id) {
        setCurrentAgent(prev => prev ? { ...prev, ...updates } : null);
      }
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      setError(null);
      
      // Call API to delete agent
      await agentAPI.deleteAgent(id);
      
      setAgents(prev => prev.filter(agent => agent.id !== id));
      
      // Clear current agent if it's the one being deleted
      if (currentAgent?.id === id) {
        setCurrentAgent(null);
      }
    } catch (err: any) {
      console.error('Failed to delete agent:', err);
      setError(err.message || 'Failed to delete agent');
      
      // Fallback to local deletion if API fails
      setAgents(prev => prev.filter(agent => agent.id !== id));
      
      if (currentAgent?.id === id) {
        setCurrentAgent(null);
      }
    }
  };

  const refreshAgents = async () => {
    await loadAgents();
  };

  return (
    <AgentContext.Provider value={{
      agents,
      currentAgent,
      isLoading,
      error,
      setCurrentAgent,
      addAgent,
      updateAgent,
      deleteAgent,
      refreshAgents
    }}>
      {children}
    </AgentContext.Provider>
  );
};