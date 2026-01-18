import React, { useState } from 'react';
import { Link2, CheckCircle, Youtube, Video } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { isYouTubeUrl, isValidVideoUrl, getYouTubeVideoId } from '../utils/socket';
interface AdminControlsProps {
  onVideoChange: (url: string, isYouTube: boolean) => void;
}
export function AdminControls({
  onVideoChange
}: AdminControlsProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [detectedType, setDetectedType] = useState<'youtube' | 'direct' | null>(null);
  const detectVideoType = (url: string) => {
    if (!url) {
      setDetectedType(null);
      return;
    }
    if (isYouTubeUrl(url)) {
      setDetectedType('youtube');
    } else if (isValidVideoUrl(url)) {
      setDetectedType('direct');
    } else {
      setDetectedType(null);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('URL must start with http:// or https://');
      return;
    }
    if (isYouTubeUrl(url)) {
      const videoId = getYouTubeVideoId(url);
      if (!videoId) {
        setError('Invalid YouTube URL');
        return;
      }
      setError('');
      setSuccess(true);
      onVideoChange(url, true);
    } else if (isValidVideoUrl(url)) {
      setError('');
      setSuccess(true);
      onVideoChange(url, false);
    } else {
      setError('Please use a YouTube link or direct video URL (.mp4, .webm, .ogg, .mov, .m3u8)');
      return;
    }
    setTimeout(() => setSuccess(false), 3000);
  };
  return <div className="bg-zinc-900 border-b border-zinc-800 p-4">
      <form onSubmit={handleSubmit} className="flex gap-4 items-start max-w-4xl mx-auto">
        <div className="flex-1">
          <div className="relative">
            <Input placeholder="YouTube link or Google Cloud Storage video URL" value={url} onChange={e => {
            setUrl(e.target.value);
            setError('');
            setSuccess(false);
            detectVideoType(e.target.value);
          }} icon={<Link2 size={16} />} error={error} />
            {detectedType && <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs">
                {detectedType === 'youtube' ? <>
                    <Youtube size={14} className="text-red-500" />
                    <span className="text-red-500">YouTube</span>
                  </> : <>
                    <Video size={14} className="text-blue-500" />
                    <span className="text-blue-500">Direct Video</span>
                  </>}
              </div>}
          </div>

          <div className="text-xs text-zinc-500 mt-2 ml-1 space-y-1">
            <p className="flex items-center gap-1">
              <Youtube size={10} className="text-red-500" />
              YouTube: https://youtube.com/watch?v=... or https://youtu.be/...
            </p>
            <p className="flex items-center gap-1">
              <Video size={10} className="text-blue-500" />
              Direct: https://storage.googleapis.com/.../video.mp4
            </p>
          </div>

          {success && <p className="text-xs text-green-500 mt-2 ml-1 flex items-center gap-1">
              <CheckCircle size={12} />
              Video loaded successfully!
            </p>}
        </div>
        <Button type="submit" variant="secondary">
          Load Video
        </Button>
      </form>
    </div>;
}