import { WSMessage, VideoState, ChatMessage } from './types';
export class RoomService {
  private ws: WebSocket | null = null;
  private roomId: string;
  private userId: string;
  private username: string;
  private onVideoStateChange: (state: VideoState) => void;
  private onChatMessage: (msg: ChatMessage) => void;
  private onSyncState: (state: VideoState) => void;
  private onError: (message: string) => void;
  private onConnected: () => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private wsUrl: string;
  private messageQueue: WSMessage[] = [];
  private isReady = false;
  constructor(roomId: string, userId: string, username: string, wsUrl: string, onVideoStateChange: (state: VideoState) => void, onChatMessage: (msg: ChatMessage) => void, onSyncState: (state: VideoState) => void, onError: (message: string) => void, onConnected: () => void) {
    this.roomId = roomId;
    this.userId = userId;
    this.username = username;
    this.wsUrl = wsUrl;
    this.onVideoStateChange = onVideoStateChange;
    this.onChatMessage = onChatMessage;
    this.onSyncState = onSyncState;
    this.onError = onError;
    this.onConnected = onConnected;
    this.connect();
  }
  private connect() {
    try {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => {
        // console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.isReady = true;

        // Flush queued messages
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          if (msg) {
            this.send(msg);
          }
        }

        // Notify that connection is ready
        this.onConnected();
      };
      this.ws.onmessage = event => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          // console.log('Received:', data);
          switch (data.type) {
            case 'SYNC_STATE':
              if (data.payload) {
                this.onSyncState(data.payload);
              }
              break;
            case 'PLAY':
            case 'PAUSE':
            case 'SEEK':
            case 'SET_VIDEO':
              if (data.payload) {
                this.onVideoStateChange(data.payload);
              }
              break;
            case 'CHAT':
              if (data.payload) {
                this.onChatMessage(data.payload);
              }
              break;
            case 'ROOM_CREATED':
              // console.log('Room created:', data.roomId);
              break;
            case 'ERROR':
              console.error('Server error:', data.payload?.message);
              this.onError(data.payload?.message || 'Unknown error');
              break;
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };
      this.ws.onerror = error => {
        console.error('WebSocket error:', error);
      };
      this.ws.onclose = () => {
        // console.log('WebSocket disconnected');
        this.isReady = false;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.attemptReconnect();
    }
  }
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.onError('Failed to connect to server');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    // console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, delay);
  }
  public createRoom() {
    this.send({
      type: 'CREATE_ROOM',
      roomId: this.roomId
    });
  }
  public joinRoom() {
    this.send({
      type: 'JOIN_ROOM',
      roomId: this.roomId
    });
  }
  public sendVideoState(type: 'PLAY' | 'PAUSE' | 'SEEK' | 'SET_VIDEO', payload: VideoState) {
    this.send({
      type,
      roomId: this.roomId,
      payload
    });
  }
  public sendChat(text: string) {
    const chatMsg: ChatMessage = {
      id: `${this.userId}-${Date.now()}`,
      userId: this.userId,
      username: this.username,
      text,
      timestamp: Date.now()
    };
    this.send({
      type: 'CHAT',
      roomId: this.roomId,
      payload: chatMsg
    });
  }
  private send(message: WSMessage) {
    // Queue message if not connected yet
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // console.log('WebSocket not ready, queueing message:', message.type);
      this.messageQueue.push(message);
      return;
    }
    try {
      this.ws.send(JSON.stringify(message));
      // console.log('Sent:', message.type);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }
  public disconnect() {
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isReady = false;
    this.messageQueue = [];
  }
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN && this.isReady;
  }
}
export const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};
export const generateUserId = () => {
  return Math.random().toString(36).substring(2, 10);
};
export const getRandomColor = () => {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Detect if URL is YouTube
export const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Extract YouTube video ID
export const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/, /youtube\.com\/embed\/([^&\n?#]+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Validate video URL
export const isValidVideoUrl = (url: string): boolean => {
  if (isYouTubeUrl(url)) return true;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m3u8'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};