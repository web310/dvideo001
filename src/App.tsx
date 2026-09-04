/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UrlInputForm } from './components/UrlInputForm';
import { VideoDetailsCard } from './components/VideoDetailsCard';
import { FormatSelector } from './components/FormatSelector';
import { DownloadManager } from './components/DownloadManager';
import { DownloadHistory } from './components/DownloadHistory';
import { FeaturesFaq } from './components/FeaturesFaq';
import { VideoMetadata, VideoFormatOption, AudioFormatOption, DownloadHistoryItem } from './types';
import { AlertCircle, RefreshCw, Sparkles, Heart } from 'lucide-react';

const STORAGE_KEY = 'tubefetch_download_history_v1';

export default function App() {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialMode, setInitialMode] = useState<'direct' | 'record' | undefined>(undefined);

  // Format selection state
  const [selectedType, setSelectedType] = useState<'video' | 'audio'>('video');
  const [selectedVideoFormat, setSelectedVideoFormat] = useState<VideoFormatOption>({
    qualityLabel: '1080p Full HD',
    resolution: '1080p (Full HD)',
    container: 'mp4',
    fps: 60,
    hasAudio: true,
    hasVideo: true,
    approxSizeMb: 45.5,
    itag: 137
  });
  const [selectedAudioFormat, setSelectedAudioFormat] = useState<AudioFormatOption>({
    format: 'mp3',
    bitrate: '320 kbps',
    label: 'MP3 - Studio Master (320kbps)',
    approxSizeMb: 7.5,
    qualityBadge: 'Ultra High'
  });

  const [customFilename, setCustomFilename] = useState('');
  const [trimStart, setTrimStart] = useState('00:00');
  const [trimEnd, setTrimEnd] = useState('');
  const [enableTrim, setEnableTrim] = useState(false);

  // History state
  const [history, setHistory] = useState<DownloadHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check URL query params on initial mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('v') || params.get('id');
      const directUrl = params.get('url');
      const mode = params.get('mode');

      if (mode === 'record' || mode === 'direct') {
        setInitialMode(mode);
      }

      if (v) {
        handleFetchVideo(`https://www.youtube.com/watch?v=${v}`);
      } else if (directUrl) {
        handleFetchVideo(directUrl);
      }
    } catch (e) {
      console.warn('Could not parse initial URL parameters:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save history to localStorage:', e);
    }
  }, [history]);

  const handleFetchVideo = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/youtube/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch video information');
      }

      setMetadata(data);
      setCustomFilename(data.title);
      setTrimStart('00:00');
      setTrimEnd(data.formattedDuration || '');

      // Keep browser URL updated with the video ID
      try {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('v', data.id);
        const currentMode = urlParams.get('mode') || initialMode;
        if (currentMode) urlParams.set('mode', currentMode);
        window.history.replaceState(null, '', `?${urlParams.toString()}`);
      } catch (e) {
        console.warn('Could not update history state:', e);
      }

      // Set recommended default formats
      if (data.videoFormats && data.videoFormats.length > 0) {
        const defaultVideo = data.videoFormats.find((f: VideoFormatOption) => f.resolution.includes('1080p') && f.container === 'mp4') || data.videoFormats[0];
        setSelectedVideoFormat(defaultVideo);
      }

      if (data.audioFormats && data.audioFormats.length > 0) {
        const defaultAudio = data.audioFormats.find((a: AudioFormatOption) => a.bitrate.includes('320')) || data.audioFormats[0];
        setSelectedAudioFormat(defaultAudio);
      }

      // Smooth scroll to video details or recorder
      setTimeout(() => {
        const targetId = initialMode === 'record' ? 'web-live-recorder' : 'video-details-card';
        const target = document.getElementById(targetId) || document.getElementById('video-details-card');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);

    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Unable to retrieve YouTube video details. Please check the link and try again.');
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToHistory = (item: DownloadHistoryItem) => {
    setHistory((prev) => [item, ...prev.filter((h) => h.id !== item.id)].slice(0, 15));
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleLoadVideoById = (videoId: string) => {
    handleFetchVideo(`https://www.youtube.com/watch?v=${videoId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar activeVideoId={metadata?.id} />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* URL Input Form */}
        <UrlInputForm onFetch={handleFetchVideo} isLoading={isLoading} />

        {/* Error Alert */}
        {error && (
          <div id="error-alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-950 block">Conversion Error</span>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 font-semibold shrink-0 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Conversion Flow when metadata exists */}
        {metadata && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* 1. Video Details Header */}
            <VideoDetailsCard metadata={metadata} />

            {/* 2. Format & Resolution Selector */}
            <FormatSelector
              metadata={metadata}
              selectedType={selectedType}
              onSelectType={setSelectedType}
              selectedVideoFormat={selectedVideoFormat}
              onSelectVideoFormat={setSelectedVideoFormat}
              selectedAudioFormat={selectedAudioFormat}
              onSelectAudioFormat={setSelectedAudioFormat}
              customFilename={customFilename}
              onChangeCustomFilename={setCustomFilename}
              trimStart={trimStart}
              onChangeTrimStart={setTrimStart}
              trimEnd={trimEnd}
              onChangeTrimEnd={setTrimEnd}
              enableTrim={enableTrim}
              onToggleTrim={setEnableTrim}
            />

            {/* 3. Download Action Manager */}
            <DownloadManager
              metadata={metadata}
              selectedType={selectedType}
              selectedVideoFormat={selectedVideoFormat}
              selectedAudioFormat={selectedAudioFormat}
              customFilename={customFilename}
              initialMode={initialMode}
              onAddToHistory={handleAddToHistory}
            />
          </div>
        )}

        {/* Download History */}
        <DownloadHistory
          history={history}
          onClearHistory={handleClearHistory}
          onSelectVideoId={handleLoadVideoById}
        />

        {/* Features & FAQ Section */}
        <FeaturesFaq />

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} TubeFetch. For personal, offline, and educational use.</p>
          <div className="flex items-center gap-3 text-slate-600 font-medium">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">MP4 / WebM</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">MP3 320kbps</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">M4A / WAV</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
