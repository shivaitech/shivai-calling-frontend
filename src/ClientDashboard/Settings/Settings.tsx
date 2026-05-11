import { useState, useEffect } from 'react';
import GlassCard from '../../components/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/authAPI';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Key, 
  Users, 
  Save,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Trash2,
  Plus,
  ChevronDown,
  Loader2,
  Check,
  Link2,
  Unlink,
  ChevronRight,
  Phone,
  MessageSquare,
  Mail,
  Zap,
  X
} from 'lucide-react';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [gmailSuccessMsg, setGmailSuccessMsg] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    company: '',
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
    { id: 'accounts', label: 'Accounts', icon: Link2 },
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

  // Detect hash fragment and set active tab
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove the #
    if (hash && ['profile', 'notifications', 'security', 'api', 'team', 'accounts'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Detect ?gmail=connected redirect from Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail') === 'connected') {
      setActiveTab('accounts');
      setAccountStates(prev => ({ ...prev, google: { ...prev.google, connected: true, expanded: false } }));
      setGmailSuccessMsg(true);
      // Clean the query param from the URL without reloading
      const clean = new URL(window.location.href);
      clean.searchParams.delete('gmail');
      window.history.replaceState({}, '', clean.toString());
      const timer = setTimeout(() => setGmailSuccessMsg(false), 6000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await authAPI.getUserProfile();
        if (data?.user) {
          setProfile({
            name: data.user.fullName || user?.fullName || '',
            email: data.user.email || user?.email || '',
            company: data.user.company || '',
            timezone: data.user.timezone || 'Asia/Kolkata',
            language: data.user.language || 'English'
          });
        } else if (user) {
          // Fallback to auth context user
          setProfile({
            name: user.fullName || '',
            email: user.email || '',
            company: '',
            timezone: 'Asia/Kolkata',
            language: 'English'
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // Fallback to auth context user on error
        if (user) {
          setProfile({
            name: user.fullName || '',
            email: user.email || '',
            company: '',
            timezone: 'Asia/Kolkata',
            language: 'English'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await authAPI.updateProfile({
        fullName: profile.name,
        company: profile.company,
        timezone: profile.timezone,
        language: profile.language
      });
      updateUser({ fullName: profile.name, company: profile.company });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = () => {
  };

  // ── Accounts (connected accounts) state ────────────────────────────────────
  type AccountId = 'google' | 'twilio' | 'whatsapp' | 'slack' | 'meta' | 'zapier';
  type AccountState = {
    connected: boolean;
    expanded: boolean;
    fields: Record<string, string>;
  };

  const ACCOUNT_DEFS: {
    id: AccountId;
    name: string;
    description: string;
    color: string;
    bg: string;
    icon: React.ReactNode;
    isOAuth?: boolean;
    comingSoon?: boolean;
    fields: { key: string; label: string; placeholder: string; type?: string }[];
  }[] = [
    {
      id: 'google',
      name: 'Google',
      description: 'Gmail — send emails from your AI agents',
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20',
      isOAuth: true,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <path d="M21.35 11.1H12v2.8h5.35C16.83 16.3 14.67 17.6 12 17.6a5.6 5.6 0 1 1 3.55-9.95l2-2A9 9 0 1 0 21 12c0-.31-.02-.62-.05-.9z" fill="#EA4335"/>
          <path d="M3.15 7.35 5.6 9.2A5.6 5.6 0 0 1 12 6.4a5.57 5.57 0 0 1 3.55 1.25l2-2A9 9 0 0 0 3.15 7.35z" fill="#FBBC05"/>
          <path d="M12 21a9 9 0 0 0 6.06-2.35l-2.8-2.17A5.6 5.6 0 0 1 6.34 13H3.07A9 9 0 0 0 12 21z" fill="#34A853"/>
          <path d="M21.35 11.1H12v2.8h5.35c-.5 1.4-1.5 2.5-2.8 3.25l2.8 2.17C19.67 17.5 21.5 15 21.5 12c0-.31-.05-.61-.15-.9z" fill="#4285F4"/>
        </svg>
      ),
      fields: [],
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'Voice calls & SMS via Twilio',
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: <Phone className="w-5 h-5 text-red-500" />,
      fields: [
        { key: 'accountSid', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
        { key: 'authToken', label: 'Auth Token', placeholder: 'Your Twilio Auth Token', type: 'password' },
        { key: 'phoneNumber', label: 'Phone Number', placeholder: '+1234567890' },
      ],
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'WhatsApp Business API messaging',
      comingSoon: true,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.854L0 24l6.335-1.502A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.587-.5-5.088-1.375L3 21.5l.906-3.787A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
      ),
      fields: [
        { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: 'WhatsApp Phone Number ID' },
        { key: 'accessToken', label: 'Access Token', placeholder: 'Meta Business Access Token', type: 'password' },
        { key: 'verifyToken', label: 'Webhook Verify Token', placeholder: 'Your custom verify token' },
      ],
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team notifications & bot messages',
      comingSoon: true,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
        </svg>
      ),
      fields: [
        { key: 'botToken', label: 'Bot Token', placeholder: 'xoxb-your-bot-token', type: 'password' },
        { key: 'webhookUrl', label: 'Incoming Webhook URL', placeholder: 'https://hooks.slack.com/services/...' },
      ],
    },
    {
      id: 'meta',
      name: 'Meta / Facebook',
      description: 'Facebook Messenger & Instagram DMs',
      comingSoon: true,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
          <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
      ),
      fields: [
        { key: 'appId', label: 'App ID', placeholder: 'Meta App ID' },
        { key: 'appSecret', label: 'App Secret', placeholder: 'Meta App Secret', type: 'password' },
        { key: 'pageAccessToken', label: 'Page Access Token', placeholder: 'Long-lived page access token', type: 'password' },
      ],
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Automate workflows with 5000+ apps',
      comingSoon: true,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      icon: <Zap className="w-5 h-5 text-orange-500" />,
      fields: [
        { key: 'webhookUrl', label: 'Zapier Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...' },
      ],
    },
  ];

  const [accountStates, setAccountStates] = useState<Record<AccountId, AccountState>>(() =>
    Object.fromEntries(
      ACCOUNT_DEFS.map(a => [a.id, { connected: false, expanded: false, fields: Object.fromEntries(a.fields.map(f => [f.key, ''])) }])
    ) as Record<AccountId, AccountState>
  );

  const toggleAccountExpanded = (id: AccountId) => {
    setAccountStates(prev => ({ ...prev, [id]: { ...prev[id], expanded: !prev[id].expanded } }));
  };

  const setAccountField = (id: AccountId, key: string, value: string) => {
    setAccountStates(prev => ({ ...prev, [id]: { ...prev[id], fields: { ...prev[id].fields, [key]: value } } }));
  };

  const connectAccount = (id: AccountId) => {
    setAccountStates(prev => ({ ...prev, [id]: { ...prev[id], connected: true, expanded: false } }));
  };

  const handleConnectGmail = () => {
    setGmailConnecting(true);
    authAPI.connectGmail(); // navigates away; no async needed
  };

  const disconnectAccount = (id: AccountId) => {
    const emptyFields = Object.fromEntries(ACCOUNT_DEFS.find(a => a.id === id)!.fields.map(f => [f.key, '']));
    setAccountStates(prev => ({ ...prev, [id]: { connected: false, expanded: false, fields: emptyFields } }));
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
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

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="common-bg-icons w-full px-4 py-3 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="common-bg-icons w-full px-4 py-3 rounded-xl text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-75"
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
                        placeholder="Enter your company name"
                        className="common-bg-icons w-full px-4 py-3 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
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
                          className="common-bg-icons w-full px-4 py-3 rounded-xl text-sm text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none pr-10 cursor-pointer"
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
                          className="common-bg-icons w-full px-4 py-3 rounded-xl text-sm text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none pr-10 cursor-pointer"
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
                        className="common-bg-icons flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm border border-slate-200 dark:border-slate-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      >
                        <Globe className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <span className="text-slate-800 dark:text-white">
                          {isDark ? 'Dark Mode' : 'Light Mode'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="common-button-bg flex items-center gap-2 px-6 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : saveSuccess ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
                    </button>
                  </div>
                </>
              )}
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

          {activeTab === 'accounts' && (
            <div className="space-y-4">
              {gmailSuccessMsg && (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium flex-1">Gmail connected successfully! Your AI agents can now send emails.</p>
                  <button onClick={() => setGmailSuccessMsg(false)} className="text-green-500 hover:text-green-700 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Connected Accounts</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Connect third-party services to power your AI agents.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ACCOUNT_DEFS.map(def => {
                  const state = accountStates[def.id];
                  const allFilled = def.fields.every(f => state.fields[f.key]?.trim());
                  return (
                    <div key={def.id} className="common-bg-icons rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {/* Header row */}
                      <div className="flex items-center gap-3 p-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${def.bg}`}>
                          {def.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 dark:text-white text-sm">{def.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{def.description}</p>
                        </div>
                        {state.connected ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                              <Check className="w-3 h-3" /> Connected
                            </span>
                            <button
                              onClick={() => disconnectAccount(def.id)}
                              title="Disconnect"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          </div>
                        ) : def.comingSoon ? (
                          <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed flex-shrink-0">
                            Coming Soon
                          </span>
                        ) : def.isOAuth ? (
                          <button
                            onClick={handleConnectGmail}
                            disabled={gmailConnecting}
                            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                          >
                            {gmailConnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                            {gmailConnecting ? 'Connecting...' : 'Connect Gmail'}
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleAccountExpanded(def.id)}
                            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0"
                          >
                            {state.expanded ? <X className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                            {state.expanded ? 'Cancel' : 'Connect'}
                          </button>
                        )}
                      </div>

                      {/* Expandable credential form */}
                      {state.expanded && !state.connected && (
                        <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-slate-50/60 dark:bg-slate-800/40">
                          {def.fields.map(field => (
                            <div key={field.key}>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{field.label}</label>
                              <input
                                type={field.type || 'text'}
                                value={state.fields[field.key]}
                                onChange={e => setAccountField(def.id, field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white placeholder:text-slate-400"
                              />
                            </div>
                          ))}
                          <button
                            onClick={() => connectAccount(def.id)}
                            disabled={!allFilled}
                            className="w-full mt-1 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                          >
                            <Link2 className="w-3.5 h-3.5" /> Connect {def.name}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}


        </div>
      </GlassCard>
    </div>
  );
};

export default Settings;