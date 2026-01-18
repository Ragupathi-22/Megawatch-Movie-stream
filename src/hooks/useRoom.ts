import { useState, useEffect, useRef } from 'react';
import { RoomService, generateUserId } from '../utils/socket';
import { ChatMessage, VideoState } from '../utils/types';

// WebSocket URL - using wss:// for secure WebSocket connection
const WS_URL = 'wss://movie-sync-server-wv0d.onrender.com';
export function useRoom(roomId: string, username: string, isAdmin: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [videoState, setVideoState] = useState<VideoState>({
    playing: false,
    time: 0,
    src: '',
    isYouTube: false
  });
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [roomError, setRoomError] = useState<string>('');
  const userId = useRef(generateUserId()).current;
  const service = useRef<RoomService | null>(null);
  const connectionCheckInterval = useRef<number | null>(null);
  const hasJoinedRoom = useRef(false);
  useEffect(() => {
    if (!roomId || !username) return;
    const handleVideoStateChange = (state: VideoState) => {
      // console.log('Video state changed:', state);
      setVideoState(state);
    };
    const handleChatMessage = (msg: ChatMessage) => {
      // console.log('Chat message received:', msg);
      // Only add message if it's not already in the list (prevent duplicates)
      setMessages(prev => {
        const exists = prev.some(m => m.id === msg.id);
        if (exists) return prev;
        return [...prev, msg];
      });

      // Increment unread if message is from someone else
      if (msg.userId !== userId) {
        setUnreadCount(prev => prev + 1);
      }
    };
    const handleSyncState = (state: VideoState) => {
      // console.log('Syncing state:', state);
      setVideoState(state);
    };
    const handleError = (message: string) => {
      console.error('Room error:', message);
      setRoomError(message);
      setConnectionError(message);
    };
    const handleConnected = () => {
      // console.log('WebSocket ready, joining room...');
      setConnected(true);

      // Only join once when connection is ready
      if (!hasJoinedRoom.current) {
        hasJoinedRoom.current = true;
        if (isAdmin) {
          service.current?.createRoom();
        } else {
          service.current?.joinRoom();
        }
      }
    };

    // Add join message for self
    setMessages([{
      id: 'system-join-self',
      userId: 'system',
      username: 'System',
      text: `You joined the room as ${isAdmin ? 'Admin' : 'Guest'}`,
      timestamp: Date.now(),
      isSystem: true
    }]);

    // Create service
    service.current = new RoomService(roomId, userId, username, WS_URL, handleVideoStateChange, handleChatMessage, handleSyncState, handleError, handleConnected);

    // Check connection status
    connectionCheckInterval.current = window.setInterval(() => {
      if (service.current) {
        const isConnected = service.current.isConnected();
        setConnected(isConnected);
        if (!isConnected && !roomError) {
          setConnectionError('Disconnected. Attempting to reconnect...');
        } else if (isConnected && !roomError) {
          setConnectionError('');
        }
      }
    }, 1000);
    return () => {
      if (connectionCheckInterval.current) {
        window.clearInterval(connectionCheckInterval.current);
      }
      service.current?.disconnect();
      hasJoinedRoom.current = false;
    };
  }, [roomId, username, isAdmin, userId]);
  const sendChat = (text: string) => {
    // Send to server - server will broadcast to all clients including sender
    service.current?.sendChat(text);

    // DO NOT add locally - wait for server broadcast to avoid duplicates
  };
  const updateVideoState = (type: 'PLAY' | 'PAUSE' | 'SEEK' | 'SET_VIDEO', newState: Partial<VideoState>) => {
    const updatedState: VideoState = {
      ...videoState,
      ...newState
    };
    setVideoState(updatedState);
    service.current?.sendVideoState(type, updatedState);
  };
  const clearUnread = () => {
    setUnreadCount(0);
  };
  return {
    userId,
    connected,
    connectionError,
    roomError,
    messages,
    videoState,
    unreadCount,
    sendChat,
    updateVideoState,
    clearUnread
  };
}