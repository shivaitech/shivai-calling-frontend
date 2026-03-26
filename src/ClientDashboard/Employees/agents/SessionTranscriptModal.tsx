import { useState, useEffect, useRef } from 'react';
import { X, FileText, Clock, MapPin, Calendar, Users, MessageSquare, Loader2, Bot, Play, Pause, Download, Volume2, VolumeX, SkipBack, SkipForward, TrendingUp, CheckCircle, XCircle, Phone, Mail, Share2 } from "lucide-react";
import { agentAPI } from '../../../services/agentAPI';
import appToast from '../../../components/AppToast';

interface SessionTranscriptModalProps {
  session: any;
  onClose: () => void;
}

const SessionTranscriptModal = ({ session, onClose }: SessionTranscriptModalProps) => {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'transcripts' | 'recording'>('transcripts');
  
  // Call summary state
  const [callSummary, setCallSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  
  // Location state
  const [locationData, setLocationData] = useState<any>(null);
  const [ipLocationCache, setIpLocationCache] = useState<any>({});
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Function to resolve IP to location
  const resolveIPLocation = async (ip: string) => {
    // Check if IP is valid
    if (!ip || ip === "Unknown" || ip === "N/A") {
      return {
        city: "Unknown",
        region: "",
        country: "Unknown",
        countryCode: "",
        isp: "Unknown ISP",
        lat: null,
        lon: null,
        timezone: "",
      };
    }

    // Check cache first
    if (ipLocationCache[ip]) {
      return ipLocationCache[ip];
    }

    try {
      // Use HTTPS endpoint with CORS support
      const response = await fetch(
        `https://ipapi.co/${ip}/json/`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // ipapi.co response format
      const result = {
        city: data.city || "Unknown",
        region: data.region || "",
        country: data.country_name || "Unknown",
        countryCode: data.country_code || "",
        zip: data.postal || "",
        isp: data.org || "Unknown ISP",
        lat: data.latitude || null,
        lon: data.longitude || null,
        timezone: data.timezone || "",
        as: data.asn || "",
      };

      // Cache the result
      setIpLocationCache((prev: any) => ({
        ...prev,
        [ip]: result,
      }));

      return result;
    } catch (error) {
      console.error(`Error resolving IP location for ${ip}:`, error);
      
      // Return a default response with Unknown values instead of failing
      const defaultResponse = {
        city: "Unknown",
        region: "",
        country: "Unknown",
        countryCode: "",
        isp: "Unknown ISP",
        lat: null,
        lon: null,
        timezone: "",
      };

      // Cache the error response to avoid repeated failed requests
      setIpLocationCache((prev: any) => ({
        ...prev,
        [ip]: defaultResponse,
      }));

      return defaultResponse;
    }
  };

  useEffect(() => {
    const fetchTranscripts = async () => {
      // If transcripts are already embedded in the session object, use them directly
      if (Array.isArray(session?.transcripts) && session.transcripts.length > 0) {
        setTranscripts(session.transcripts);
        setLoading(false);
        return;
      }

      // Resolve the session identifier — API may return id, call_id, or session_id
      const sessionId = session?.session_id || session?.id || session?.call_id;
      if (!sessionId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await agentAPI.getSessionTranscripts(sessionId);
        setTranscripts(data.transcripts || []);
      } catch (err: any) {
        console.error('Failed to fetch transcripts:', err);
        setError(err.message || 'Failed to load transcripts');
      } finally {
        setLoading(false);
      }
    };

    const fetchCallSummary = async () => {
      if (!session?.agent?.id && !session?.agent_id) return;
      
      setSummaryLoading(true);
      setSummaryError(null);
      
      try {
        const agentId = session.agent?.id || session.agent_id;
        const data = await agentAPI.getCallSummary(agentId);
        setCallSummary(data);
      } catch (err: any) {
        console.error('Failed to fetch call summary:', err);
        setSummaryError(err.message || 'Failed to load call summary');
      } finally {
        setSummaryLoading(false);
      }
    };

    // 🧹 Prevent background scrolling when modal is open
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    fetchTranscripts();
    fetchCallSummary();

    // 🧹 Cleanup: Restore scrolling on modal close
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, scrollY);
      }
    };
  }, [session]);

  // Resolve IP to location when session IP changes
  useEffect(() => {
    const fetchLocation = async () => {
      const ip = session?.user_ip || session?.ip;
      if (!ip) return;

      try {
        const location = await resolveIPLocation(ip);
        setLocationData(location);
      } catch (error) {
        console.error('Failed to resolve location:', error);
      }
    };

    fetchLocation();
  }, [session?.user_ip, session?.ip]);

  // Audio player handlers
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const handleDownload = async () => {
    const recordingUrl = session?.recording?.url;
    if (!recordingUrl) {
      appToast.error('Recording not available for download');
      return;
    }

    try {
      appToast.info('Downloading recording...');
      
      // Fetch the file as a blob
      const response = await fetch(recordingUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch recording');
      }
      
      const blob = await response.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `recording-${session.session_id || session.id}.mp3`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      appToast.success('Recording downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      appToast.error('Failed to download recording');
    }
  };

  const handleShare = async () => {
    const recordingUrl = session?.recording?.url;
    if (!recordingUrl) {
      appToast.error('Recording not available for sharing');
      return;
    }

    const shareData = {
      title: `Call Recording - ${session.session_id || session.id}`,
      text: `Listen to this call recording from ${session.start_time ? new Date(session.start_time).toLocaleDateString() : 'ShivAI'}`,
      url: recordingUrl
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(recordingUrl);
        appToast.success('Recording URL copied to clipboard');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        // Fallback to clipboard if share was cancelled or failed
        try {
          await navigator.clipboard.writeText(recordingUrl);
          appToast.success('Recording URL copied to clipboard');
        } catch {
          appToast.error('Failed to share recording');
        }
      }
    }
  };

  const formatTimeDisplay = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session) return null;

  // Format duration
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0m 0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateTime = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 -top-8 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 sm:w-10 sm:h-10 common-bg-icons rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-lg font-semibold text-slate-800 dark:text-white truncate">
                  Session Transcript
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                  {session.session_id || session.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Session Info in Header */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 min-w-0 bg-slate-50 dark:bg-slate-900/30 px-1.5 sm:px-2 py-1.5 rounded-md">
              <Clock className="w-3 h-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Date & Time</p>
                <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 truncate block">
                  {session.start_time ? new Date(session.start_time).toLocaleString('en-US', { 
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit'
                  }) : 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 min-w-0 bg-slate-50 dark:bg-slate-900/30 px-1.5 sm:px-2 py-1.5 rounded-md">
              <MapPin className="w-3 h-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Location</p>
                <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 truncate block">
                  {(() => {
                    // First try resolved location data
                    if (locationData?.city && locationData.city !== 'Unknown') {
                      const city = locationData.city;
                      const country = locationData.country;
                      return [city, country].filter((x: string) => x && x !== 'Unknown').join(', ') || 'Unknown';
                    }
                    // Fallback to session location
                    const city = session?.location?.city?.toLowerCase() !== 'unknown' ? session?.location?.city : '';
                    const country = session?.location?.country?.toLowerCase() !== 'unknown' ? session?.location?.country : '';
                    const locationLabel = [city, country].filter(Boolean).join(', ');
                    return locationLabel || 'Unknown';
                  })()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 min-w-0 col-span-2 sm:col-span-1 bg-slate-50 dark:bg-slate-900/30 px-1.5 sm:px-2 py-1.5 rounded-md">
              <Phone className="w-3 h-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Device • Duration</p>
                <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 truncate block">
                  {session.device?.deviceType || session.device?.device_type || session.device?.browser || 'Unknown'} • {formatDuration(session.duration_seconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
            <button
              onClick={() => setActiveTab('transcripts')}
              className={`flex-1 px-2 sm:px-3 py-2 text-[11px] sm:text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'transcripts'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              <span className="hidden xs:inline">Call </span>Transcripts
            </button>
            <button
              onClick={() => setActiveTab('recording')}
              className={`flex-1 px-2 sm:px-3 py-2 text-[11px] sm:text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'recording'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              <span className="hidden xs:inline">Recording & </span>Summary
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {/* Tab Content: Call Transcripts */}
          {activeTab === 'transcripts' && (
          <div className="common-bg-icons p-3 sm:p-4 rounded-lg sm:rounded-xl">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-3">
              Conversation Transcript
            </h3>
            <div className="space-y-1 max-h-[250px] sm:max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-red-300 dark:text-red-600 mx-auto mb-3" />
                  <p className="text-xs sm:text-sm text-red-500 dark:text-red-400">
                    {error}
                  </p>
                </div>
              ) : transcripts && transcripts.length > 0 ? (
                <>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2">
                    Conversation started on {formatDateTime(session.start_time)}
                  </p>
                  
                  {transcripts.map((transcript: any, index: number) => (
                    <div key={index} className="flex flex-col gap-1.5 py-1.5 sm:py-2">
                      {transcript.role === 'user' ? (
                        <>
                          <div className="flex justify-end mb-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              CUSTOMER • {formatTime(transcript.timestamp || transcript.created_at)}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5 sm:gap-2 justify-end">
                            <div className="max-w-[80%] bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 sm:px-4 sm:py-3 shadow-sm">
                              <p className="text-xs sm:text-sm">{transcript.text || transcript.content}</p>
                            </div>
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
                              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-start mb-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              AI EMPLOYEE • {formatTime(transcript.timestamp || transcript.created_at)}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5 sm:gap-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                            </div>
                            <div className="max-w-[80%] common-bg-icons rounded-2xl rounded-tl-sm px-3 py-2 sm:px-4 sm:py-3 border border-slate-200 dark:border-slate-700">
                              <p className="text-xs sm:text-sm text-slate-800 dark:text-white">{transcript.text || transcript.content}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Session ended • Resolution: Session completed
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    No transcripts available for this session
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Tab Content: Recording & Summary */}
          {activeTab === 'recording' && (
            <div className="space-y-3 sm:space-y-4">
          {/* Call Recording */}
          <div className="common-bg-icons p-3 sm:p-4 rounded-lg sm:rounded-xl">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
              </svg>
              Call Recording
            </h3>
            
            {/* Audio Player */}
            <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              {session?.recording?.url ? (
                <>
                  {/* Hidden audio element */}
                  <audio
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    src={session.recording.url}
                  />
                  
                  {/* Recording Status Badge */}
                  {session.recording.status && (
                    <div className="mb-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                        session.recording.status === 'completed' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : session.recording.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          session.recording.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        {session.recording.status === 'completed' ? 'Recording Available' : 'Processing'}
                      </span>
                      {session.recording.egress_id && (
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[120px] sm:max-w-none">
                          ID: {session.recording.egress_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Progress bar */}
                  <div
                    ref={progressRef}
                    onClick={handleProgressClick}
                    className="relative h-1 bg-slate-300 dark:bg-slate-700 rounded-full cursor-pointer mb-2"
                  >
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col gap-2">
                    {/* Progress time row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 w-8 sm:w-10">
                        {formatTimeDisplay(currentTime)}
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 w-8 sm:w-10 text-right">
                        {formatTimeDisplay(duration || session.duration_seconds || 0)}
                      </span>
                    </div>

                    {/* Player controls - responsive layout */}
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <button
                        onClick={() => skip(-10)}
                        className="p-1 sm:p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Rewind 10s"
                      >
                        <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                      
                      <button
                        onClick={togglePlayPause}
                        className="p-1.5 sm:p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" />
                        ) : (
                          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" fill="currentColor" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => skip(10)}
                        className="p-1 sm:p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Forward 10s"
                      >
                        <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
                      </button>

                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5 sm:mx-1 hidden xs:block" />

                      <button
                        onClick={changeSpeed}
                        className="px-1.5 sm:px-2 py-0.5 sm:py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-[10px] sm:text-xs text-slate-600 dark:text-slate-400"
                        title="Playback speed"
                      >
                        {playbackSpeed}x
                      </button>

                      <button
                        onClick={toggleMute}
                        className="p-1 sm:p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? (
                          <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
                        )}
                      </button>

                      <button
                        onClick={handleDownload}
                        className="p-1 sm:p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Download recording"
                      >
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
                      </button>

                      <button
                        onClick={handleShare}
                        className="p-1 sm:p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Share recording"
                      >
                        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Recording not available</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {session?.recording?.enabled === false 
                      ? 'Recording was disabled for this session' 
                      : session?.recording?.status === 'processing'
                      ? 'Recording is being processed'
                      : 'No recording found for this session'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Call Summary Section */}
          <div className="common-bg-icons p-3 sm:p-4 rounded-lg sm:rounded-xl">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              Call Summary
            </h3>
            
            {summaryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : summaryError ? (
              <div className="text-center py-6">
                <XCircle className="w-10 h-10 text-red-300 dark:text-red-600 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-red-500 dark:text-red-400">
                  {summaryError}
                </p>
              </div>
            ) : callSummary?.leads && callSummary.leads.length > 0 ? (
              <div className="space-y-4">
                {callSummary.leads
                  .filter((lead: any) => lead.callId === (session.session_id || session.id))
                  .map((lead: any, leadIndex: number) => (
                  <div key={lead.id || leadIndex} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 space-y-3">
                    {/* Call ID and Date */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {lead.callId || 'N/A'}
                        </span>
                      </div>
                      {lead.createdAt && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(lead.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>

                    {/* Intent Details */}
                    {lead.intent && (
                      <div className="space-y-2">
                        {lead.intent.primary && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Primary Intent</p>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {lead.intent.primary}
                            </p>
                          </div>
                        )}

                        {lead.intent.details && (
                          <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Details</p>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {lead.intent.details}
                            </p>
                          </div>
                        )}

                        {/* Urgency Badge */}
                        {lead.intent.urgency && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Urgency:</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              lead.intent.urgency === 'high' 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                : lead.intent.urgency === 'medium'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {lead.intent.urgency}
                            </span>
                          </div>
                        )}

                        {/* Tags */}
                        {lead.intent.tags && lead.intent.tags.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Tags</p>
                            <div className="flex flex-wrap gap-1.5">
                              {lead.intent.tags.map((tag: string, tagIndex: number) => (
                                <span
                                  key={tagIndex}
                                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs border border-slate-200 dark:border-slate-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lead Information — fully dynamic, works for any industry */}
                    {lead.leadData && Object.keys(lead.leadData).length > 0 && (() => {
                      const formatLabel = (key: string) =>
                        key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().replace(/^\w/, c => c.toUpperCase());

                      const iconForKey = (key: string) => {
                        const k = key.toLowerCase();
                        if (k.includes('email')) return Mail;
                        if (k.includes('phone') || k.includes('mobile') || k.includes('contact') || k.includes('number')) return Phone;
                        if (k.includes('date') || k.includes('travel') || k.includes('schedule')) return Calendar;
                        if (k.includes('time') || k.includes('duration') || k.includes('hour')) return Clock;
                        if (k.includes('status') || k.includes('stage') || k.includes('priority')) return TrendingUp;
                        if (k.includes('name') || k.includes('person') || k.includes('group') || k.includes('size') || k.includes('count') || k.includes('people')) return Users;
                        return FileText;
                      };

                      const statusColors: Record<string, string> = {
                        qualified: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800',
                        interested: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
                        new: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
                        hot: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800',
                        warm: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
                        cold: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
                      };

                      // Render a single scalar value
                      const renderScalar = (v: any): React.ReactNode => {
                        if (v === null || v === undefined || v === '') return null;
                        if (typeof v === 'boolean') {
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${v ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                              {v ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {v ? 'Yes' : 'No'}
                            </span>
                          );
                        }
                        const str = String(v);
                        if (statusColors[str.toLowerCase()]) {
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[str.toLowerCase()]}`}>
                              {str.toLowerCase() === 'qualified' && <CheckCircle className="w-3 h-3" />}
                              {str}
                            </span>
                          );
                        }
                        return <span className="text-sm font-medium text-slate-800 dark:text-white">{str}</span>;
                      };

                      // Render an object as a mini card with key-value rows
                      const renderObjectCard = (obj: Record<string, any>, index: number) => {
                        const objEntries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== false);
                        if (objEntries.length === 0) return null;
                        return (
                          <div key={index} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 space-y-1.5">
                            {objEntries.map(([k, v]) => (
                              <div key={k} className="flex items-start justify-between gap-2">
                                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{formatLabel(k)}</span>
                                <span className="text-xs font-medium text-slate-800 dark:text-white text-right">{typeof v === 'boolean' ? (v ? '✓ Yes' : '✗ No') : String(v)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      };

                      // Main value renderer
                      const renderValue = (value: any): React.ReactNode => {
                        if (value === null || value === undefined || value === '') return null;

                        // Array
                        if (Array.isArray(value)) {
                          if (value.length === 0) return null;
                          const hasObjects = value.some(i => typeof i === 'object' && i !== null);
                          if (hasObjects) {
                            // Array of objects → mini cards (full width)
                            return (
                              <div className="space-y-2 mt-1">
                                {value.map((item, i) =>
                                  typeof item === 'object' && item !== null
                                    ? renderObjectCard(item, i)
                                    : <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{String(item)}</span>
                                )}
                              </div>
                            );
                          }
                          // Array of scalars → pill tags
                          return (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {value.map((item, i) => (
                                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                                  {String(item)}
                                </span>
                              ))}
                            </div>
                          );
                        }

                        // Plain object → key-value mini card
                        if (typeof value === 'object') {
                          return <div className="mt-1">{renderObjectCard(value, 0)}</div>;
                        }

                        // Scalar
                        return renderScalar(value);
                      };

                      const entries = Object.entries(lead.leadData).filter(([, v]) => {
                        if (v === null || v === undefined || v === '') return false;
                        if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false;
                        if (Array.isArray(v) && v.length === 0) return false;
                        return true;
                      });

                      if (entries.length === 0) return null;

                      // Separate simple scalars from complex (array/object) fields
                      const simpleEntries = entries.filter(([, v]) => !Array.isArray(v) && typeof v !== 'object');
                      const complexEntries = entries.filter(([, v]) => Array.isArray(v) || (typeof v === 'object' && v !== null));

                      return (
                        <div className="mt-1">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                              <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Lead Information</p>
                          </div>

                          {/* Simple fields grid */}
                          {simpleEntries.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {simpleEntries.map(([key, value]) => {
                                const Icon = iconForKey(key);
                                const label = formatLabel(key);
                                const rendered = renderValue(value);
                                if (!rendered) return null;
                                return (
                                  <div key={key} className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Icon className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{label}</p>
                                    </div>
                                    <div className="pl-0.5">{rendered}</div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Complex fields (arrays / nested objects) — full width */}
                          {complexEntries.map(([key, value]) => {
                            const label = formatLabel(key);
                            const rendered = renderValue(value);
                            if (!rendered) return null;
                            return (
                              <div key={key} className="mb-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1.5">{label}</p>
                                {rendered}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  No call summary available
                </p>
              </div>
            )}
          </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionTranscriptModal;
