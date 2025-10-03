import React, { useState, useRef } from 'react';
import GlassCard from '../components/GlassCard';
import { useAgent } from '../contexts/AgentContext';
import { 
  Plus, 
  Play, 
  Zap, 
  MessageSquare, 
  Mail, 
  Calendar, 
  Webhook, 
  Phone,
  Clock,
  Globe,
  Target,
  Info,
  Trash2,
  Copy,
  Settings,
  Bot,
  Edit,
  AlertCircle,
  X,
  Pause,
  Eye,
  Link,
  Database,
  Move
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  data: any;
  position: { x: number; y: number };
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

interface Workflow {
  id: string;
  name: string;
  agentId: string;
  agentName: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  status: 'Active' | 'Draft' | 'Paused';
  runs: number;
  lastRun: string;
  createdAt: Date;
}

const Workflows = () => {
  const { agents } = useAgent();
  const [activeTab, setActiveTab] = useState<'canvas' | 'workflows' | 'runs'>('canvas');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [isCreatingTrigger, setIsCreatingTrigger] = useState(false);
  const [newTrigger, setNewTrigger] = useState({ name: '', description: '', type: 'custom' });
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [touchFeedback, setTouchFeedback] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const predefinedTriggers = [
    {
      id: 'booking-confirmed',
      name: 'Booking Confirmed',
      description: 'When a booking is successfully made',
      icon: Calendar,
      color: 'green',
      type: 'predefined'
    },
    {
      id: 'lead-qualified',
      name: 'Lead Qualified',
      description: 'When lead score reaches threshold',
      icon: Target,
      color: 'blue',
      type: 'predefined'
    },
    {
      id: 'keyword-detected',
      name: 'Keyword Detected',
      description: 'When specific phrase is mentioned',
      icon: MessageSquare,
      color: 'purple',
      type: 'predefined'
    },
    {
      id: 'call-ended',
      name: 'Call Ended',
      description: 'When conversation completes',
      icon: Phone,
      color: 'orange',
      type: 'predefined'
    },
    {
      id: 'high-intent',
      name: 'High Purchase Intent',
      description: 'When customer shows buying signals',
      icon: Target,
      color: 'emerald',
      type: 'predefined'
    },
    {
      id: 'negative-sentiment',
      name: 'Negative Sentiment',
      description: 'When customer expresses dissatisfaction',
      icon: AlertCircle,
      color: 'red',
      type: 'predefined'
    }
  ];

  const [customTriggers, setCustomTriggers] = useState([
    {
      id: 'payment-failed',
      name: 'Payment Failed',
      description: 'When payment processing fails',
      icon: AlertCircle,
      color: 'red',
      type: 'custom'
    }
  ]);

  const allTriggers = [...predefinedTriggers, ...customTriggers];

  const actions = [
    {
      id: 'sms',
      name: 'SMS',
      description: 'Send text message',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      id: 'email',
      name: 'Email',
      description: 'Send email notification',
      icon: Mail,
      color: 'red'
    },
    {
      id: 'webhook',
      name: 'Webhook',
      description: 'POST data to external URL',
      icon: Webhook,
      color: 'purple'
    },
    {
      id: 'calendar',
      name: 'Calendar Event',
      description: 'Create Google/Microsoft event',
      icon: Calendar,
      color: 'orange'
    },
    {
      id: 'crm-update',
      name: 'Update CRM',
      description: 'Update customer record in CRM',
      icon: Database,
      color: 'indigo'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Message',
      description: 'Send template message via WhatsApp',
      icon: MessageSquare,
      color: 'green',
      compliance: 'Templates require approval'
    }
  ];

  const conditions = [
    { 
      id: 'time-window', 
      name: 'Time Window', 
      icon: Clock, 
      description: 'Execute only during specific hours',
      color: 'blue'
    },
    { 
      id: 'region', 
      name: 'Region Check', 
      icon: Globe, 
      description: 'Based on caller location',
      color: 'green'
    },
    { 
      id: 'language', 
      name: 'Language Match', 
      icon: MessageSquare, 
      description: 'Match conversation language',
      color: 'purple'
    },
    { 
      id: 'intent-confidence', 
      name: 'Intent Confidence', 
      icon: Target, 
      description: 'Minimum confidence score',
      color: 'orange'
    },
    { 
      id: 'call-duration', 
      name: 'Call Duration', 
      icon: Clock, 
      description: 'Based on call length',
      color: 'indigo'
    },
    { 
      id: 'previous-interaction', 
      name: 'Previous Interaction', 
      icon: Bot, 
      description: 'Based on call history',
      color: 'emerald'
    }
  ];

  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Booking Confirmation Flow',
      agentId: '1',
      agentName: 'Customer Support Bot',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          data: predefinedTriggers[0],
          position: { x: 100, y: 150 }
        },
        {
          id: 'action-1',
          type: 'action',
          data: actions[0],
          position: { x: 400, y: 150 }
        }
      ],
      connections: [
        { id: 'conn-1', from: 'trigger-1', to: 'action-1' }
      ],
      status: 'Active',
      runs: 47,
      lastRun: '2 min ago',
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Lead Follow-up',
      agentId: '2',
      agentName: 'Sales Assistant',
      nodes: [],
      connections: [],
      status: 'Draft',
      runs: 0,
      lastRun: 'Never',
      createdAt: new Date('2024-01-20')
    }
  ]);

  const tabs = [
    { id: 'canvas' as const, label: 'Canvas Builder', icon: Zap },
    { id: 'workflows' as const, label: 'My Workflows', icon: Settings },
    { id: 'runs' as const, label: 'Execution Log', icon: Play }
  ];

  const handleDragStart = (e: React.DragEvent, item: any, type: 'trigger' | 'action' | 'condition') => {
    setDraggedItem({ ...item, nodeType: type });
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: WorkflowNode = {
      id: `${draggedItem.nodeType}-${Date.now()}`,
      type: draggedItem.nodeType,
      data: draggedItem,
      position: { x: Math.max(0, x - 50), y: Math.max(0, y - 50) }
    };

    setNodes(prev => [...prev, newNode]);
    setDraggedItem(null);
  };

  // Touch event handlers for mobile drag and drop
  const handleTouchStart = (e: React.TouchEvent, item: any, type: 'trigger' | 'action' | 'condition') => {
    e.preventDefault();
    setDraggedItem({ ...item, nodeType: type });
    setTouchFeedback(`Touch and hold to drag ${item.name} to canvas`);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (draggedItem) {
      setTouchFeedback(`Dragging ${draggedItem.name}... Release over canvas to add`);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!draggedItem || !canvasRef.current) {
      setTouchFeedback(null);
      setDraggedItem(null);
      return;
    }

    const touch = e.changedTouches[0];
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Check if touch ended within canvas bounds
    if (touch.clientX >= canvasRect.left && touch.clientX <= canvasRect.right &&
        touch.clientY >= canvasRect.top && touch.clientY <= canvasRect.bottom) {
      
      const x = touch.clientX - canvasRect.left;
      const y = touch.clientY - canvasRect.top;

      const newNode: WorkflowNode = {
        id: `${draggedItem.nodeType}-${Date.now()}`,
        type: draggedItem.nodeType,
        data: draggedItem,
        position: { x: Math.max(0, x - 50), y: Math.max(0, y - 50) }
      };

      setNodes(prev => [...prev, newNode]);
      setTouchFeedback(`${draggedItem.name} added to canvas!`);
      
      // Clear success message after 2 seconds
      setTimeout(() => setTouchFeedback(null), 2000);
    } else {
      setTouchFeedback(`Release over the canvas area to add ${draggedItem.name}`);
      setTimeout(() => setTouchFeedback(null), 2000);
    }
    
    setDraggedItem(null);
  };

  // Alternative mobile method: tap to select, then tap canvas to place
  const handleMobileItemSelect = (item: any, type: 'trigger' | 'action' | 'condition') => {
    if (window.innerWidth <= 768) { // Mobile screen width
      setDraggedItem({ ...item, nodeType: type });
      setTouchFeedback(`${item.name} selected. Tap on canvas to place it.`);
    }
  };

  const handleMobileCanvasClick = (e: React.MouseEvent) => {
    if (!draggedItem || !canvasRef.current || window.innerWidth > 768) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: WorkflowNode = {
      id: `${draggedItem.nodeType}-${Date.now()}`,
      type: draggedItem.nodeType,
      data: draggedItem,
      position: { x: Math.max(0, x - 50), y: Math.max(0, y - 50) }
    };

    setNodes(prev => [...prev, newNode]);
    setTouchFeedback(`${draggedItem.name} added to canvas!`);
    setDraggedItem(null);
    
    // Clear success message after 2 seconds
    setTimeout(() => setTouchFeedback(null), 2000);
  };

  const handleNodeClick = (nodeId: string) => {
    if (connectingFrom) {
      if (connectingFrom !== nodeId) {
        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          from: connectingFrom,
          to: nodeId
        };
        setConnections(prev => [...prev, newConnection]);
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(nodeId);
    }
  };

  const handleNodeDelete = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => conn.from !== nodeId && conn.to !== nodeId));
  };

  const handleNodeDrag = (nodeId: string, newPosition: { x: number; y: number }) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position: newPosition } : node
    ));
  };

  const handleCreateTrigger = () => {
    if (!newTrigger.name.trim()) return;

    const trigger = {
      id: `custom-${Date.now()}`,
      name: newTrigger.name,
      description: newTrigger.description,
      icon: MessageSquare,
      color: 'indigo',
      type: 'custom'
    };

    setCustomTriggers(prev => [...prev, trigger]);
    setNewTrigger({ name: '', description: '', type: 'custom' });
    setIsCreatingTrigger(false);
  };

  const handleSaveWorkflow = () => {
    if (!workflowName.trim()) {
      alert('Workflow name is required');
      return;
    }
    if (!selectedAgent) {
      alert('Please select an agent for this workflow');
      return;
    }
    if (nodes.length === 0) {
      alert('Please add at least one trigger or action to the workflow');
      return;
    }

    const selectedAgentData = agents.find(a => a.id === selectedAgent);
    
    const newWorkflow: Workflow = {
      id: editingWorkflow?.id || Date.now().toString(),
      name: workflowName,
      agentId: selectedAgent,
      agentName: selectedAgentData?.name || 'Unknown Agent',
      nodes: [...nodes],
      connections: [...connections],
      status: 'Draft',
      runs: editingWorkflow?.runs || 0,
      lastRun: editingWorkflow?.lastRun || 'Never',
      createdAt: editingWorkflow?.createdAt || new Date()
    };

    if (editingWorkflow) {
      setWorkflows(prev => prev.map(w => w.id === editingWorkflow.id ? newWorkflow : w));
      alert('Workflow updated successfully!');
    } else {
      setWorkflows(prev => [...prev, newWorkflow]);
      alert('Workflow created successfully!');
    }

    // Reset form
    setWorkflowName('');
    setSelectedAgent('');
    setNodes([]);
    setConnections([]);
    setEditingWorkflow(null);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setWorkflowName(workflow.name);
    setSelectedAgent(workflow.agentId);
    setNodes([...workflow.nodes]);
    setConnections([...workflow.connections]);
    setActiveTab('canvas');
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
    }
  };

  const handleToggleWorkflowStatus = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, status: w.status === 'Active' ? 'Paused' : 'Active' }
        : w
    ));
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full px-2 sm:px-0">
      {/* Mobile-First Header */}
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center sm:text-left space-y-3 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white">
            Workflows ⚡
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto sm:mx-0">
            Automate actions when specific events happen in your calls
          </p>
        </div>
      </div>

      {/* Enhanced Mobile-First Tab Navigation */}
      <div className=" ">
        <GlassCard>
          <div className="p-4 sm:p-6">
            <div className="relative">
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-1.5 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 whitespace-nowrap text-sm sm:text-base font-medium min-w-fit touch-manipulation ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-lg scale-[1.02] border border-blue-200/50 dark:border-blue-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline text-xs sm:text-sm">
                      {tab.label}
                    </span>
                    <span className="xs:hidden sm:hidden text-xs">
                      {tab.label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
              
            
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Canvas Builder */}
      {activeTab === 'canvas' && (
        <div className=" space-y-4 sm:space-y-6">
          {/* Workflow Setup */}
          <GlassCard>
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-4 sm:mb-6">
                Workflow Setup
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Workflow Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="e.g., Lead Qualification Flow"
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white text-sm sm:text-base touch-manipulation"
                    required
                  />
                  {!workflowName.trim() && (
                    <p className="text-xs text-red-500 mt-2">Workflow name is required</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Assign to Agent <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white text-sm sm:text-base touch-manipulation"
                    style={{ zIndex: 50 }}
                    required
                  >
                    <option value="">Select an agent...</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.status})
                      </option>
                    ))}
                  </select>
                  {!selectedAgent && (
                    <p className="text-xs text-red-500 mt-2">Agent selection is required</p>
                  )}
                </div>
              </div>

              {selectedAgent && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-300">
                        {agents.find(a => a.id === selectedAgent)?.name}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        This workflow will be assigned to this agent
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Mobile-First Workflow Builder */}
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Triggers Panel */}
            <div className="lg:col-span-3">
              <GlassCard className="h-[400px] lg:h-[600px]">
                <div className="p-3 sm:p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                      Triggers
                    </h3>
                    <button
                      onClick={() => setIsCreatingTrigger(true)}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors touch-manipulation"
                      title="Add Custom Trigger"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {allTriggers.map((trigger) => (
                      <div
                        key={trigger.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, trigger, 'trigger')}
                        onTouchStart={(e) => handleTouchStart(e, trigger, 'trigger')}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => handleMobileItemSelect(trigger, 'trigger')}
                        className="p-2.5 sm:p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-move transition-all duration-200 bg-white/80 dark:bg-slate-800/80 hover:shadow-md touch-manipulation"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={`p-1.5 rounded-md flex-shrink-0 ${
                            trigger.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                            trigger.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                            trigger.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
                            trigger.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20' :
                            trigger.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                            trigger.color === 'red' ? 'bg-red-100 dark:bg-red-900/20' :
                            'bg-slate-100 dark:bg-slate-900/20'
                          }`}>
                            <trigger.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${
                              trigger.color === 'green' ? 'text-green-600 dark:text-green-400' :
                              trigger.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                              trigger.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                              trigger.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                              trigger.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                              trigger.color === 'red' ? 'text-red-600 dark:text-red-400' :
                              'text-slate-600 dark:text-slate-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 dark:text-white text-xs sm:text-sm truncate">
                              {trigger.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {trigger.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Canvas Area - Mobile Optimized */}
            <div className="lg:col-span-6">
              <GlassCard className="h-[500px] lg:h-[600px]">
                <div className="p-3 sm:p-4 h-full flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                      Workflow Canvas
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (nodes.length === 0) {
                            alert('Please add triggers and actions to test the workflow');
                            return;
                          }
                          alert('Workflow test initiated! Check the execution log for results.');
                        }}
                        disabled={nodes.length === 0}
                        className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      >
                        Test
                      </button>
                      <button
                        onClick={handleSaveWorkflow}
                        disabled={!workflowName.trim() || !selectedAgent || nodes.length === 0}
                        className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      >
                        {editingWorkflow ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Touch Feedback Display */}
                  {touchFeedback && (
                    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
                      {touchFeedback}
                    </div>
                  )}
                  
                  <div
                    ref={canvasRef}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={handleMobileCanvasClick}
                    className="flex-1 relative bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden"
                  >
                    {nodes.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-slate-500 dark:text-slate-400">
                          <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">Build Your Workflow</p>
                          <p className="text-sm max-w-md">
                            Drag triggers from the left and actions from the right to create your automation flow. 
                            Click nodes to connect them together.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Render Connections with Proper Arrows */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                          <defs>
                            <marker
                              id="arrowhead"
                              markerWidth="12"
                              markerHeight="8"
                              refX="11"
                              refY="4"
                              orient="auto"
                              markerUnits="strokeWidth"
                            >
                              <path
                                d="M0,0 L0,8 L12,4 z"
                                fill="#3b82f6"
                              />
                            </marker>
                          </defs>
                          
                          {connections.map((connection) => {
                            const fromNode = nodes.find(n => n.id === connection.from);
                            const toNode = nodes.find(n => n.id === connection.to);
                            
                            if (!fromNode || !toNode) return null;

                            const fromX = fromNode.position.x + 50; // Node center
                            const fromY = fromNode.position.y + 25;  // Node center
                            const toX = toNode.position.x + 50;
                            const toY = toNode.position.y + 25;

                            // Calculate control points for smooth curve
                            const distance = Math.abs(toX - fromX);
                            const controlOffset = Math.min(distance / 2, 100);
                            
                            const controlX1 = fromX + controlOffset;
                            const controlY1 = fromY;
                            const controlX2 = toX - controlOffset;
                            const controlY2 = toY;

                            return (
                              <g key={connection.id}>
                                {/* Main connection path with arrow */}
                                <path
                                  d={`M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${toX} ${toY}`}
                                  stroke="#3b82f6"
                                  strokeWidth="3"
                                  strokeDasharray="8,4"
                                  fill="none"
                                  markerEnd="url(#arrowhead)"
                                  className="drop-shadow-sm"
                                />
                                
                                {/* Connection dots for visual appeal */}
                                <circle
                                  cx={fromX + (toX - fromX) * 0.3}
                                  cy={fromY + (toY - fromY) * 0.3}
                                  r="3"
                                  fill="#3b82f6"
                                  className="opacity-60"
                                />
                                <circle
                                  cx={fromX + (toX - fromX) * 0.7}
                                  cy={fromY + (toY - fromY) * 0.7}
                                  r="3"
                                  fill="#3b82f6"
                                  className="opacity-60"
                                />
                              </g>
                            );
                          })}
                        </svg>

                        {/* Render Nodes - Compact Make.com Style */}
                        {nodes.map((node) => (
                          <div
                            key={node.id}
                            className={`absolute cursor-pointer transition-all duration-200 ${
                              connectingFrom === node.id 
                                ? 'scale-110 z-20' 
                                : 'hover:scale-105 z-10'
                            }`}
                            style={{
                              left: `${node.position.x}px`,
                              top: `${node.position.y}px`
                            }}
                            onMouseDown={(e) => {
                              if (e.button === 0) { // Left click only
                                const startX = e.clientX - node.position.x;
                                const startY = e.clientY - node.position.y;

                                const handleMouseMove = (e: MouseEvent) => {
                                  if (!canvasRef.current) return;
                                  const rect = canvasRef.current.getBoundingClientRect();
                                  const newX = Math.max(0, Math.min(e.clientX - rect.left - startX, rect.width - 100));
                                  const newY = Math.max(0, Math.min(e.clientY - rect.top - startY, rect.height - 100));
                                  handleNodeDrag(node.id, { x: newX, y: newY });
                                };

                                const handleMouseUp = () => {
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };

                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }
                            }}
                          >
                            {/* Make.com Style Compact Node */}
                            <div className={`relative ${
                              connectingFrom === node.id 
                                ? 'ring-4 ring-blue-500/30' 
                                : ''
                            }`}>
                              {/* Main Circle - Smaller and cleaner */}
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                                node.type === 'trigger' 
                                  ? `from-${node.data.color}-400 to-${node.data.color}-600`
                                  : node.type === 'action'
                                  ? `from-${node.data.color}-400 to-${node.data.color}-600`
                                  : `from-${node.data.color}-400 to-${node.data.color}-600`
                              } shadow-lg flex items-center justify-center border-2 border-white dark:border-slate-800 cursor-move`}>
                                <node.data.icon className="w-5 h-5 text-white" />
                              </div>

                              {/* Compact Node Label Card */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-slate-800 rounded-lg p-2 shadow-lg border border-slate-200 dark:border-slate-700 min-w-[120px] max-w-[160px]">
                                <p className="font-medium text-slate-800 dark:text-white text-xs text-center truncate">
                                  {node.data.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 text-center truncate">
                                  {node.data.description}
                                </p>
                                
                                {/* Node Type Badge */}
                                <div className="flex justify-center mt-1">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    node.type === 'trigger' 
                                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                      : node.type === 'action'
                                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                      : 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                  }`}>
                                    {node.type}
                                  </span>
                                </div>
                              </div>

                              {/* Delete Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNodeDelete(node.id);
                                }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                              >
                                <X className="w-3 h-3" />
                              </button>

                              {/* Connection Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNodeClick(node.id);
                                }}
                                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                                  connectingFrom === node.id
                                    ? 'bg-blue-500 text-white animate-pulse'
                                    : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-500 hover:text-white'
                                }`}
                              >
                                <Link className="w-3 h-3" />
                              </button>

                              {/* Drag Handle */}
                              <div className="absolute -top-1 -left-1 w-5 h-5 bg-slate-400 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-move">
                                <Move className="w-3 h-3" />
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Connection Instructions */}
                        {connectingFrom && (
                          <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-30 animate-pulse">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                              Click another node to connect
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Canvas Controls */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span>Nodes: {nodes.length}</span>
                      <span>Connections: {connections.length}</span>
                    </div>
                          
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConnectingFrom(null)}
                        className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNodes([]);
                          setConnections([]);
                          setConnectingFrom(null);
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Actions Panel */}
            <div className="lg:col-span-3">
              <GlassCard className="h-[400px] lg:h-[600px]">
                <div className="p-3 sm:p-4 h-full flex flex-col">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
                    Actions
                  </h3>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {actions.map((action) => (
                      <div
                        key={action.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, action, 'action')}
                        onTouchStart={(e) => handleTouchStart(e, action, 'action')}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => handleMobileItemSelect(action, 'action')}
                        className="p-2.5 sm:p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 cursor-move transition-all duration-200 bg-white/80 dark:bg-slate-800/80 hover:shadow-md touch-manipulation"
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className={`p-1.5 rounded-md flex-shrink-0 ${
                            action.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                            action.color === 'red' ? 'bg-red-100 dark:bg-red-900/20' :
                            action.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
                            action.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20' :
                            action.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/20' :
                            action.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                            'bg-slate-100 dark:bg-slate-900/20'
                          }`}>
                            <action.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${
                              action.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                              action.color === 'red' ? 'text-red-600 dark:text-red-400' :
                              action.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                              action.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                              action.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' :
                              action.color === 'green' ? 'text-green-600 dark:text-green-400' :
                              'text-slate-600 dark:text-slate-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 dark:text-white text-xs sm:text-sm truncate">
                              {action.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {action.description}
                            </p>
                            {action.compliance && (
                              <div className="flex items-center gap-1 mt-1">
                                <Info className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 truncate">
                                  {action.compliance}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Conditions */}
          <GlassCard>
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
                Add Conditions (Optional)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                Add conditions to control when your workflow executes. Drag conditions to the canvas to create conditional logic.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {conditions.map((condition) => (
                  <div
                    key={condition.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, condition, 'condition')}
                    onTouchStart={(e) => handleTouchStart(e, condition, 'condition')}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => handleMobileItemSelect(condition, 'condition')}
                    className="p-3 sm:p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 cursor-move transition-all duration-200 bg-white/80 dark:bg-slate-800/80 hover:shadow-lg touch-manipulation"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                        condition.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        condition.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                        condition.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
                        condition.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20' :
                        condition.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/20' :
                        condition.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                        'bg-slate-100 dark:bg-slate-900/20'
                      }`}>
                        <condition.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          condition.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                          condition.color === 'green' ? 'text-green-600 dark:text-green-400' :
                          condition.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                          condition.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                          condition.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' :
                          condition.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                          'text-slate-600 dark:text-slate-400'
                        }`} />
                      </div>
                      <span className="font-medium text-slate-800 dark:text-white text-sm sm:text-base flex-1 min-w-0 truncate">
                        {condition.name}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {condition.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* My Workflows */}
      {activeTab === 'workflows' && (
        <div className="">
          <GlassCard>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  My Workflows
                </h3>
                <button
                  onClick={() => setActiveTab('canvas')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                  New Workflow
                </button>
              </div>

            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 dark:text-white text-base sm:text-lg truncate">
                        {workflow.name}
                      </h4>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        <div className="flex items-center gap-1">
                          <Bot className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{workflow.agentName}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-4">
                          <span>•</span>
                          <span>{workflow.nodes.length} nodes</span>
                          <span>•</span>
                          <span>{workflow.runs} runs</span>
                          <span>•</span>
                          <span>Last: {workflow.lastRun}</span>
                        </div>
                        <div className="flex sm:hidden items-center gap-2 text-xs">
                          <span>{workflow.nodes.length} nodes</span>
                          <span>•</span>
                          <span>{workflow.runs} runs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <span className={`inline-flex w-fit px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      workflow.status === 'Active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : workflow.status === 'Paused'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {workflow.status}
                    </span>

                    <div className="flex gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEditWorkflow(workflow)}
                        className="p-2 text-slate-400 hover:text-blue-500 transition-colors touch-manipulation"
                        title="Edit Workflow"
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleToggleWorkflowStatus(workflow.id)}
                        className="p-2 text-slate-400 hover:text-yellow-500 transition-colors touch-manipulation"
                        title={workflow.status === 'Active' ? 'Pause Workflow' : 'Activate Workflow'}
                      >
                        {workflow.status === 'Active' ? (
                          <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          const newWorkflow = { 
                            ...workflow, 
                            id: Date.now().toString(), 
                            name: `${workflow.name} (Copy)`,
                            status: 'Draft' as const,
                            runs: 0,
                            lastRun: 'Never',
                            createdAt: new Date()
                          };
                          setWorkflows(prev => [...prev, newWorkflow]);
                        }}
                        className="p-2 text-slate-400 hover:text-green-500 transition-colors touch-manipulation"
                        title="Duplicate Workflow"
                      >
                        <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors touch-manipulation"
                        title="Delete Workflow"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {workflows.length === 0 && (
                <div className="text-center py-16">
                  <Zap className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
                  <h3 className="text-xl font-medium text-slate-600 dark:text-slate-400 mb-3">
                    No workflows yet
                  </h3>
                  <p className="text-slate-500 dark:text-slate-500 mb-8 max-w-md mx-auto">
                    Create your first workflow to automate agent actions and improve customer experience
                  </p>
                  <button
                    onClick={() => setActiveTab('canvas')}
                    className="px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    Create Your First Workflow
                  </button>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
        </div>
      )}

      {activeTab === 'runs' && (
        <GlassCard>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                Workflow Execution Log
              </h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <select 
                  className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm min-w-0 touch-manipulation"
                  style={{ zIndex: 50 }}
                >
                  <option value="all">All Workflows</option>
                  {workflows.map(workflow => (
                    <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
                  ))}
                </select>
                <button className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm touch-manipulation">
                  Refresh
                </button>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {workflows.filter(w => w.runs > 0).map((workflow) => (
                <div key={workflow.id} className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 dark:text-white text-base sm:text-lg truncate">
                          {workflow.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                          <span className="block sm:inline">{workflow.agentName}</span>
                          <span className="hidden sm:inline"> • </span>
                          <span className="block sm:inline">{workflow.runs} total runs</span>
                          <span className="hidden sm:inline"> • </span>
                          <span className="block sm:inline">Last: {workflow.lastRun}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-3">
                      <span className={`inline-flex px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                        workflow.status === 'Active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {workflow.status}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors touch-manipulation">
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {workflows.filter(w => w.runs > 0).length === 0 && (
                <div className="text-center py-16">
                  <Play className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
                  <h3 className="text-xl font-medium text-slate-600 dark:text-slate-400 mb-3">
                    No workflow executions yet
                  </h3>
                  <p className="text-slate-500 dark:text-slate-500">
                    Workflow execution history will appear here once your workflows start running
                  </p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Create Custom Trigger Modal */}
      {isCreatingTrigger && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white">
                Create Custom Trigger
              </h4>
              <button
                onClick={() => setIsCreatingTrigger(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Trigger Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTrigger.name}
                  onChange={(e) => setNewTrigger({ ...newTrigger, name: e.target.value })}
                  placeholder="e.g., High Priority Request"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newTrigger.description}
                  onChange={(e) => setNewTrigger({ ...newTrigger, description: e.target.value })}
                  placeholder="Describe when this trigger should activate"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsCreatingTrigger(false)}
                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTrigger}
                  disabled={!newTrigger.name.trim() || !newTrigger.description.trim()}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Workflows;