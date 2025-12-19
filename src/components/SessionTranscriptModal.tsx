import { useState, useEffect } from 'react';
import { X, FileText, Clock, MapPin, Calendar, Users, MessageSquare, Loader2 } from "lucide-react";
import { agentAPI } from '../services/agentAPI';

interface SessionTranscriptModalProps {
  session: any;
  onClose: () => void;
}

const SessionTranscriptModal = ({ session, onClose }: SessionTranscriptModalProps) => {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                    Conversation started at {formatDateTime(session.start_time)}
                  </p>
                  
                  {transcripts.map((transcript: any, index: number) => (
                    <div key={index} className="flex flex-col gap-1.5 py-1.5 sm:py-2">
                      {transcript.role === 'user' ? (
                        <>
                          <div className="flex-1"></div>
                          <div className="flex items-start gap-1.5 sm:gap-2 flex-1">
                            <div className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 sm:px-4 sm:py-3 shadow-sm">
                              <p className="text-xs sm:text-sm">{transcript.text || transcript.content}</p>
                              <span className="text-xs opacity-75 mt-1 block">
                                CUSTOMER • {formatTime(transcript.timestamp || transcript.created_at)}
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
                            <p className="text-xs sm:text-sm text-slate-800 dark:text-white">{transcript.text || transcript.content}</p>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                              SHIVAI ASSISTANT • {formatTime(transcript.timestamp || transcript.created_at)}
                            </span>
                          </div>
                          <div className="flex-1"></div>
                        </div>
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
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-3">
              Session Details
            </h3>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
              </svg>
              <span className="text-sm font-medium">Play Recording</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTranscriptModal;
