import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { useAgent } from '../contexts/AgentContext';
import { 
  Bot, 
  TrendingUp, 
  Clock, 
  Users, 
  MessageSquare, 
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';

const Overview = () => {
  const { agents } = useAgent();
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Total Agents',
      value: agents.length,
      change: '+2 this month',
      icon: Bot,
      color: 'blue'
    },
    {
      title: 'Calls Today',
      value: '1,247',
      change: '+12% vs yesterday',
      icon: MessageSquare,
      color: 'green'
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: '+2.1% this week',
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      title: 'Avg Response Time',
      value: '1.2s',
      change: '-0.3s improved',
      icon: Clock,
      color: 'purple'
    }
  ];

  const recentActivity = [
    { time: '2 min ago', action: 'Agent "Customer Support Bot" handled 15 calls', status: 'success' },
    { time: '5 min ago', action: 'New workflow "Lead Qualification" activated', status: 'info' },
    { time: '12 min ago', action: 'Knowledge base updated with 3 new documents', status: 'info' },
    { time: '1 hour ago', action: 'Agent "Sales Assistant" published successfully', status: 'success' },
    { time: '2 hours ago', action: 'Billing: Payment processed for $299', status: 'success' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mb-2 break-words max-w-full">
          Welcome back, John! 👋
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 break-words max-w-full">
          Here's what's happening with your AI agents today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <GlassCard key={index} hover>
            <div className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 sm:p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                  <stat.icon className={`w-4 sm:w-6 h-4 sm:h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-xs sm:text-xs text-green-600 dark:text-green-400">
                  {stat.change}
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Active Agents */}
        <GlassCard>
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Active Agents
            </h3>
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Bot className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white">
                        {agent.name}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {agent.language} • {agent.persona}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      agent.status === 'Published' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : agent.status === 'Training'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {agent.status}
                    </span>
                    <Activity className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard>
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' : 
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/agents/create')}
              className="p-3 sm:p-4 text-left bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 rounded-xl transition-all duration-200 border border-blue-200/20 dark:border-blue-700/20 hover:shadow-lg"
            >
              <Bot className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600 dark:text-blue-400 mb-2" />
              <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white">Create New Agent</p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Set up a new AI agent in minutes</p>
            </button>
            
            <button 
              onClick={() => navigate('/monitoring')}
              className="p-3 sm:p-4 text-left bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 rounded-xl transition-all duration-200 border border-green-200/20 dark:border-green-700/20 hover:shadow-lg"
            >
              <MessageSquare className="w-6 sm:w-8 h-6 sm:h-8 text-green-600 dark:text-green-400 mb-2" />
              <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white">View Conversations</p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Monitor recent interactions</p>
            </button>
            
            <button 
              onClick={() => navigate('/settings')}
              className="p-3 sm:p-4 text-left bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 rounded-xl transition-all duration-200 border border-purple-200/20 dark:border-purple-700/20 sm:col-span-2 lg:col-span-1 hover:shadow-lg"
            >
              <Users className="w-6 sm:w-8 h-6 sm:h-8 text-purple-600 dark:text-purple-400 mb-2" />
              <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white">Team Settings</p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Manage users and permissions</p>
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Overview;