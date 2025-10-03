import React, { createContext, useContext, useState } from 'react';

export interface Agent {
  id: string;
  name: string;
  status: 'Draft' | 'Training' | 'Published';
  persona: string;
  language: string;
  voice: string;
  createdAt: Date;
}

interface AgentContextType {
  agents: Agent[];
  currentAgent: Agent | null;
  setCurrentAgent: (agent: Agent | null) => void;
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Ricky sales machine',
      status: 'Published',
      persona: 'Empathetic',
      language: 'English (US)',
      voice: 'Sarah - Professional',
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Ami support assistant',
      status: 'Draft',
      persona: 'Persuasive (Sales)',
      language: 'Hindi',
      voice: 'Arjun - Friendly',
      createdAt: new Date('2024-01-20')
    }
  ]);
  
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(agents[0]);

  const addAgent = (agentData: Omit<Agent, 'id' | 'createdAt'>) => {
    const newAgent: Agent = {
      ...agentData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setAgents(prev => [...prev, newAgent]);
    setCurrentAgent(newAgent);
  };

  const updateAgent = (id: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(agent => 
      agent.id === id ? { ...agent, ...updates } : agent
    ));
    if (currentAgent?.id === id) {
      setCurrentAgent(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  return (
    <AgentContext.Provider value={{
      agents,
      currentAgent,
      setCurrentAgent,
      addAgent,
      updateAgent
    }}>
      {children}
    </AgentContext.Provider>
  );
};