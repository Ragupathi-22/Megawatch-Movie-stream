
# Firebase Setup Instructions

This application uses Firebase Realtime Database for real-time synchronization instead of WebSockets.

## Required Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "firebase": "^10.7.1"
  }
}
```

Install with:
```bash
npm install firebase
```

## Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Realtime Database**
4. Set database rules to allow anonymous access:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        "videoState": {
          ".validate": "newData.hasChildren(['playing', 'time', 'src', 'isYouTube'])"
        },
        "messages": {
          "$messageId": {
            ".validate": "newData.hasChildren(['id', 'userId', 'username', 'text', 'timestamp'])"
          }
        },
        "presence": {
          "$userId": {
            ".validate": "newData.hasChildren(['username', 'lastSeen'])"
          }
        }
      }
    }
  }
}
```

5. Get your Firebase config from Project Settings > General > Your apps
6. Replace the config in `utils/firebase.ts` with your actual config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

## How It Works

### Room Structure
```
/rooms
  /{roomId}
    /videoState
      - playing: boolean
      - time: number
      - src: string
      - isYouTube: boolean
    /messages
      /{messageId}
        - id: string
        - userId: string
        - username: string
        - text: string
        - timestamp: number
    /presence
      /{userId}
        - username: string
        - lastSeen: timestamp
```

### Features
- ✅ Real-time video sync across all users
- ✅ Real-time chat messages
- ✅ Automatic room cleanup when empty
- ✅ Presence tracking (who's in the room)
- ✅ No authentication required
- ✅ No permanent data storage
- ✅ Better reliability than WebSockets

### Advantages over WebSocket
1. **Auto-reconnection**: Firebase handles reconnection automatically
2. **Offline support**: Changes sync when connection restored
3. **No server maintenance**: Firebase handles infrastructure
4. **Better mobile support**: Works reliably on mobile networks
5. **Built-in presence**: Track who's online
6. **Automatic cleanup**: Rooms deleted when empty
