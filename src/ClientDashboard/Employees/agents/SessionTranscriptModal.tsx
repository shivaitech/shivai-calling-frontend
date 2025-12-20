import { useState, useEffect, useRef } from 'react';
import { X, FileText, Clock, MapPin, Calendar, Users, MessageSquare, Loader2, Bot, Play, Pause, Download, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react";
import { agentAPI } from '../../../services/agentAPI';

interface SessionTranscriptModalProps {
  session: any;
  onClose: () => void;
}

const SessionTranscriptModal = ({ session, onClose }: SessionTranscriptModalProps) => {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTranscripts = async () => {
      if (!session?.session_id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await agentAPI.getSessionTranscripts(session.session_id);
        setTranscripts(data.transcripts || []);
      } catch (err: any) {
        console.error('Failed to fetch transcripts:', err);
        setError(err.message || 'Failed to load transcripts');
      } finally {
        setLoading(false);
      }
    };

    fetchTranscripts();
  }, [session?.session_id]);

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

  const handleDownload = () => {
    // Simulate download - in real app, this would download the actual recording
    const link = document.createElement('a');
    link.href = '#'; // Replace with actual recording URL
    link.download = `recording-${session.session_id}.mp3`;
    link.click();
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
                  ID: {session.session_id || session.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
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
                {session.location?.city || session.user_ip || 'unknown'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400 truncate">
                {session.start_time ? new Date(session.start_time).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400 truncate">
                {formatDuration(session.duration_seconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Conversation Transcript */}
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

          {/* Session Details */}
          <div className="common-bg-icons p-3 sm:p-4 rounded-lg sm:rounded-xl">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
              </svg>
              Call Recording
            </h3>
            
            {/* Audio Player */}
            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                src="#" // Replace with actual recording URL when available
              />
              
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
              <div className="flex items-center justify-between gap-3">
                {/* Time display */}
                <span className="text-xs text-slate-600 dark:text-slate-400 w-10">
                  {formatTimeDisplay(currentTime)}
                </span>

                {/* Player controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => skip(-10)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Rewind 10s"
                  >
                    <SkipBack className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  
                  <button
                    onClick={togglePlayPause}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" fill="currentColor" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => skip(10)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Forward 10s"
                  >
                    <SkipForward className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>

                  <button
                    onClick={changeSpeed}
                    className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-xs text-slate-600 dark:text-slate-400"
                    title="Playback speed"
                  >
                    {playbackSpeed}x
                  </button>

                  <button
                    onClick={toggleMute}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    )}
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Download recording"
                  >
                    <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>

                {/* Duration */}
                <span className="text-xs text-slate-600 dark:text-slate-400 w-10 text-right">
                  {formatTimeDisplay(duration || session.duration_seconds || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTranscriptModal;
