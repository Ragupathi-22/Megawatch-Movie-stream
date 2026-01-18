import React, { useEffect, useState, useRef, createElement } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader2,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import { VideoState } from '../utils/types'
import { getYouTubeVideoId } from '../utils/socket'
interface VideoPlayerProps {
  videoState: VideoState
  onUpdateState: (
    type: 'PLAY' | 'PAUSE' | 'SEEK',
    state: Partial<VideoState>,
  ) => void
}
export function VideoPlayer({ videoState, onUpdateState }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const youtubePlayerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [youtubeReady, setYoutubeReady] = useState(false)
  const controlsTimeoutRef = useRef<number | null>(null)
  const isSyncing = useRef(false)
  // Load YouTube API
  useEffect(() => {
    if (!videoState.isYouTube) return
    if (!(window as any).YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
      ;(window as any).onYouTubeIframeAPIReady = () => {
        setYoutubeReady(true)
      }
    } else {
      setYoutubeReady(true)
    }
  }, [videoState.isYouTube])
  // Initialize YouTube player
  useEffect(() => {
    if (!videoState.isYouTube || !youtubeReady || !videoState.src) return
    const videoId = getYouTubeVideoId(videoState.src)
    if (!videoId) return
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.loadVideoById(videoId)
      return
    }
    youtubePlayerRef.current = new (window as any).YT.Player('youtube-player', {
      videoId,
      playerVars: {
        controls: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: () => {
          console.log('YouTube player ready')
        },
        onStateChange: (event: any) => {
          const state = event.data
          if (isSyncing.current) return
          // 1 = playing, 2 = paused
          if (state === 1) {
            const time = youtubePlayerRef.current.getCurrentTime()
            onUpdateState('PLAY', {
              playing: true,
              time,
            })
          } else if (state === 2) {
            const time = youtubePlayerRef.current.getCurrentTime()
            onUpdateState('PAUSE', {
              playing: false,
              time,
            })
          }
        },
      },
    })
  }, [videoState.isYouTube, youtubeReady, videoState.src])
  // Sync YouTube player with state
  useEffect(() => {
    if (!videoState.isYouTube || !youtubePlayerRef.current) return
    isSyncing.current = true
    if (videoState.playing) {
      youtubePlayerRef.current.playVideo()
    } else {
      youtubePlayerRef.current.pauseVideo()
    }
    const currentTime = youtubePlayerRef.current.getCurrentTime()
    if (Math.abs(currentTime - videoState.time) > 1) {
      youtubePlayerRef.current.seekTo(videoState.time, true)
    }
    setTimeout(() => {
      isSyncing.current = false
    }, 500)
  }, [videoState.playing, videoState.time, videoState.isYouTube])
  // Sync HTML5 video with state
  useEffect(() => {
    if (videoState.isYouTube || !videoRef.current || !videoState.src) return
    const video = videoRef.current
    isSyncing.current = true
    // Sync playing state
    if (videoState.playing && video.paused) {
      video.play().catch((err) => console.error('Play failed:', err))
    } else if (!videoState.playing && !video.paused) {
      video.pause()
    }
    // Sync time if difference is significant
    if (Math.abs(video.currentTime - videoState.time) > 1) {
      video.currentTime = videoState.time
    }
    setTimeout(() => {
      isSyncing.current = false
    }, 500)
  }, [
    videoState.playing,
    videoState.time,
    videoState.isYouTube,
    videoState.src,
  ])
  // Handle local play/pause
  const handlePlayPause = () => {
    if (isSyncing.current) return
    if (videoState.isYouTube && youtubePlayerRef.current) {
      const time = youtubePlayerRef.current.getCurrentTime()
      onUpdateState(videoState.playing ? 'PAUSE' : 'PLAY', {
        playing: !videoState.playing,
        time,
      })
    } else if (videoRef.current) {
      const time = videoRef.current.currentTime
      onUpdateState(videoState.playing ? 'PAUSE' : 'PLAY', {
        playing: !videoState.playing,
        time,
      })
    }
  }
  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    onUpdateState('SEEK', {
      time,
    })
  }
  // Handle time update
  const handleTimeUpdate = () => {
    if (isSyncing.current) return
    if (videoState.isYouTube && youtubePlayerRef.current) {
      const time = youtubePlayerRef.current.getCurrentTime()
      const dur = youtubePlayerRef.current.getDuration()
      setProgress(time)
      setDuration(dur)
    } else if (videoRef.current) {
      setProgress(videoRef.current.currentTime)
    }
  }
  // Update progress for YouTube
  useEffect(() => {
    if (!videoState.isYouTube || !youtubePlayerRef.current) return
    const interval = setInterval(() => {
      if (youtubePlayerRef.current && videoState.playing) {
        handleTimeUpdate()
      }
    }, 100)
    return () => clearInterval(interval)
  }, [videoState.isYouTube, videoState.playing])
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsLoading(false)
    }
  }
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (videoState.playing) setShowControls(false)
    }, 3000)
  }
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  // Add skip function
  const handleSkip = (seconds: number) => {
    let newTime: number
    if (videoState.isYouTube && youtubePlayerRef.current) {
      const currentTime = youtubePlayerRef.current.getCurrentTime()
      newTime = Math.max(0, Math.min(currentTime + seconds, duration))
    } else if (videoRef.current) {
      newTime = Math.max(
        0,
        Math.min(videoRef.current.currentTime + seconds, duration),
      )
    } else {
      return
    }
    onUpdateState('SEEK', {
      time: newTime,
    })
  }
  if (!videoState.src) {
    return (
      <div className="relative group bg-black aspect-video w-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-zinc-800">
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/50">
          <div className="p-4 rounded-full bg-zinc-800/50 mb-4">
            <Play className="w-8 h-8 opacity-50" />
          </div>
          <p>No video selected</p>
          <p className="text-sm opacity-50 mt-2">Admin needs to paste a link</p>
        </div>
      </div>
    )
  }
  return (
    <div
      ref={containerRef}
      className="relative group bg-black aspect-video w-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-zinc-800"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => videoState.playing && setShowControls(false)}
    >
      {videoState.isYouTube ? (
        <div id="youtube-player" className="w-full h-full" />
      ) : (
        <video
          ref={videoRef}
          src={videoState.src}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onCanPlay={() => setIsLoading(false)}
          onClick={handlePlayPause}
          crossOrigin="anonymous"
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
          <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        </div>
      )}

      <div
        className={`
          absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent
          flex flex-col justify-end p-4 transition-opacity duration-300
          ${showControls || !videoState.playing ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <div className="w-full mb-4 flex items-center gap-2">
          <span className="text-xs text-white/80 font-mono w-10 text-right">
            {formatTime(progress)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
          />
          <span className="text-xs text-white/80 font-mono w-10">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {videoState.playing ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" />
              )}
            </button>

            {/* Skip buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSkip(-30)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all flex items-center gap-1 text-xs"
                title="Rewind 30 seconds"
              >
                <SkipBack size={18} />
                <span className="hidden sm:inline">30s</span>
              </button>
              <button
                onClick={() => handleSkip(30)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all flex items-center gap-1 text-xs"
                title="Forward 30 seconds"
              >
                <span className="hidden sm:inline">30s</span>
                <SkipForward size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={() => {
                  const newMuted = !isMuted
                  setIsMuted(newMuted)
                  if (videoRef.current) {
                    videoRef.current.muted = newMuted
                  }
                }}
                className="text-white/80 hover:text-white"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              {!videoState.isYouTube && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    setVolume(val)
                    if (videoRef.current) {
                      videoRef.current.volume = val
                      videoRef.current.muted = false
                    }
                    setIsMuted(val === 0)
                  }}
                  className="w-0 overflow-hidden group-hover/vol:w-20 transition-all h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              )}
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-white/80 hover:text-white p-2"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
    </div>
  )
}
