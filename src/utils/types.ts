export type User = {
  id: string;
  username: string;
  isAdmin: boolean;
  color: string;
};

// WebSocket message types matching the server protocol
export type WSMessageType = 'CREATE_ROOM' | 'JOIN_ROOM' | 'PLAY' | 'PAUSE' | 'SEEK' | 'SET_VIDEO' | 'CHAT' | 'SYNC_STATE' | 'ROOM_CREATED' | 'ERROR';
export interface WSMessage {
  type: WSMessageType;
  roomId?: string;
  payload?: any;
}
export interface VideoState {
  playing: boolean;
  time: number;
  src: string;
  isYouTube?: boolean;
}
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}
export type ChatItem = ChatMessage;