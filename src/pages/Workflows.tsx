import React, { useState, useRef, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { isDeveloperUser } from '../lib/utils';
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
  const { user } = useAuth();
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
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Check if current user is developer
  const isDeveloper = isDeveloperUser(user?.email);

  // Keyboard shortcuts for canvas controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            handleZoomIn();
            break;
          case '-':
            e.preventDefault();
            handleZoomOut();
            break;
          case '0':
            e.preventDefault();
            handleResetZoom();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const [workflows, setWorkflows] = useState<Workflow[]>(isDeveloper ? [
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
  ] : []);

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
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Convert screen coordinates to canvas coordinates accounting for zoom and pan
    const x = (rawX - canvasPan.x) / canvasZoom;
    const y = (rawY - canvasPan.y) / canvasZoom;

    const newNode: WorkflowNode = {
      id: `${draggedItem.nodeType}-${Date.now()}`,
      type: draggedItem.nodeType,
      data: draggedItem,
      position: { x: x - 50, y: y - 50 }
    };

    setNodes(prev => [...prev, newNode]);
    setDraggedItem(null);
  };

  // Simple mobile add function - works with infinite canvas
  const handleAddToCanvas = (item: any, type: 'trigger' | 'action' | 'condition') => {
    if (!canvasRef.current) return;

    // Create positions in a grid-like pattern to avoid overlap
    // Account for canvas zoom and pan
    const baseX = 100 - canvasPan.x / canvasZoom;
    const baseY = 100 - canvasPan.y / canvasZoom;
    
    let x = baseX + (nodes.length % 4) * 250;
    let y = baseY + Math.floor(nodes.length / 4) * 150;

    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type: type,
      data: item,
      position: { x, y }
    };

    setNodes(prev => [...prev, newNode]);
    setTouchFeedback(`✓ ${item.name} added to workflow!`);
    
    // Clear success message after 1.5 seconds
    setTimeout(() => setTouchFeedback(null), 1500);
  };

  // Canvas zoom and pan controls
  const handleZoomIn = () => {
    setCanvasZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setCanvasZoom(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleResetZoom = () => {
    setCanvasZoom(1);
    setCanvasPan({ x: 0, y: 0 });
  };

  // Canvas panning handlers - Enhanced for touch devices
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+Left click
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      e.preventDefault();
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setCanvasPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setCanvasZoom(prev => Math.min(Math.max(prev * delta, 0.3), 3));
    }
  };

  // Touch gesture handlers for mobile devices
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance?: number } | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start panning
      setIsPanning(true);
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setInitialPan(canvasPan);
    } else if (e.touches.length === 2) {
      // Two-finger pinch - start zooming
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setTouchStart({
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        distance
      });
      setInitialZoom(canvasZoom);
      setInitialPan(canvasPan);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    if (e.touches.length === 1 && !touchStart.distance) {
      // Single touch panning
      e.preventDefault();
      const deltaX = e.touches[0].clientX - touchStart.x;
      const deltaY = e.touches[0].clientY - touchStart.y;
      setCanvasPan({
        x: initialPan.x + deltaX,
        y: initialPan.y + deltaY
      });
    } else if (e.touches.length === 2 && touchStart.distance) {
      // Two-finger pinch zooming
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / touchStart.distance;
      const newZoom = Math.min(Math.max(initialZoom * scale, 0.3), 3);
      setCanvasZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setTouchStart(null);
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
    <div className="space-y-4 sm:space-y-6 w-full ">
      {/* Mobile-First Header */}
      

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
                    disabled={!isDeveloper}
                    className={`w-full px-4 py-3 rounded-xl text-sm sm:text-base touch-manipulation ${
                      isDeveloper 
                        ? 'common-bg-icons'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
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
                    disabled={!isDeveloper}
                    className={`w-full px-4 py-3 rounded-xl text-sm sm:text-base touch-manipulation ${
                      isDeveloper 
                        ? 'common-bg-icons'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
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
                      disabled={!isDeveloper}
                      className={`p-2 rounded-lg transition-colors touch-manipulation ${
                        isDeveloper 
                          ? 'common-bg-icons hover:shadow-sm'
                          : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50'
                      }`}
                      title="Add Custom Trigger"
                    >
                      <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto">

                    {allTriggers.map((trigger) => (
                      <div
                        key={trigger.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, trigger, 'trigger')}
                        className="common-bg-icons p-2.5 sm:p-3 rounded-lg cursor-move transition-all duration-200 hover:shadow-md touch-manipulation"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="common-bg-icons p-1.5 rounded-md flex-shrink-0">
                            <trigger.icon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 dark:text-white text-xs sm:text-sm truncate">
                              {trigger.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {trigger.description}
                            </p>
                          </div>
                          {/* Mobile Add Button - Smaller but finger-friendly */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCanvas(trigger, 'trigger');
                            }}
                            disabled={!isDeveloper}
                            className={`sm:hidden p-1 rounded-md transition-colors touch-manipulation flex-shrink-0 active:scale-95 min-w-[28px] min-h-[28px] ${
                              isDeveloper 
                                ? 'common-button-bg'
                                : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50'
                            }`}
                            title="Add to Canvas"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          {/* Desktop Drag Handle */}
                          <div className="hidden sm:block flex-shrink-0">
                            <Move className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500" />
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
              <GlassCard className="h-[500px] lg:h-[600px] overflow-hidden relative">
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
                        disabled={nodes.length === 0 || !isDeveloper}
                        className={`flex-1 sm:flex-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${
                          isDeveloper 
                            ? 'common-button-bg2'
                            : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 px-3 py-2 text-xs sm:text-sm rounded-lg'
                        }`}
                      >
                        Test
                      </button>
                      <button
                        onClick={handleSaveWorkflow}
                        disabled={!workflowName.trim() || !selectedAgent || nodes.length === 0 || !isDeveloper}
                        className={`flex-1 sm:flex-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${
                          isDeveloper 
                            ? 'common-button-bg'
                            : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 px-3 py-2 text-xs sm:text-sm rounded-lg'
                        }`}
                      >
                        {editingWorkflow ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Success Feedback Display */}
                  {touchFeedback && (
                    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-top-2">
                      {touchFeedback}
                    </div>
                  )}
                  
                  {/* Mobile-Optimized Canvas Zoom Controls */}
                  <div className="absolute hidden  bottom-3 right-3 z-10  flex-col gap-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-2 sm:p-2">
                    <button
                      onClick={handleZoomIn}
                      disabled={canvasZoom >= 3}
                      className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-all flex items-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95 font-bold text-lg"
                      title="Zoom In"
                    >
                      +
                    </button>
                    <button
                      onClick={handleZoomOut}
                      disabled={canvasZoom <= 0.3}
                      className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-800/40 transition-all flex items-center justify-center text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95 font-bold text-lg"
                      title="Zoom Out"
                    >
                      −
                    </button>
                    <div className="w-full h-px bg-slate-200 dark:bg-slate-600 my-1"></div>
                    <button
                      onClick={handleResetZoom}
                      className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-slate-50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-all flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold touch-manipulation active:scale-95"
                      title="Reset View"
                    >
                      ⌂
                    </button>
                  </div>

                  {/* Infinite Canvas Container */}
                  <div
                    ref={canvasRef}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onWheel={handleCanvasWheel}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`flex-1 relative rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden touch-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{ 
                      cursor: isPanning ? 'grabbing' : 'grab',
                      background: `
                        radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0),
                        linear-gradient(to bottom, rgb(248, 250, 252), rgb(241, 245, 249))
                      `,
                      backgroundSize: '20px 20px',
                      touchAction: 'none' // Prevent default touch behaviors
                    }}
                  >
                    {/* Canvas Content with Transform */}
                    <div 
                      className="absolute inset-0 w-full h-full"
                      style={{
                        transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`,
                        transformOrigin: '0 0',
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                      }}
                    >
                    {nodes.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="text-center text-slate-500 dark:text-slate-400 p-4">
                          <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-3">
                            {isDeveloper ? 'Build Your Workflow' : 'Workflow Canvas'}
                          </p>
                          <div className="text-sm max-w-md mx-auto space-y-2">
                            {isDeveloper ? (
                              <>
                                <p className="block sm:hidden">
                                  Tap the <span className="inline-flex w-4 h-4 bg-blue-500 text-white rounded text-xs items-center justify-center mx-1">+</span> buttons to add triggers and actions to your workflow.
                                </p>
                                <p className="hidden sm:block">
                                  Drag triggers from the left and actions from the right to create your automation flow.
                                </p>
                                <p className="block mt-2">
                                  <span className="block sm:hidden">Touch nodes to connect them together.</span>
                                  <span className="hidden sm:block">Click nodes to connect them together.</span>
                                </p>
                                <p className="block sm:hidden text-xs text-slate-400 mt-3">
                                  Use pinch gestures to zoom • Drag with one finger to pan
                                </p>
                              </>
                            ) : (
                              <>
                                <p>This is where you'll build automated workflows for your agents.</p>
                                <p className="text-xs text-slate-400 mt-2">
                                  Create agents first to start building automation flows
                                </p>
                              </>
                            )}
                          </div>
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
                              {/* Main Circle - Mobile optimized with larger touch target */}
                              <div className={`w-14 h-14 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${
                                node.type === 'trigger' 
                                  ? `from-${node.data.color}-400 to-${node.data.color}-600`
                                  : node.type === 'action'
                                  ? `from-${node.data.color}-400 to-${node.data.color}-600`
                                  : `from-${node.data.color}-400 to-${node.data.color}-600`
                              } shadow-lg flex items-center justify-center border-2 border-white dark:border-slate-800 cursor-move touch-manipulation active:scale-95 transition-transform`}>
                                <node.data.icon className="w-6 h-6 sm:w-5 sm:h-5 text-white" />
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

                              {/* Delete Button - Mobile optimized */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNodeDelete(node.id);
                                }}
                                className="absolute -top-2 -right-2 w-7 h-7 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg touch-manipulation active:scale-90"
                              >
                                <X className="w-4 h-4 sm:w-3 sm:h-3" />
                              </button>

                              {/* Connection Button - Mobile optimized */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNodeClick(node.id);
                                }}
                                className={`absolute -bottom-2 -right-2 w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all shadow-lg touch-manipulation active:scale-90 ${
                                  connectingFrom === node.id
                                    ? 'bg-blue-500 text-white animate-pulse'
                                    : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-500 hover:text-white'
                                }`}
                              >
                                <Link className="w-4 h-4 sm:w-3 sm:h-3" />
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
                  </div>

                  {/* Canvas Controls - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 gap-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <span className="common-bg-icons px-2 py-1 rounded">
                        Nodes: {nodes.length}
                      </span>
                      <span className="common-bg-icons px-2 py-1 rounded">
                        Links: {connections.length}
                      </span>
                      <span className="common-bg-icons px-2 py-1 rounded">
                        Zoom: {Math.round(canvasZoom * 100)}%
                      </span>
                      <span className="hidden sm:inline text-xs common-bg-icons px-2 py-1 rounded">
                        Ctrl+/-: zoom • Ctrl+0: reset • Middle-click: pan
                      </span>
                      <span className="sm:hidden text-xs common-bg-icons px-2 py-1 rounded">
                        Pinch: zoom • Drag: pan
                      </span>
                    </div>
                          
                    <div className="flex gap-2">
                      {connectingFrom && (
                        <button
                          type="button"
                          onClick={() => setConnectingFrom(null)}
                          className="common-button-bg2 px-3 py-2 text-sm rounded-lg touch-manipulation"
                        >
                          Cancel Connect
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setNodes([]);
                          setConnections([]);
                          setConnectingFrom(null);
                        }}
                        className="common-button-bg2 flex items-center gap-1 px-3 py-2 text-sm rounded-lg touch-manipulation hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Clear All</span>
                        <span className="sm:hidden">Clear</span>
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
                        className="common-bg-icons p-2.5 sm:p-3 rounded-lg cursor-move transition-all duration-200 hover:shadow-md touch-manipulation"
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="common-bg-icons p-1.5 rounded-md flex-shrink-0">
                            <action.icon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
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
                          {/* Mobile Add Button - Smaller but finger-friendly */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCanvas(action, 'action');
                            }}
                            disabled={!isDeveloper}
                            className={`sm:hidden p-1 rounded-md transition-colors touch-manipulation flex-shrink-0 self-start mt-0.5 active:scale-95 min-w-[28px] min-h-[28px] ${
                              isDeveloper 
                                ? 'common-button-bg'
                                : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                            }`}
                            title="Add to Canvas"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          {/* Desktop Drag Handle */}
                          <div className="hidden sm:block flex-shrink-0 self-start mt-0.5">
                            <Move className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500" />
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
                    className="common-bg-icons p-3 sm:p-4 rounded-xl cursor-move transition-all duration-200 hover:shadow-lg touch-manipulation"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="common-bg-icons p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                        <condition.icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <span className="font-medium text-slate-800 dark:text-white text-sm sm:text-base flex-1 min-w-0 truncate">
                        {condition.name}
                      </span>
                      {/* Mobile Add Button - Smaller but finger-friendly */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCanvas(condition, 'condition');
                        }}
                        disabled={!isDeveloper}
                        className={`sm:hidden p-1 rounded-md transition-colors touch-manipulation flex-shrink-0 active:scale-95 min-w-[28px] min-h-[28px] ${
                          isDeveloper 
                            ? 'common-button-bg'
                            : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                        }`}
                        title="Add to Canvas"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      {/* Desktop Drag Handle */}
                      <div className="hidden sm:block flex-shrink-0">
                        <Move className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" />
                      </div>
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
                  disabled={!isDeveloper}
                  className={`flex items-center justify-center gap-2 touch-manipulation ${
                    isDeveloper 
                      ? 'common-button-bg'
                      : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-4 py-2.5 rounded-lg'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  New Workflow
                </button>
              </div>

            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="common-bg-icons flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 rounded-xl hover:shadow-md transition-all gap-4"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="common-bg-icons w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400" />
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
                        ? 'common-bg-icons text-slate-700 dark:text-slate-300'
                        : workflow.status === 'Paused'
                        ? 'common-bg-icons text-slate-700 dark:text-slate-300'
                        : 'common-bg-icons text-slate-700 dark:text-slate-300'
                    }`}>
                      {workflow.status}
                    </span>

                    <div className="flex gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEditWorkflow(workflow)}
                        disabled={!isDeveloper}
                        className={`p-2 transition-colors touch-manipulation ${
                          isDeveloper 
                            ? 'text-slate-400 hover:text-blue-500'
                            : 'text-gray-300 cursor-not-allowed opacity-50'
                        }`}
                        title="Edit Workflow"
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleToggleWorkflowStatus(workflow.id)}
                        disabled={!isDeveloper}
                        className={`p-2 transition-colors touch-manipulation ${
                          isDeveloper 
                            ? 'text-slate-400 hover:text-yellow-500'
                            : 'text-gray-300 cursor-not-allowed opacity-50'
                        }`}
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
                        disabled={!isDeveloper}
                        className={`p-2 transition-colors touch-manipulation ${
                          isDeveloper 
                            ? 'text-slate-400 hover:text-green-500'
                            : 'text-gray-300 cursor-not-allowed opacity-50'
                        }`}
                        title="Duplicate Workflow"
                      >
                        <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        disabled={!isDeveloper}
                        className={`p-2 transition-colors touch-manipulation ${
                          isDeveloper 
                            ? 'text-slate-400 hover:text-red-500'
                            : 'text-gray-300 cursor-not-allowed opacity-50'
                        }`}
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
                    {isDeveloper ? 'No workflows yet' : 'No Workflows Available'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-500 mb-8 max-w-md mx-auto">
                    {isDeveloper 
                      ? 'Create your first workflow to automate agent actions and improve customer experience'
                      : 'Workflows will appear here once you create agents and set up automation flows'
                    }
                  </p>
                  <button
                    onClick={() => setActiveTab('canvas')}
                    disabled={!isDeveloper}
                    className={`${
                      isDeveloper 
                        ? 'common-button-bg rounded-xl px-8 py-3'
                        : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-8 py-3 rounded-xl'
                    }`}
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
                  disabled={!isDeveloper}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm min-w-0 touch-manipulation ${
                    isDeveloper 
                      ? 'common-bg-icons'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  style={{ zIndex: 50 }}
                >
                  <option value="all">All Workflows</option>
                  {workflows.map(workflow => (
                    <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
                  ))}
                </select>
                <button 
                  disabled={!isDeveloper}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm touch-manipulation ${
                    isDeveloper 
                      ? 'common-button-bg'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                  }`}
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {workflows.filter(w => w.runs > 0).map((workflow) => (
                <div key={workflow.id} className="common-bg-icons p-4 sm:p-6 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="common-bg-icons w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400" />
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
                      <span className="common-bg-icons inline-flex px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {workflow.status}
                      </span>
                      <button 
                        disabled={!isDeveloper}
                        className={`p-2 transition-colors touch-manipulation ${
                          isDeveloper 
                            ? 'text-slate-400 hover:text-blue-500'
                            : 'text-gray-300 cursor-not-allowed opacity-50'
                        }`}
                      >
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
                  className="common-bg-icons w-full px-3 py-2 rounded-lg"
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
                  className="common-bg-icons w-full px-3 py-2 rounded-lg resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsCreatingTrigger(false)}
                  className="common-button-bg2 flex-1 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTrigger}
                  disabled={!newTrigger.name.trim() || !newTrigger.description.trim()}
                  className="common-button-bg flex-1 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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