import { initializeApp } from 'firebase/app'
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  remove,
  onDisconnect,
  serverTimestamp,
  get,
  onChildAdded,
} from 'firebase/database'
import { VideoState, ChatMessage } from './types'

/* ---------------- Firebase Config ---------------- */

const firebaseConfig = {
  apiKey: 'AIzaSyAhG2n_gjBNLJ9gYlgUcfSV5GVCvavETYg',
  authDomain: 'watchtogether-c7573.firebaseapp.com',
  projectId: 'watchtogether-c7573',
  storageBucket: 'watchtogether-c7573.firebasestorage.app',
  messagingSenderId: '278811149964',
  appId: '1:278811149964:web:8c6266cc0f4305ac96dda9',
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

/* ---------------- Room Service ---------------- */

export class RoomService {
  private roomId: string
  private userId: string
  private username: string

  private onVideoStateChange: (state: VideoState) => void
  private onChatMessage: (msg: ChatMessage) => void
  private onSyncState: (state: VideoState) => void
  private onError: (message: string) => void
  private onConnected: () => void

  private unsubscribers: (() => void)[] = []
  private isReady = false

  constructor(
    roomId: string,
    userId: string,
    username: string,
    _wsUrl: string, // kept for compatibility
    onVideoStateChange: (state: VideoState) => void,
    onChatMessage: (msg: ChatMessage) => void,
    onSyncState: (state: VideoState) => void,
    onError: (message: string) => void,
    onConnected: () => void,
    isAdmin: boolean,
  ) {
    this.roomId = roomId
    this.userId = userId
    this.username = username
    this.onVideoStateChange = onVideoStateChange
    this.onChatMessage = onChatMessage
    this.onSyncState = onSyncState
    this.onError = onError
    this.onConnected = onConnected

    this.init(isAdmin)
  }

  /* ---------------- INIT & VALIDATION ---------------- */

  private async init(isAdmin: boolean) {
    try {
      const metaRef = ref(database, `rooms/${this.roomId}/meta/created`)
      const snapshot = await get(metaRef)

      if (!snapshot.exists() && !isAdmin) {
        this.onError('Invalid Room ID')
        return
      }

      await this.connect()

      if (isAdmin && !snapshot.exists()) {
        await this.createRoom()
      }

      if (!isAdmin) {
        await this.joinRoom()
      }
    } catch (err) {
      console.error(err)
      this.onError('Failed to initialize room')
    }
  }

  /* ---------------- CONNECT ---------------- */

  private async connect() {
    try {
      const presenceRef = ref(
        database,
        `rooms/${this.roomId}/presence/${this.userId}`,
      )

      await set(presenceRef, {
        username: this.username,
        lastSeen: serverTimestamp(),
      })

      onDisconnect(presenceRef).remove()

      /* Video State Listener */
      const videoStateRef = ref(database, `rooms/${this.roomId}/videoState`)
      const videoUnsub = onValue(videoStateRef, (snap) => {
        if (snap.exists()) {
          this.onVideoStateChange(snap.val())
        }
      })
      this.unsubscribers.push(() => videoUnsub())

      /* Chat Listener (NO DUPLICATES) */
      const messagesRef = ref(database, `rooms/${this.roomId}/messages`)
      const chatUnsub = onChildAdded(messagesRef, (snap) => {
        this.onChatMessage(snap.val())
      })
      this.unsubscribers.push(() => chatUnsub())

      this.isReady = true
      this.onConnected()
    } catch (error) {
      console.error('Connect error:', error)
      this.onError('Failed to connect to room')
    }
  }

  /* ---------------- ROOM ACTIONS ---------------- */

  public async createRoom() {
    const roomRef = ref(database, `rooms/${this.roomId}`)

    await set(roomRef, {
      meta: {
        created: true,
        createdAt: serverTimestamp(),
      },
      videoState: {
        playing: false,
        time: 0,
        src: '',
        isYouTube: false,
      },
    })
  }

  public async joinRoom() {
    const roomRef = ref(database, `rooms/${this.roomId}`)
    const snapshot = await get(roomRef)

    if (!snapshot.exists()) {
      this.onError('Room not found')
      return
    }

    const videoState = snapshot.val().videoState
    if (videoState) {
      this.onSyncState(videoState)
    }
  }

  /* ---------------- EVENTS ---------------- */

  public async sendVideoState(
    type: 'PLAY' | 'PAUSE' | 'SEEK' | 'SET_VIDEO',
    payload: VideoState,
  ) {
    const videoStateRef = ref(database, `rooms/${this.roomId}/videoState`)
    await set(videoStateRef, payload)
  }

  public async sendChat(text: string) {
    const messagesRef = ref(database, `rooms/${this.roomId}/messages`)
    const msgRef = push(messagesRef)

    const msg: ChatMessage = {
      id: `${this.userId}-${Date.now()}`,
      userId: this.userId,
      username: this.username,
      text,
      timestamp: Date.now(),
    }

    await set(msgRef, msg)
  }

  /* ---------------- CLEANUP ---------------- */

  public async disconnect() {
    try {
      const presenceRef = ref(
        database,
        `rooms/${this.roomId}/presence/${this.userId}`,
      )
      await remove(presenceRef)

      this.unsubscribers.forEach((fn) => fn())
      this.unsubscribers = []

      const presenceListRef = ref(database, `rooms/${this.roomId}/presence`)
      const snapshot = await get(presenceListRef)

      if (!snapshot.exists()) {
        await remove(ref(database, `rooms/${this.roomId}`))
      }

      this.isReady = false
    } catch (err) {
      console.error('Disconnect error', err)
    }
  }

  public isConnected() {
    return this.isReady
  }
}

/* ---------------- HELPERS ---------------- */

export const generateRoomId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase()

export const generateUserId = () =>
  Math.random().toString(36).substring(2, 10)


export const getRandomColor = () => {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Detect if URL is YouTube
export const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

// Extract YouTube video ID
export const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

// Validate video URL
export const isValidVideoUrl = (url: string): boolean => {
  if (isYouTubeUrl(url)) return true

  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m3u8']
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext))
}
