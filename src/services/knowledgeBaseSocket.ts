// v2.1 - Global callback approach (no ID matching)
const isStaging = import.meta.env.VITE_API_BASE_URL?.includes('staging');
const SOCKET_URL = isStaging
  ? 'https://staging.nodejs.callshivai.com'
  : 'https://nodejs.service.callshivai.com';

interface KnowledgeBaseProgress {
  agentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  chunks_processed?: number;
  vectors_stored?: number;
  error?: string;
  timestamp?: string;
}

type ProgressCallback = (progress: KnowledgeBaseProgress) => void;

// Declare Socket.IO types for the CDN version
declare global {
  interface Window {
    io: any;
  }
}

class KnowledgeBaseSocketService {
  private socket: any = null;
  private globalCallback: ProgressCallback | null = null;
  private isConnected: boolean = false;
  private isLoading: boolean = false;

  private async loadSocketIO(): Promise<void> {
    if (window.io) {
      console.log('✅ Socket.IO already loaded');
      return;
    }

    if (this.isLoading) {
      // Wait for loading to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (window.io || !this.isLoading) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    this.isLoading = true;
    console.log('📦 Loading Socket.IO client from CDN...');

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ Socket.IO client loaded successfully');
        this.isLoading = false;
        resolve();
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load Socket.IO client');
        this.isLoading = false;
        reject(new Error('Failed to load Socket.IO'));
      };
      
      document.head.appendChild(script);
    });
  }

  async connect(userId: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    try {
      // Load Socket.IO if not already loaded
      await this.loadSocketIO();

      console.log('🔄 Connecting to', SOCKET_URL);
      
      this.socket = window.io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // Listen to ALL events for debugging (like in test file)
      this.socket.onAny((eventName: string, ...args: any[]) => {
        console.log(`📥 EVENT RECEIVED: "${eventName}" with data:`, args);
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected with ID:', this.socket?.id);
        this.isConnected = true;
        
        // Auto-join room on connect (with delay like in test)
        setTimeout(() => {
          console.log('📤 Emitting: join-user-room with userId:', userId);
          this.socket?.emit('join-user-room', userId); // Send just the userId string, not object
          console.log('✅ Emit sent successfully');
        }, 500);
      });

      // Listen for kb-progress - call global callback for ANY progress event
      this.socket.on('kb-progress', (data: KnowledgeBaseProgress) => {
        console.log('📡 KB-PROGRESS received:', data.status, data.progress, '%');
        console.log('🔔 Global callback exists:', !!this.globalCallback);
        if (this.globalCallback) {
          console.log('✅ Calling global callback with data');
          this.globalCallback(data);
        } else {
          console.log('⚠️ NO global callback set - events will be missed!');
        }
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from socket');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('❌ Socket connection error:', error);
      });

      this.socket.on('error', (error: any) => {
        console.error('❌ Socket error:', error);
      });
    } catch (error) {
      console.error('❌ Error connecting to socket:', error);
    }
  }

  // Set a global callback to receive ALL kb-progress events
  onProgress(callback: ProgressCallback): void {
    console.log('👂 Setting global KB progress callback');
    this.globalCallback = callback;
  }

  // Clear the global callback
  clearCallback(): void {
    this.globalCallback = null;
    console.log('🔇 Cleared global KB callback');
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.globalCallback = null;
      console.log('🔌 Socket disconnected');
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const knowledgeBaseSocket = new KnowledgeBaseSocketService();
export type { KnowledgeBaseProgress };
