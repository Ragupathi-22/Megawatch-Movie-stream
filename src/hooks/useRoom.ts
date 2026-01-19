import { useState, useEffect, useRef } from 'react'
import { RoomService, generateUserId } from '../utils/firebase'
import { ChatMessage, VideoState } from '../utils/types'

// Dummy URL for compatibility (not used with Firebase)
const FIREBASE_URL = 'firebase'

export function useRoom(roomId: string, username: string, isAdmin: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [videoState, setVideoState] = useState<VideoState>({
    playing: false,
    time: 0,
    src: '',
    isYouTube: false,
  })
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string>('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [roomError, setRoomError] = useState<string>('')

  const userId = useRef(generateUserId()).current
  const service = useRef<RoomService | null>(null)
  const hasJoinedRoom = useRef(false)
  const processedMessageIds = useRef(new Set<string>())

  useEffect(() => {
    if (!roomId || !username) return

    const handleVideoStateChange = (state: VideoState) => {
      // console.log('Video state changed:', state)
      setVideoState(state)
    }

    const handleChatMessage = (msg: ChatMessage) => {
      // console.log('Chat message received:', msg)

      // Prevent duplicate messages
      if (processedMessageIds.current.has(msg.id)) {
        return
      }

      processedMessageIds.current.add(msg.id)

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.id)
        if (exists) return prev
        return [...prev, msg]
      })

      // Increment unread if message is from someone else
      if (msg.userId !== userId) {
        setUnreadCount((prev) => prev + 1)
      }
    }

    const handleSyncState = (state: VideoState) => {
      // console.log('Syncing state:', state)
      setVideoState(state)
    }

    const handleError = (message: string) => {
      // console.error('Room error:', message)
      setRoomError(message)
      setConnectionError(message)
    }

    const handleConnected = () => {
      // console.log('Firebase ready, joining room...')
      setConnected(true)

      // Only join once when connection is ready
      if (!hasJoinedRoom.current) {
        hasJoinedRoom.current = true
        if (isAdmin) {
          service.current?.createRoom()
        } else {
          service.current?.joinRoom()
        }
      }
    }

    // Add join message for self
    setMessages([
      {
        id: 'system-join-self',
        userId: 'system',
        username: 'System',
        text: `You joined the room as ${isAdmin ? 'Admin' : 'Guest'}`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ])

    // Create service
service.current = new RoomService(
  roomId,
  userId,
  username,
  FIREBASE_URL,
  handleVideoStateChange,
  handleChatMessage,
  handleSyncState,
  handleError,
  handleConnected,
  isAdmin, // ✅ REQUIRED
)


    return () => {
      service.current?.disconnect()
      hasJoinedRoom.current = false
      processedMessageIds.current.clear()
    }
  }, [roomId, username, isAdmin, userId])

  const sendChat = (text: string) => {
    // Send to Firebase - Firebase will broadcast to all clients including sender
    service.current?.sendChat(text)
  }

  const updateVideoState = (
    type: 'PLAY' | 'PAUSE' | 'SEEK' | 'SET_VIDEO',
    newState: Partial<VideoState>,
  ) => {
    const updatedState: VideoState = {
      ...videoState,
      ...newState,
    }
    setVideoState(updatedState)
    service.current?.sendVideoState(type, updatedState)
  }

  const clearUnread = () => {
    setUnreadCount(0)
  }

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
    clearUnread,
  }
}
