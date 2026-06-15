import { Room, RoomEvent, Track, AudioPresets, ConnectionState } from 'livekit-client';

export interface LiveKitMessage {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  source?: 'voice' | 'chat';
}

export interface LiveKitCallbacks {
  onMessage: (message: LiveKitMessage) => void;
  onConnected: () => void;
  onDisconnected: (reason?: string) => void;
  onConnectionStateChange: (state: string) => void;
  onError: (error: string) => void;
  onStatusUpdate: (status: string, state: 'connecting' | 'connected' | 'disconnected') => void;
}

class LiveKitService {
  private room: Room | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private callbacks: LiveKitCallbacks | null = null;
  private lastSentMessage: string | null = null;
  private localAudioTrack: any = null;
  private remoteAudioTrack: any = null;

  // Load LiveKit SDK dynamically (EXACT match with widget.js)
  private async loadLiveKitSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).LivekitClient !== undefined) {
        console.log('✅ LiveKit already loaded');
        resolve();
        return;
      }

      console.log('📦 Loading LiveKit SDK...');

      // Load livekit-client directly (components-core not needed)
      const clientScript = document.createElement('script');
      clientScript.src = 'https://unpkg.com/livekit-client@latest/dist/livekit-client.umd.js';
      clientScript.onload = () => {
        console.log('✅ LiveKit client loaded successfully');
        resolve();
      };
      clientScript.onerror = () => {
        console.error('❌ Failed to load LiveKit client');
        reject(new Error('Failed to load LiveKit client'));
      };
      document.head.appendChild(clientScript);
    });
  }

  // Initialize callbacks
  public setCallbacks(callbacks: LiveKitCallbacks): void {
    this.callbacks = callbacks;
  }

  // Connect to LiveKit room
  public async connect(agentId: string, language: string = 'en-US'): Promise<void> {
    console.log('🚀 LiveKit Service: Starting connection process...');
    console.log('📝 Connection parameters:', { agentId, language });
    
    try {
      if (this.isConnecting || this.isConnected) {
        console.log('⚠️ Already connecting or connected');
        return;
      }

      console.log('📊 Initial state:', { 
        isConnecting: this.isConnecting, 
        isConnected: this.isConnected,
        hasRoom: !!this.room,
        hasCallbacks: !!this.callbacks
      });

      this.isConnecting = true;
      console.log('🔄 Set isConnecting to true');
      this.callbacks?.onStatusUpdate('Loading LiveKit...', 'connecting');

      // Load LiveKit SDK if not available (EXACT match with widget.js)
      console.log('🔍 Checking LiveKit SDK availability...');
      if ((window as any).LivekitClient === undefined) {
        console.log('📦 LiveKit not loaded, loading now...');
        await this.loadLiveKitSDK();
        console.log('✅ LiveKit loaded successfully');
        
        // Double check after loading
        if ((window as any).LivekitClient === undefined) {
          console.error('❌ LiveKit still not available after loading');
          throw new Error('LiveKit not available after loading');
        }
      } else {
        console.log('✅ LiveKit SDK already available');
      }

      console.log('🔍 LiveKit version info:', {
        hasLiveKit: !!(window as any).LivekitClient,
        version: (window as any).LivekitClient?.version || 'unknown'
      });

      this.callbacks?.onStatusUpdate('Connecting...', 'connecting');

      // Check if connection was cancelled before token request
      if (!this.isConnecting) {
        console.log('❌ Connection cancelled before token request');
        return;
      }

      // Determine device type (EXACT match with widget.js)
      const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
      console.log('📱 Device type detected:', deviceType);

      // Get LiveKit token from backend (EXACT match with widget.js)
      const callId = `call_${Date.now()}`;
      console.log('🔑 Getting token with parameters:', {
        agent_id: agentId,
        language,
        call_id: callId,
        device: deviceType,
        user_agent: navigator.userAgent
      });
      
      console.log('🌐 Making request to token server...');
      const response = await fetch('https://python.service.callshivai.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          language,
          call_id: callId,
          device: deviceType,
          user_agent: navigator.userAgent,
        }),
      });

      console.log('📡 Token server response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token server error details:', errorText);
        throw new Error(`Failed to get LiveKit token: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [LiveKit] Token received successfully:', {
        hasUrl: !!data.url,
        hasToken: !!data.token,
        urlLength: data.url?.length || 0,
        tokenLength: data.token?.length || 0
      });

      // Check if connection was cancelled after getting token
      if (!this.isConnecting) {
        console.log('❌ Connection cancelled after token received');
        return;
      }

      // Handle any pending audio elements (for autoplay policy)
      if ((window as any).pendingAudioElement) {
        console.log('🔊 Handling pending audio element...');
        (window as any).pendingAudioElement
          .play()
          .catch((err: any) => console.warn('⚠️ Still cannot play audio:', err));
        (window as any).pendingAudioElement = null;
      }

      // Optimized audio configuration for feedback prevention (EXACT match with widget.js)
      const audioConfig = {
        // Enhanced feedback prevention
        echoCancellation: true, // Critical for feedback prevention
        noiseSuppression: true, // Remove background noise
        autoGainControl: true, // Enable AGC for stable levels

        // Advanced feedback prevention options
        suppressLocalAudioPlayback: true, // Prevent local audio feedback

        // Constraints for user input detection
        channelCount: 1,
        sampleRate: 48000,
        sampleSize: 16,

        // Optimized volume for feedback prevention
        volume: 0.5, // Lower volume to prevent feedback
        latency: 0.1, // Slightly higher latency for stability

        // Device constraints
        facingMode: 'user',
        deviceId: 'default',

        // Browser-specific feedback prevention
        googEchoCancellation: true,
        googAutoGainControl: true, // Enable for feedback prevention
        googNoiseSuppression: true,
        googHighpassFilter: true, // Remove low frequencies that cause feedback
        googAudioMirroring: false,

        // Additional experimental options for feedback prevention
        googBeamforming: false, // Disable to prevent feedback amplification
        googArrayGeometry: false, // Disable array processing
        mozAutoGainControl: true, // Firefox feedback prevention
        mozNoiseSuppression: true,
      };

      console.log('🎵 Audio configuration prepared:', audioConfig);

      // Create LiveKit room with enhanced feedback prevention (EXACT match with widget.js)
      const LiveKit = (window as any).LivekitClient;
      console.log('🏠 Creating LiveKit room...');
      
      const roomConfig = {
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          ...audioConfig,
          // Enhanced LiveKit feedback prevention
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true, // Enable for feedback prevention
          suppressLocalAudioPlayback: true, // Critical for feedback prevention
        },
        // Performance optimizations for feedback prevention
        reconnectPolicy: {
          nextRetryDelayInMs: () => 2000, // Slower reconnect to prevent issues
        },
        publishDefaults: {
          audioPreset: LiveKit.AudioPresets.speech, // Better for voice with feedback prevention
          dtx: true, // Enable discontinuous transmission
          red: false, // Disable redundancy for clarity
          simulcast: false, // Disable simulcast for voice calls
        },
        // Room options for feedback prevention
        e2eeEnabled: false,
        expWebAudioMix: false, // Disable experimental mixing that can cause feedback
      };

      console.log('🏠 Room configuration:', roomConfig);
      this.room = new LiveKit.Room(roomConfig);
      console.log('✅ LiveKit room created successfully');

      // Setup event listeners
      console.log('👂 Setting up room event listeners...');
      this.setupRoomEvents(LiveKit, audioConfig);

      // Connect to room (EXACT match with widget.js)
      console.log('🔗 Connecting to LiveKit room with URL and token...');
      console.log('🔗 Connection details:', {
        url: data.url,
        tokenPreview: data.token.substring(0, 20) + '...'
      });
      
      await this.room.connect(data.url, data.token);
      console.log('🔗 Room connected successfully');

      // Check final connection state
      if (!this.isConnecting) {
        console.log('❌ Connection cancelled during room connection');
        if (this.room) {
          this.room.disconnect();
          this.room = null;
        }
        return;
      }

      console.log('🎉 Connection process completed successfully!');

    } catch (error) {
      console.error('❌ Connection Error:', error);
      this.isConnecting = false;
      this.isConnected = false;
      
      let errorMsg = 'Connection failed';
      if (error instanceof Error) {
        if (error.message.includes('token')) {
          errorMsg = 'Authentication failed';
        } else if (error.message.includes('timeout')) {
          errorMsg = 'Connection timeout';
        } else if (error.message.includes('network')) {
          errorMsg = 'Network error';
        }
      }
      
      this.callbacks?.onError(errorMsg);
      this.callbacks?.onStatusUpdate(`❌ ${errorMsg}`, 'disconnected');
    }
  }

  // Setup room event listeners
  private setupRoomEvents(LiveKit: any, audioConfig: any): void {
    if (!this.room) {
      console.error('❌ Cannot setup room events: room is null');
      return;
    }

    console.log('👂 Setting up room event listeners...');

    // ✅ Track remote audio (agent speaking) with optimized settings (EXACT copy from widget.js)
    this.room.on(LiveKit.RoomEvent.TrackSubscribed, (track: any, publication: any, participant: any) => {
      console.log('🎵 TrackSubscribed event:', { 
        trackKind: track.kind, 
        participant: participant?.identity,
        trackSid: track.sid 
      });
      
      if (track.kind === LiveKit.Track.Kind.Audio) {
        console.log('🔊 Audio track subscribed, setting up playback...');
        // Use audio element with feedback prevention settings
        const audioElement = track.attach();
        audioElement.volume = 0.4; // Significantly reduced to prevent feedback
        audioElement.preload = 'auto';
        audioElement.autoplay = true;

        // Add audio constraints to prevent feedback
        if (audioElement.setSinkId) {
          try {
            audioElement.setSinkId('default');
          } catch (err) {
            console.warn('⚠️ Could not set audio sink:', err);
          }
        }

        if (audioElement.webkitAudioDecodedByteCount !== undefined) {
          audioElement.webkitPreservesPitch = false;
        }

        document.body.appendChild(audioElement);

        audioElement.play().catch((error: any) => {
          console.warn('⚠️ Audio autoplay blocked, will try on user interaction:', error);
          (window as any).pendingAudioElement = audioElement;
        });

        this.remoteAudioTrack = track;
        console.log('🔊 Agent audio track received with feedback prevention');
      }
    });

    // Handle participant metadata changes (EXACT copy from widget.js)
    this.room.on(LiveKit.RoomEvent.ParticipantMetadataChanged, (metadata: string, participant: any) => {
      console.log('📋 Participant metadata changed:', {
        metadata,
        participant: participant?.identity,
      });
      if (metadata) {
        try {
          const data = JSON.parse(metadata);
          if (data.transcript || data.text) {
            this.addMessage(false, data.transcript || data.text, 'voice');
            console.log('✅ Transcript from participant metadata:', data.transcript || data.text);
          }
        } catch (e) {
          console.log('Metadata not JSON:', metadata);
        }
      }
    });

    // Handle room metadata changes (EXACT copy from widget.js)
    this.room.on(LiveKit.RoomEvent.RoomMetadataChanged, (metadata: string) => {
      console.log('🏠 Room metadata changed:', metadata);
      if (metadata) {
        try {
          const data = JSON.parse(metadata);
          if (data.transcript || data.text) {
            this.addMessage(false, data.transcript || data.text, 'voice');
            console.log('✅ Transcript from room metadata:', data.transcript || data.text);
          }
        } catch (e) {
          console.log('Room metadata not JSON:', metadata);
        }
      }
    });

    // Handle successful connection (EXACT match with widget.js)
    this.room.on(LiveKit.RoomEvent.Connected, async () => {
      console.log('🎉 Connected event fired! Room successfully connected');
      console.log('📊 Connection state after Connected event:', {
        isConnected: this.isConnected,
        isConnecting: this.isConnecting,
        roomState: this.room?.state
      });
      
      this.isConnected = true;
      this.isConnecting = false;

      console.log('📊 Updated connection state:', {
        isConnected: this.isConnected,
        isConnecting: this.isConnecting
      });

      this.callbacks?.onStatusUpdate('🤖 AI is Initializing...', 'connected');

      // 🎤 Enable microphone with enhanced feedback prevention (EXACT match with widget.js)
      console.log('🎤 Attempting to enable microphone...');
      try {
        await this.room!.localParticipant.setMicrophoneEnabled(true, {
          // Enhanced feedback prevention
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true, // Enable for consistent levels and feedback prevention
          suppressLocalAudioPlayback: true, // Critical for feedback prevention

          // Stable audio settings
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16,

          // Conservative volume to prevent feedback
          volume: 0.5, // Reduced to prevent feedback loops
          latency: 0.1, // Slightly higher for stability
          facingMode: 'user',
        });
        console.log('✅ Microphone enabled with optimized settings');
      } catch (micError) {
        console.warn('⚠️ Failed to enable microphone with full config, trying basic:', micError);
        try {
          // Fallback to basic microphone enabling
          await this.room!.localParticipant.setMicrophoneEnabled(true);
          console.log('✅ Microphone enabled (basic mode)');
        } catch (basicError) {
          console.error('❌ Failed to enable microphone completely:', basicError);
          this.callbacks?.onError('Failed to enable microphone. Please check your microphone permissions and try again.');
        }
      }

      // Resume audio context if suspended (browser autoplay policy) (EXACT match with widget.js)
      if ((window as any).AudioContext || (window as any).webkitAudioContext) {
        console.log('🔊 Resuming audio context...');
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') {
          audioCtx
            .resume()
            .then(() => {
              console.log('🔊 Audio context resumed for better audio quality');
            })
            .catch((err: any) => console.warn('⚠️ Could not resume audio context:', err));
        }
      }

      this.callbacks?.onStatusUpdate('✅ Connected - Speak now!', 'connected');

      // Get local audio track and start monitoring
      const audioTracks = Array.from(this.room!.localParticipant.audioTrackPublications.values());
      if (audioTracks.length > 0) {
        this.localAudioTrack = audioTracks[0].track;
        console.log('🎤 Audio track found and monitoring started immediately');
      }

      console.log('🎤 Microphone enabled and ready for conversation');
      console.log('🎉 Firing onConnected callback...');
      this.callbacks?.onConnected();
      console.log('✅ Connection setup completed successfully!');
    });

    // Handle disconnection (EXACT copy from widget.js)
    this.room.on(LiveKit.RoomEvent.Disconnected, (reason: string) => {
      console.log('🔴 Disconnected from LiveKit room:', reason);
      this.isConnected = false;
      this.callbacks?.onDisconnected(reason);
      this.callbacks?.onStatusUpdate('❌ Disconnected', 'disconnected');
    });

    // Handle connection state changes (EXACT copy from widget.js)
    this.room.on(LiveKit.RoomEvent.ConnectionStateChanged, (state: any) => {
      console.log('🔗 Connection state changed to:', state);
      this.callbacks?.onConnectionStateChange(state);
      if (state === LiveKit.ConnectionState.Disconnected) {
        console.log('🔴 Connection state is disconnected');
        this.isConnected = false;
        this.callbacks?.onStatusUpdate('❌ Disconnected', 'disconnected');
      }
    });

    // Handle data received (ENHANCED version from widget.js)
    this.room.on(LiveKit.RoomEvent.DataReceived, (payload: Uint8Array, participant: any, kind: any, topic: any) => {
      console.log('📨 DataReceived EVENT FIRED:', {
        payloadLength: payload.length,
        participant: participant?.identity,
        kind,
        topic,
        timestamp: new Date().toLocaleTimeString(),
      });

      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(payload);
        console.log('📝 Raw decoded text:', text);

        // SUPER AGGRESSIVE - capture ANY text that might be a transcript (from widget.js)
        if (text && text.trim().length > 0) {
          let transcriptText = text.trim();
          let shouldAddToChat = false;
          const participantName = participant?.identity || 'Agent';

          // Skip ONLY very obvious technical messages
          const skipPatterns = ['subscribed', 'connected', 'disconnected', 'enabled', 'disabled', 'true', 'false', 'null', 'undefined'];
          const shouldSkip = skipPatterns.some(pattern => text.toLowerCase() === pattern);

          if (shouldSkip) {
            console.log('🚫 Skipping obvious technical message:', text);
            return;
          }

          console.log('🎯 Processing potential transcript:', text);

          // Try to parse as JSON first
          try {
            const jsonData = JSON.parse(text);
            console.log('📋 Parsed JSON data:', jsonData);

            // Look for ANY text field that might contain transcript
            const possibleTextFields = ['text', 'transcript', 'message', 'content', 'data', 'response', 'speech', 'voice', 'audio', 'words', 'result', 'output'];

            for (const field of possibleTextFields) {
              if (jsonData[field] && typeof jsonData[field] === 'string' && jsonData[field].trim().length > 0) {
                transcriptText = jsonData[field].trim();
                shouldAddToChat = true;
                console.log(`✅ Found text in field '${field}':`, transcriptText);
                break;
              }
            }

            // Check for role information
            let isUser = false;
            if (jsonData.role) {
              isUser = jsonData.role.includes('user') || jsonData.role.includes('human');
            } else if (jsonData.speaker) {
              isUser = jsonData.speaker.includes('user') || jsonData.speaker.includes('human') || jsonData.speaker.includes('You');
            } else if (participant) {
              isUser = participant.identity === this.room!.localParticipant?.identity;
            }

            // Handle legacy transcript format
            if (jsonData.type === 'transcript' && jsonData.text) {
              if (jsonData.role === 'user') {
                // Allow voice transcripts for user, but skip chat messages
                if (jsonData.type !== 'chat') {
                  this.addMessage(true, jsonData.text, 'voice');
                } else {
                  console.log('🚫 Skipping user chat message (already shown from sendMessage)');
                }
              } else if (jsonData.role === 'assistant') {
                this.addMessage(false, jsonData.text, 'voice');
              }
              console.log('✅ Processed legacy format transcript');
              return;
            }

            if (shouldAddToChat) {
              const senderRole = isUser;
              // Skip typed messages (they have source: 'typed') but allow voice transcripts
              if (!isUser || (isUser && jsonData.type !== 'chat') || (isUser && jsonData.source !== 'typed')) {
                this.addMessage(senderRole, transcriptText, 'voice');
                console.log('✅ Added JSON transcript:', {
                  role: senderRole ? 'user' : 'assistant',
                  text: transcriptText.substring(0, 50) + '...',
                });
              }
            }
          } catch (e) {
            // Not JSON, treat as plain text
            console.log('📄 Not JSON, treating as plain text');

            // If it's reasonable length text (not just noise), add it
            if (text.length >= 2 && text.length <= 1000) {
              // Assume it's from assistant unless proven otherwise
              const isUser = participant && participant.identity === this.room!.localParticipant?.identity;

              // Add all transcripts (both user voice and assistant)
              this.addMessage(isUser, transcriptText, 'voice');
              console.log('✅ Added plain text transcript:', {
                role: isUser ? 'user' : 'assistant',
                text: transcriptText.substring(0, 50) + '...',
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ Error processing DataReceived:', error);
      }
    });

    // CRITICAL: Register text stream handlers BEFORE connecting (exactly like widget.js)
    try {
      if (typeof this.room.registerTextStreamHandler === 'function') {
        console.log('📝 Registering text stream handlers...');

        // Transcription stream
        this.room.registerTextStreamHandler('lk.transcription', async (reader: any, participantInfo: any) => {
          console.log('🎯 Transcription stream from:', participantInfo.identity);
          try {
            const info = reader.info;
            console.log('Stream info:', {
              topic: info.topic,
              id: info.id,
              timestamp: info.timestamp,
              size: info.size,
              attributes: info.attributes,
            });

            // Check if this is a final transcription
            const isFinal = info.attributes?.['lk.transcription_final'] === 'true';
            const transcribedTrackId = info.attributes?.['lk.transcribed_track_id'];
            const segmentId = info.attributes?.['lk.segment_id'];

            console.log('Transcription attributes:', {
              isFinal,
              transcribedTrackId,
              segmentId,
            });

            // Read the complete text
            const text = await reader.readAll();

            if (text && text.trim()) {
              const isUser = participantInfo.identity === this.room!.localParticipant?.identity;

              // Prevent duplicate user messages by checking against last sent message
              if (isUser && this.lastSentMessage && text.trim() === this.lastSentMessage.trim()) {
                console.log('🚫 Skipping duplicate user message from transcription:', text);
                return;
              }

              // Add transcriptions
              this.addMessage(isUser, text, 'voice');
              console.log('✅ Transcription added:', {
                sender: isUser ? 'user' : 'assistant',
                text,
                isFinal,
              });
            }
          } catch (error) {
            console.error('❌ Error processing transcription stream:', error);
          }
        });

        // Handler for chat messages - THIS IS KEY FOR AI RESPONSES (exactly like widget.js)
        this.room.registerTextStreamHandler('lk.chat', async (reader: any, participantInfo: any) => {
          console.log('💬 Chat stream from:', participantInfo.identity);
          try {
            const text = await reader.readAll();
            const isUser = participantInfo.identity === this.room!.localParticipant?.identity;

            if (!isUser && text && text.trim()) {
              console.log('💬 AI Chat response received:', text);
              this.addMessage(false, text, 'chat');
              console.log('💬 Chat message added:', {
                sender: participantInfo.identity,
                text,
              });
            }
          } catch (error) {
            console.error('❌ Error processing chat stream:', error);
          }
        });

        console.log('✅ Text stream handlers registered successfully');
      } else {
        console.warn('⚠️ registerTextStreamHandler not available, using fallback DataReceived');
      }
    } catch (error) {
      console.error('❌ Error registering text stream handlers:', error);
    }
  }

  // Add message helper
  private addMessage(isUser: boolean, text: string, source: 'voice' | 'chat' = 'voice'): void {
    if (!this.callbacks) return;

    const message: LiveKitMessage = {
      id: Date.now() + Math.random(),
      text: text.trim(),
      isUser,
      timestamp: new Date(),
      source,
    };

    this.callbacks.onMessage(message);
  }

  // Send chat message
  public async sendMessage(message: string): Promise<void> {
    if (!this.room || !this.isConnected || !message.trim()) {
      console.warn('⚠️ Cannot send message: not connected or empty message');
      return;
    }

    try {
      console.log('📤 Sending chat message:', message);

      // Primary: publishData — backend agent listens on DataReceived for typed chat
      const chatMessage = {
        type: 'chat',
        text: message,
        role: 'user',
        timestamp: Date.now(),
        source: 'typed',
      };
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(chatMessage));
      await this.room.localParticipant.publishData(data, { reliable: true });
      console.log('✅ Chat sent with publishData');

      // Add to UI immediately
      this.addMessage(true, message, 'chat');
      this.lastSentMessage = message;

    } catch (error) {
      console.error('❌ Error sending message:', error);
      this.callbacks?.onError('Failed to send message');
    }
  }

  // Disconnect from room
  public async disconnect(): Promise<void> {
    if (this.room) {
      this.isConnecting = false;
      this.isConnected = false;
      
      try {
        await this.room.disconnect();
        console.log('🛑 Disconnected from LiveKit room');
      } catch (error) {
        console.error('❌ Error disconnecting:', error);
      }
      
      this.room = null;
      this.localAudioTrack = null;
      this.remoteAudioTrack = null;
    }
  }

  // Toggle microphone mute
  public async toggleMute(): Promise<boolean> {
    if (!this.room || !this.isConnected) {
      return false;
    }

    try {
      const currentState = this.room.localParticipant.isMicrophoneEnabled;
      await this.room.localParticipant.setMicrophoneEnabled(!currentState);
      console.log(`🎤 Microphone ${!currentState ? 'enabled' : 'muted'}`);
      return !currentState;
    } catch (error) {
      console.error('❌ Error toggling microphone:', error);
      return false;
    }
  }

  // Get connection status
  public getStatus(): { isConnected: boolean; isConnecting: boolean } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
    };
  }
}

export const liveKitService = new LiveKitService();