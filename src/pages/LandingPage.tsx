import React, { useEffect, useState } from 'react'
import { Play, Users, ArrowRight, Info } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { generateRoomId } from '../utils/firebase'
interface LandingPageProps {
  onJoin: (roomId: string, username: string, isAdmin: boolean) => void
}
export function LandingPage({ onJoin }: LandingPageProps) {
  const [username, setUsername] = useState('')
  const [roomId, setRoomId] = useState('')
  const [mode, setMode] = useState<'initial' | 'create' | 'join'>('initial')
  // Check for room ID in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roomFromUrl = params.get('room')
    if (roomFromUrl) {
      setRoomId(roomFromUrl)
      setMode('join')
    }
  }, [])
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username) return
    const newRoomId = generateRoomId()
    onJoin(newRoomId, username, true)
  }
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !roomId) return
    onJoin(roomId.toUpperCase(), username, false)
  }
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 mb-6 shadow-xl shadow-violet-900/30">
            <Play size={32} fill="currentColor" className="text-white ml-1" />
          </div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">MegaWatch</h1>
          <p className="text-zinc-400 text-lg">
            Watch videos together in real-time sync.
          </p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          {mode === 'initial' && (
            <div className="space-y-4">
              <Button
                className="w-full h-14 text-lg"
                onClick={() => setMode('create')}
              >
                <Play size={20} className="mr-2" />
                Create New Room
              </Button>
              <Button
                variant="secondary"
                className="w-full h-14 text-lg"
                onClick={() => setMode('join')}
              >
                <Users size={20} className="mr-2" />
                Join Existing Room
              </Button>
            </div>
          )}

          {mode === 'create' && (
            <form
              onSubmit={handleCreate}
              className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Create a Room</h2>
                <p className="text-sm text-zinc-500">
                  Start a new watching session
                </p>
              </div>

              <Input
                label="Your Name"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMode('initial')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" disabled={!username} className="flex-[2]">
                  Create Room <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </form>
          )}

          {mode === 'join' && (
            <form
              onSubmit={handleJoin}
              className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Join a Room</h2>
                <p className="text-sm text-zinc-500">
                  Enter the room code to join
                </p>
              </div>

              <Input
                label="Room Code"
                placeholder="e.g. X7K9P2"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                autoFocus={!roomId}
              />

              <Input
                label="Your Name"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus={!!roomId}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMode('initial')
                    setRoomId('')
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!username || !roomId}
                  className="flex-[2]"
                >
                  Join Room <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center text-zinc-600 text-sm mt-2">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-3 text-xs space-y-1">
            <p className="text-zinc-500 flex items-center justify-center gap-1">
              <Info size={12} />
              Supported video sources:
            </p>
            <p className="text-zinc-400">
              ✅ YouTube videos (youtube.com, youtu.be)
            </p>
            <p className="text-zinc-400">
              ✅ Direct video URLs (.mp4, .webm, .ogg, .mov)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
