import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { isDeveloperUser } from '../lib/utils';
import Slider from 'react-slick';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  MessageSquare, 
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Filter,
  Search,
  ChevronDown,
  X,
  Play,
  Pause,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';

const Monitoring = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Check if current user is developer
  const isDeveloper = isDeveloperUser(user?.email);

  const stats = isDeveloper ? [
    {
      title: 'Calls Today',
      value: '247',
      change: '+12%',
      trend: 'up',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Avg Duration',
      value: '3m 24s',
      change: '-15s',
      trend: 'down',
      icon: Clock,
      color: 'purple'
    },
    {
      title: 'Active Users',
      value: '1,847',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'orange'
    }
  ] : [
    {
      title: 'Calls Today',
      value: '0',
      change: 'No data',
      trend: 'neutral',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      title: 'Success Rate',
      value: '0%',
      change: 'No data',
      trend: 'neutral',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Avg Duration',
      value: '0s',
      change: 'No data',
      trend: 'neutral',
      icon: Clock,
      color: 'purple'
    },
    {
      title: 'Active Users',
      value: '0',
      change: 'No data',
      trend: 'neutral',
      icon: Users,
      color: 'orange'
    }
  ];

  const topIntents = isDeveloper ? [
    { name: 'Pricing Inquiry', count: 89, percentage: 36 },
    { name: 'Product Demo', count: 67, percentage: 27 },
    { name: 'Support Request', count: 45, percentage: 18 },
    { name: 'Booking Request', count: 32, percentage: 13 },
    { name: 'General Info', count: 15, percentage: 6 }
  ] : [];

  const recentConversations = isDeveloper ? [
    {
      id: 1,
      time: '2 min ago',
      agent: 'Customer Support Bot',
      caller: 'User-****7892',
      outcome: 'Success',
      duration: '4m 12s',
      intent: 'Pricing Inquiry',
      location: 'Ghaziabad, Uttar Pradesh (India)',
      callId: 'f6faa345-d538-4da3-a8f4-f9e31d9996e2',
      timestamp: 'Nov 9, 2025, 08:54 AM',
      transcript: [
        { speaker: 'SHIVAI ASSISTANT', time: '08:54:24', text: 'Hello, I am Shivai from call Shiv AI, how can I assist you today?' },
        { speaker: 'SHIVAI ASSISTANT', time: '08:54:33', text: 'नमस्ते बताइए, मैं आपकी किस तरह मदद कर सकती हूँ?' },
        { speaker: 'CUSTOMER', time: '08:54:33', text: 'Hi' }
      ],
      recordingUrl: 'https://example.com/recording1.mp3' // Mock URL
    },
    {
      id: 2,
      time: '5 min ago',
      agent: 'Sales Assistant',
      caller: 'User-****3456',
      outcome: 'Success',
      duration: '2m 45s',
      intent: 'Product Demo',
      location: 'Mumbai, Maharashtra (India)',
      callId: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
      timestamp: 'Nov 9, 2025, 08:51 AM',
      transcript: [
        { speaker: 'SHIVAI ASSISTANT', time: '08:51:10', text: 'Hi! This is Sarah from ShivAI. How can I help you today?' },
        { speaker: 'CUSTOMER', time: '08:51:15', text: 'I want to know about your product' },
        { speaker: 'SHIVAI ASSISTANT', time: '08:51:18', text: 'I\'d be happy to show you our AI calling platform features.' }
      ],
      recordingUrl: 'https://example.com/recording2.mp3'
    },
    {
      id: 3,
      time: '8 min ago',
      agent: 'Customer Support Bot',
      caller: 'User-****9012',
      outcome: 'Failed',
      duration: '1m 23s',
      intent: 'Support Request',
      location: 'Bangalore, Karnataka (India)',
      callId: 'z9y8x7w6-v5u4-t3s2-r1q0-p9o8n7m6l5k4',
      timestamp: 'Nov 9, 2025, 08:48 AM',
      transcript: [
        { speaker: 'SHIVAI ASSISTANT', time: '08:48:05', text: 'Hello, how can I help you?' },
        { speaker: 'CUSTOMER', time: '08:48:10', text: 'I need technical support' },
        { speaker: 'SHIVAI ASSISTANT', time: '08:48:12', text: 'I can help with that. What seems to be the issue?' }
      ],
      recordingUrl: 'https://example.com/recording3.mp3'
    },
    {
      id: 4,
      time: '12 min ago',
      agent: 'Sales Assistant',
      caller: 'User-****5678',
      outcome: 'Success',
      duration: '6m 18s',
      intent: 'Booking Request',
      location: 'Delhi, NCR (India)',
      callId: 'q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6',
      timestamp: 'Nov 9, 2025, 08:44 AM',
      transcript: [
        { speaker: 'SHIVAI ASSISTANT', time: '08:44:20', text: 'Hello! I can help you with booking. What would you like to schedule?' },
        { speaker: 'CUSTOMER', time: '08:44:25', text: 'I want to book a demo' },
        { speaker: 'SHIVAI ASSISTANT', time: '08:44:28', text: 'Great! Let me help you schedule a demo session.' }
      ],
      recordingUrl: 'https://example.com/recording4.mp3'
    },
    {
      id: 5,
      time: '15 min ago',
      agent: 'Customer Support Bot',
      caller: 'User-****2345',
      outcome: 'Success',
      duration: '3m 56s',
      intent: 'General Info',
      location: 'Pune, Maharashtra (India)',
      callId: 'h6g5f4d3-s2a1-z0x9-c8v7-b6n5m4l3k2j1',
      timestamp: 'Nov 9, 2025, 08:41 AM',
      transcript: [
        { speaker: 'SHIVAI ASSISTANT', time: '08:41:15', text: 'Hi! How can I assist you today?' },
        { speaker: 'CUSTOMER', time: '08:41:20', text: 'Tell me about your services' },
        { speaker: 'SHIVAI ASSISTANT', time: '08:41:22', text: 'We provide AI-powered calling solutions for businesses.' }
      ],
      recordingUrl: 'https://example.com/recording5.mp3'
    }
  ] : [];

  const callTimeline = isDeveloper ? [
    { hour: '00:00', calls: 12 },
    { hour: '01:00', calls: 8 },
    { hour: '02:00', calls: 5 },
    { hour: '03:00', calls: 3 },
    { hour: '04:00', calls: 7 },
    { hour: '05:00', calls: 15 },
    { hour: '06:00', calls: 28 },
    { hour: '07:00', calls: 45 },
    { hour: '08:00', calls: 67 },
    { hour: '09:00', calls: 89 },
    { hour: '10:00', calls: 92 },
    { hour: '11:00', calls: 78 },
    { hour: '12:00', calls: 85 },
    { hour: '13:00', calls: 76 },
    { hour: '14:00', calls: 82 },
    { hour: '15:00', calls: 94 },
    { hour: '16:00', calls: 87 },
    { hour: '17:00', calls: 73 },
    { hour: '18:00', calls: 56 },
    { hour: '19:00', calls: 42 },
    { hour: '20:00', calls: 35 },
    { hour: '21:00', calls: 28 },
    { hour: '22:00', calls: 19 },
    { hour: '23:00', calls: 14 }
  ] : [
    { hour: '00:00', calls: 0 },
    { hour: '01:00', calls: 0 },
    { hour: '02:00', calls: 0 },
    { hour: '03:00', calls: 0 },
    { hour: '04:00', calls: 0 },
    { hour: '05:00', calls: 0 },
    { hour: '06:00', calls: 0 },
    { hour: '07:00', calls: 0 },
    { hour: '08:00', calls: 0 },
    { hour: '09:00', calls: 0 },
    { hour: '10:00', calls: 0 },
    { hour: '11:00', calls: 0 },
    { hour: '12:00', calls: 0 },
    { hour: '13:00', calls: 0 },
    { hour: '14:00', calls: 0 },
    { hour: '15:00', calls: 0 },
    { hour: '16:00', calls: 0 },
    { hour: '17:00', calls: 0 },
    { hour: '18:00', calls: 0 },
    { hour: '19:00', calls: 0 },
    { hour: '20:00', calls: 0 },
    { hour: '21:00', calls: 0 },
    { hour: '22:00', calls: 0 },
    { hour: '23:00', calls: 0 }
  ];

  const maxCalls = Math.max(...callTimeline.map(item => item.calls)) || 1;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Mobile-First Header - App-like compact design */}
      <div className="mb-4 sm:mb-6 px-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          

          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 sm:px-4 py-2 bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm appearance-none pr-10 touch-manipulation min-w-0"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <button 
              disabled={!isDeveloper}
              className={`flex items-center justify-center gap-1 sm:gap-2 touch-manipulation ${
                isDeveloper 
                  ? 'common-button-bg'
                  : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-3 sm:px-4 py-2 rounded-lg'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section - Mobile Slider, Desktop Grid */}
      <div className="stats-section">
        {/* Mobile Slider (sm and below) */}
        <div className="block sm:hidden">
          <Slider
            dots={true}
            infinite={false}
            speed={300}
            slidesToShow={2.2}
            slidesToScroll={1}
            swipeToSlide={true}
            touchThreshold={10}
            arrows={false}
            className="mobile-stats-slider"
            customPaging={() => (
              <div className="w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-600 transition-colors duration-200"></div>
            )}
            dotsClass="slick-dots !bottom-[-20px] !flex !justify-center !gap-2"
          >
            {stats.map((stat, index) => (
              <div key={index} className="px-1">
                <GlassCard hover>
                  <div className="p-3 min-h-[110px]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-1.5 rounded-lg common-bg-icons">
                        <stat.icon className={`w-4 h-4 ${
                          stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                          stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                          stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                          'text-orange-600 dark:text-orange-400'
                        }`} />
                      </div>
                      <TrendingUp className={`w-2.5 h-2.5 ${
                        stat.trend === 'up' ? 'text-green-500' : 'text-red-500 rotate-180'
                      }`} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800 dark:text-white mb-1">
                        {stat.value}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 leading-tight">
                        {stat.title}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 leading-tight">
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            ))}
          </Slider>
        </div>

        {/* Desktop Grid (sm and above) */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat, index) => (
            <GlassCard key={index} hover>
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 sm:p-3 rounded-xl common-bg-icons">
                    <stat.icon className={`w-4 sm:w-6 h-4 sm:h-6 ${
                      stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                      'text-orange-600 dark:text-orange-400'
                    }`} />
                  </div>
                  <div className={`flex items-center gap-1 ${
                    stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <TrendingUp className={`w-3 sm:w-4 h-3 sm:h-4 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">{stat.change}</span>
                  </div>
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Call Timeline - Mobile Optimized */}
        <div className="xl:col-span-2">
          <GlassCard>
            <div className="p-3 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
                Call Timeline (24h)
              </h3>
              {!isDeveloper || maxCalls === 1 ? (
                <div className="h-40 sm:h-48 lg:h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-1">No call data available</p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500">
                      Timeline will appear here once agents start handling calls
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-40 sm:h-48 lg:h-64 flex items-end justify-between gap-0.5 sm:gap-1 overflow-x-auto touch-manipulation">
                  {callTimeline.map((item, index) => (
                    <div key={index} className="flex flex-col items-center group">
                      <div
                        className="w-1.5 sm:w-2 lg:w-3 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-colors cursor-pointer touch-manipulation"
                        style={{ height: `${(item.calls / maxCalls) * 120}px` }}
                        title={`${item.hour}: ${item.calls} calls`}
                      ></div>
                      {index % 6 === 0 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 rotate-45 origin-left">
                          {item.hour}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Mobile scroll indicator */}
              {isDeveloper && maxCalls > 1 && (
                <div className="block sm:hidden text-center mt-3">
                  <p className="text-xs text-slate-400">Swipe to see more data →</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Top Intents - Mobile Optimized */}
        <GlassCard>
          <div className="p-3 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
              Top Intents
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {topIntents.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">No intent data available</p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-1">
                    Data will appear here once agents start handling calls
                  </p>
                </div>
              ) : (
                topIntents.map((intent, index) => (
                  <div key={index} className="flex items-center justify-between touch-manipulation">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white truncate pr-2">
                          {intent.name}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">
                          {intent.count}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${intent.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Outcomes Overview - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <GlassCard>
          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
              Call Outcomes
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative w-36 h-36 sm:w-48 sm:h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  {isDeveloper && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${94.2 * 2.51} ${(100 - 94.2) * 2.51}`}
                      className="text-green-500"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                      {isDeveloper ? '94.2%' : '0%'}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Success</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Success ({isDeveloper ? '233' : '0'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Failed ({isDeveloper ? '14' : '0'})
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
              Performance Metrics
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg touch-manipulation">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Avg Response Time</span>
                <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">
                  {isDeveloper ? '1.2s' : '0s'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg touch-manipulation">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Resolution Rate</span>
                <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">
                  {isDeveloper ? '87.3%' : '0%'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg touch-manipulation">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Customer Satisfaction</span>
                <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">
                  {isDeveloper ? '4.6/5' : '0/5'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg touch-manipulation">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Escalation Rate</span>
                <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">
                  {isDeveloper ? '3.2%' : '0%'}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Recent Conversations - Mobile Optimized */}
      <GlassCard>
        <div className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
              Recent Conversations
            </h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  disabled={!isDeveloper}
                  className={`pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm w-full touch-manipulation ${
                    isDeveloper 
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>
              <button 
                disabled={!isDeveloper}
                className={`flex items-center justify-center gap-2 touch-manipulation ${
                  isDeveloper 
                    ? 'common-button-bg2'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50 px-3 py-2 rounded-lg'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filter</span>
              </button>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-3">
            {recentConversations.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-2 sm:mb-3" />
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">No conversations yet</p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-1">
                  Recent conversations will appear here once agents start taking calls
                </p>
              </div>
            ) : (
              recentConversations.map((conversation) => (
              <div key={conversation.id} className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {conversation.outcome === 'Success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${
                        conversation.outcome === 'Success' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {conversation.outcome}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {conversation.time}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                      {conversation.agent}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {conversation.caller} • {conversation.duration}
                    </p>
                  </div>
                  <button className="flex items-center gap-1 common-button-bg2 rounded-md text-xs touch-manipulation"
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    {conversation.intent}
                  </span>
                </div>
              </div>
              ))
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Agent</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Caller</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Intent</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Outcome</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Duration</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentConversations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-base text-slate-600 dark:text-slate-400 mb-1">No conversations yet</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        Recent conversations will appear here once agents start taking calls
                      </p>
                    </td>
                  </tr>
                ) : (
                  recentConversations.map((conversation) => (
                  <tr key={conversation.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                      {conversation.time}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 dark:text-white text-sm">
                        {conversation.agent}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                      {conversation.caller}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                        {conversation.intent}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {conversation.outcome === 'Success' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          conversation.outcome === 'Success' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {conversation.outcome}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                      {conversation.duration}
                    </td>
                    <td className="py-3 px-4">
                      <button className="flex items-center gap-1 common-button-bg2 rounded-lg text-sm touch-manipulation"
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 -top-8 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col my-auto">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 common-bg-icons rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white truncate">
                      Session Transcript
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      ID: {selectedConversation.callId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedConversation(null);
                    setIsPlaying(false);
                  }}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Session Info in Header */}
              <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 truncate">
                    {selectedConversation.location}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 truncate">
                    {selectedConversation.timestamp}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 truncate">
                    {selectedConversation.duration}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Call Recording Player */}
              <div className="common-bg-icons p-3 sm:p-4 rounded-lg sm:rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                    Call Recording
                  </h3>
                  <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${
                    selectedConversation.outcome === 'Success'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {selectedConversation.outcome}
                  </span>
                </div>

                {/* Audio Player */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200/50 dark:border-blue-700/30">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex-shrink-0"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white truncate">
                          {selectedConversation.agent}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex-shrink-0 ml-2">
                          {selectedConversation.duration}
                        </span>
                      </div>
                      <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-1.5 sm:h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                          style={{ width: isPlaying ? '45%' : '0%' }}
                        ></div>
                      </div>
                    </div>

                    <button className="p-1.5 sm:p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors flex-shrink-0">
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Conversation Transcript */}
              <div className="common-bg-icons p-3 sm:p-4 rounded-lg sm:rounded-xl">
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-3">
                  Conversation Transcript
                </h3>
                <div className="space-y-1 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2">
                    Conversation started at {selectedConversation.timestamp}
                  </p>
                  
                  {selectedConversation.transcript.map((message: any, index: number) => (
                    <div key={index} className="flex flex-col gap-1.5 py-1.5 sm:py-2">
                      {message.speaker === 'CUSTOMER' ? (
                        <>
                          <div className="flex-1"></div>
                          <div className="flex items-start gap-1.5 sm:gap-2 flex-1">
                            <div className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 sm:px-4 sm:py-3 shadow-sm">
                              <p className="text-xs sm:text-sm">{message.text}</p>
                              <span className="text-xs opacity-75 mt-1 block">
                                {message.speaker} • {message.time}
                              </span>
                            </div>
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
                              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-start gap-1.5 sm:gap-2 flex-1">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div className="flex-1 common-bg-icons rounded-2xl rounded-tl-sm px-3 py-2 sm:px-4 sm:py-3 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs sm:text-sm text-slate-800 dark:text-white">{message.text}</p>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                              {message.speaker} • {message.time}
                            </span>
                          </div>
                          <div className="flex-1"></div>
                        </div>
                      )}
                    </div>
                  ))}

                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Updated: {selectedConversation.timestamp}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="common-bg-icons p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Agent</p>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white truncate">
                    {selectedConversation.agent}
                  </p>
                </div>
                <div className="common-bg-icons p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Caller</p>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white truncate">
                    {selectedConversation.caller}
                  </p>
                </div>
                <div className="common-bg-icons p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Intent</p>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white truncate">
                    {selectedConversation.intent}
                  </p>
                </div>
                <div className="common-bg-icons p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Time</p>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white truncate">
                    {selectedConversation.time}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setSelectedConversation(null);
                  setIsPlaying(false);
                }}
                className="flex-1 common-button-bg2 text-sm sm:text-base"
              >
                Close
              </button>
              <button className="flex-1 common-button-bg flex items-center justify-center gap-2 text-sm sm:text-base">
                <Download className="w-4 h-4" />
                Export Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;