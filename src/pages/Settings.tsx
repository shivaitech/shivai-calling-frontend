import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Key, 
  Users, 
  Webhook,
  Save,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Trash2,
  Plus,
  ChevronDown
} from 'lucide-react';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);

  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@company.com',
    company: 'Acme Corp',
    timezone: 'Asia/Kolkata',
    language: 'English'
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    webhookFailures: true,
    weeklyReports: true,
    systemUpdates: true
  });

  const apiKeys = [
    {
      id: 1,
      name: 'Production API Key',
      key: 'sk_live_1234567890abcdef',
      created: '2024-01-15',
      lastUsed: '2 hours ago',
      permissions: ['read', 'write']
    },
    {
      id: 2,
      name: 'Development API Key',
      key: 'sk_test_abcdef1234567890',
      created: '2024-01-10',
      lastUsed: '1 day ago',
      permissions: ['read']
    }
  ];

  const teamMembers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@company.com',
      role: 'Admin',
      status: 'Active',
      lastActive: '2 hours ago'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      role: 'Editor',
      status: 'Active',
      lastActive: '1 day ago'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      role: 'Viewer',
      status: 'Invited',
      lastActive: 'Never'
    }
  ];

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: Webhook }
  ];

  const timezones = [
    'Asia/Kolkata',
    'Asia/Dubai',
    'Europe/London',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Singapore',
    'Australia/Sydney'
  ];

  const languages = [
    'English',
    'Hindi',
    'Spanish',
    'French',
    'German',
    'Chinese',
    'Japanese',
    'Arabic'
  ];

  const roles = ['Admin', 'Editor', 'Viewer'];

  const handleSaveProfile = () => {
    // Save profile logic
    console.log('Profile saved:', profile);
  };

  const handleSaveNotifications = () => {
    // Save notifications logic
    console.log('Notifications saved:', notifications);
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    // Show toast notification
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
    

      {/* Tab Navigation */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div className="flex space-x-1 common-bg-icons rounded-xl p-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'common-button-bg2'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="text-xs sm:text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Tab Content */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Profile Settings
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="common-bg-icons w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="common-bg-icons w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    className="common-bg-icons w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Timezone
                  </label>
                  <div className="relative">
                    <select
                      value={profile.timezone}
                      onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                      className="common-bg-icons w-full appearance-none pr-10"
                    >
                      {timezones.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Language
                  </label>
                  <div className="relative">
                    <select
                      value={profile.language}
                      onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                      className="common-bg-icons w-full appearance-none pr-10"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Theme
                  </label>
                  <button
                    onClick={toggleTheme}
                    className="common-bg-icons flex items-center gap-3 w-full"
                  >
                    <Globe className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span className="text-slate-800 dark:text-white">
                      {isDark ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  className="common-button-bg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Notification Preferences
              </h3>

              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 common-bg-icons rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {key === 'emailAlerts' && 'Receive email notifications for important events'}
                        {key === 'smsAlerts' && 'Get SMS alerts for critical issues'}
                        {key === 'webhookFailures' && 'Notify when webhook deliveries fail'}
                        {key === 'weeklyReports' && 'Weekly summary of your agent performance'}
                        {key === 'systemUpdates' && 'Updates about new features and maintenance'}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [key]: !value })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        value ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-0.5'
                      }`}></div>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotifications}
                  className="common-button-bg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Security Settings
              </h3>

              <div className="space-y-4">
                <div className="p-4 common-bg-icons rounded-xl">
                  <h4 className="font-medium text-slate-800 dark:text-white mb-2">
                    Change Password
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Update your password to keep your account secure
                  </p>
                  <button className="common-button-bg">
                    Change Password
                  </button>
                </div>

                <div className="p-4 common-bg-icons rounded-xl">
                  <h4 className="font-medium text-slate-800 dark:text-white mb-2">
                    Two-Factor Authentication
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <button className="common-button-bg">
                    Enable 2FA
                  </button>
                </div>

                <div className="p-4 common-bg-icons rounded-xl">
                  <h4 className="font-medium text-slate-800 dark:text-white mb-2">
                    Active Sessions
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Manage your active login sessions
                  </p>
                  <button className="common-button-bg">
                    View Sessions
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  API Keys
                </h3>
                <button className="common-button-bg flex items-center gap-2 justify-center sm:justify-start w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  <span>Create API Key</span>
                </button>
              </div>

              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="p-4 common-bg-icons rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 dark:text-white truncate">
                          {apiKey.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Created {apiKey.created} • Last used {apiKey.lastUsed}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => copyApiKey(apiKey.key)}
                          className="common-bg-icons p-2 w-9 h-9 flex items-center justify-center rounded-lg touch-manipulation"
                        >
                          <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button className="common-bg-icons p-2 w-9 h-9 flex items-center justify-center rounded-lg touch-manipulation">
                          <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button className="common-bg-icons p-2 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-manipulation">
                          <Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 common-bg-icons rounded-lg p-3 font-mono text-xs sm:text-sm overflow-hidden">
                        <span className="break-all">
                          {showApiKey ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="common-bg-icons p-2 w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 touch-manipulation"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4 text-slate-600 dark:text-slate-400" /> : <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {apiKey.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Team Members
                </h3>
                <button className="common-button-bg flex items-center gap-2 justify-center sm:justify-start w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  <span>Invite Member</span>
                </button>
              </div>

              {/* Mobile-first team member cards */}
              <div className="block sm:hidden space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="common-bg-icons rounded-xl p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 dark:text-white">
                            {member.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 break-all">
                            {member.email}
                          </p>
                        </div>
                        <button className="common-bg-icons p-2 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-manipulation">
                          <Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-red-500" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <select
                              value={member.role}
                              className="common-bg-icons text-sm appearance-none pr-8 w-24"
                            >
                              {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.status === 'Active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {member.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {member.lastActive}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                        Member
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                        Last Active
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">
                              {member.name}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {member.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative">
                            <select
                              value={member.role}
                              className="common-bg-icons text-sm appearance-none pr-8"
                            >
                              {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.status === 'Active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {member.lastActive}
                        </td>
                        <td className="py-3 px-4">
                          <button className="common-bg-icons p-2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Integrations
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 common-bg-icons rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 common-bg-icons rounded-lg flex items-center justify-center">
                        <Webhook className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-white">WhatsApp</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Send messages via WhatsApp</p>
                      </div>
                    </div>
                    <button className="common-button-bg text-sm">
                      Connected
                    </button>
                  </div>
                </div>

                <div className="p-4 common-bg-icons rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 common-bg-icons rounded-lg flex items-center justify-center">
                        <Webhook className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-white">Slack</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Team notifications</p>
                      </div>
                    </div>
                    <button className="common-button-bg2 text-sm">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="p-4 common-bg-icons rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 common-bg-icons rounded-lg flex items-center justify-center">
                        <Webhook className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-white">Zapier</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Workflow automation</p>
                      </div>
                    </div>
                    <button className="common-button-bg2 text-sm">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="p-4 common-bg-icons rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 common-bg-icons rounded-lg flex items-center justify-center">
                        <Webhook className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-white">Google Calendar</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Schedule meetings</p>
                      </div>
                    </div>
                    <button className="common-button-bg2 text-sm">
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default Settings;