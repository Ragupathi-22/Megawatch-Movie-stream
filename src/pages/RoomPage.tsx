import React, { useEffect, useState } from 'react';
import { Copy, Check, LogOut, Info, AlertCircle } from 'lucide-react';
import { useRoom } from '../hooks/useRoom';
import { VideoPlayer } from '../components/VideoPlayer';
import { ChatPanel } from '../components/ChatPanel';
import { AdminControls } from '../components/AdminControls';
import { Button } from '../components/ui/Button';
interface RoomPageProps {
  roomId: string;
  username: string;
  isAdmin: boolean;
  onLeave: () => void;
}
export function RoomPage({
  roomId,
  username,
  isAdmin,
  onLeave
}: RoomPageProps) {
  const {
    connected,
    connectionError,
    roomError,
    messages,
    videoState,
    unreadCount,
    sendChat,
    updateVideoState,
    clearUnread
  } = useRoom(roomId, username, isAdmin);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  // If room error (invalid room), show error and go back
  useEffect(() => {
    if (roomError) {
      setTimeout(() => {
        alert(`Error: ${roomError}. Returning to home.`);
        onLeave();
      }, 1000);
    }
  }, [roomError, onLeave]);
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleVideoChange = (url: string, isYouTube: boolean) => {
    updateVideoState('SET_VIDEO', {
      src: url,
      isYouTube,
      playing: false,
      time: 0
    });
  };
  // Show error screen if room is invalid
  if (roomError) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold">Room Not Found</h2>
          <p className="text-zinc-400">{roomError}</p>
          <p className="text-zinc-500 text-sm">Redirecting to home...</p>
        </div>
      </div>;
  }
  return <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              TogetherPlay
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
              {roomId}
            </span>
          </div>
          <button onClick={copyRoomId} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Copy Room ID">
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex items-center gap-4">
          {connectionError && !roomError && <div className="flex items-center gap-2 text-xs text-amber-500">
              <Info size={14} />
              {connectionError}
            </div>}
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            {connected ? 'Connected' : 'Connecting...'}
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <Button variant="ghost" size="sm" onClick={onLeave} className="text-zinc-400 hover:text-red-400">
            <LogOut size={16} className="mr-2" />
            Leave
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Video Area */}
        <div className="flex-1 flex flex-col bg-black relative overflow-y-auto">
          {isAdmin && <AdminControls onVideoChange={handleVideoChange} />}

          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-5xl mx-auto">
              <VideoPlayer videoState={videoState} onUpdateState={updateVideoState} />

              {!videoState.src && isAdmin && <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <p className="text-sm text-zinc-400 text-center">
                    👆 Paste a YouTube or video URL above to get started
                  </p>
                  <p className="text-xs text-zinc-600 text-center mt-2">
                    Try:
                    https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
                  </p>
                </div>}

              {!videoState.src && !isAdmin && <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <p className="text-sm text-zinc-400 text-center">
                    Waiting for admin to load a video...
                  </p>
                </div>}
            </div>
          </div>
        </div>

        {/* Chat Panel - Desktop only (mobile uses floating bottom sheet) */}
        {!isMobile && <div className="h-full w-80 lg:w-96 shrink-0">
            <ChatPanel messages={messages} onSendMessage={sendChat} username={username} unreadCount={unreadCount} onClearUnread={clearUnread} isMobile={false} />
          </div>}

        {/* Chat Panel - Mobile (floating bottom sheet) */}
        {isMobile && <ChatPanel messages={messages} onSendMessage={sendChat} username={username} unreadCount={unreadCount} onClearUnread={clearUnread} isMobile={true} />}
      </div>
    </div>;
}
