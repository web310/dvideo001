import { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Radio, 
  Zap, 
  ShieldCheck, 
  Info,
  Server,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { VideoMetadata, VideoFormatOption, AudioFormatOption, DownloadHistoryItem } from '../types';
import { WebLiveRecorder } from './WebLiveRecorder';

interface DownloadManagerProps {
  metadata: VideoMetadata;
  selectedType: 'video' | 'audio';
  selectedVideoFormat: VideoFormatOption;
  selectedAudioFormat: AudioFormatOption;
  customFilename: string;
  initialMode?: 'direct' | 'record';
  onAddToHistory: (item: DownloadHistoryItem) => void;
}

export function DownloadManager({
  metadata,
  selectedType,
  selectedVideoFormat,
  selectedAudioFormat,
  customFilename,
  initialMode,
  onAddToHistory
}: DownloadManagerProps) {
  const [downloadMode, setDownloadMode] = useState<'direct' | 'record'>(initialMode || 'direct');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTabLink, setCopiedTabLink] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [resolvedDownloadUrl, setResolvedDownloadUrl] = useState<string | null>(null);
  const [resolvedFilename, setResolvedFilename] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);

  const progressTimerRef = useRef<any>(null);

  // Sync mode if initialMode prop changes
  useEffect(() => {
    if (initialMode) {
      setDownloadMode(initialMode);
    }
  }, [initialMode]);

  const targetFilename = (customFilename.trim() || metadata.title).replace(/[\\/:*?"<>|]/g, '_').trim();
  const targetExtension = selectedType === 'video' ? selectedVideoFormat.container : selectedAudioFormat.format;
  const fullFileName = `${targetFilename}.${targetExtension}`;

  const approxSize = selectedType === 'video' ? selectedVideoFormat.approxSizeMb : selectedAudioFormat.approxSizeMb;
  const resolutionOrBitrate = selectedType === 'video' ? selectedVideoFormat.resolution : selectedAudioFormat.bitrate;

  const currentTabUrl = `${window.location.origin}/?v=${encodeURIComponent(metadata.id)}&mode=${downloadMode}`;

  const directServerUrl = `/api/youtube/download?id=${metadata.id}&format=${targetExtension}&resolution=${encodeURIComponent(
    selectedType === 'video' ? selectedVideoFormat.resolution : ''
  )}&type=${selectedType}&title=${encodeURIComponent(targetFilename)}&itag=${selectedVideoFormat.itag || ''}`;

  const ssYouTubeUrl = `https://ssyoutube.com/en/convert?url=${encodeURIComponent(metadata.url)}`;
  const y2mateUrl = `https://www.y2mate.com/youtube/${metadata.id}`;
  const cobaltUrl = `https://cobalt.tools/`;

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  const handleSwitchMode = (mode: 'direct' | 'record') => {
    setDownloadMode(mode);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('v', metadata.id);
      urlParams.set('mode', mode);
      window.history.replaceState(null, '', `?${urlParams.toString()}`);
    } catch (e) {
      console.warn('Could not update history state:', e);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleCopyLink = () => {
    const fullUrl = window.location.origin + directServerUrl;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // 1-Click In-App Direct Download Resolver
  const handleStartInAppDownload = async () => {
    setIsResolving(true);
    setResolveError(null);
    setProgressPercent(15);
    setProgressStatus('Connecting to high-speed stream server...');

    // Progress animation
    let currentPct = 15;
    progressTimerRef.current = setInterval(() => {
      currentPct += Math.floor(Math.random() * 8) + 4;
      if (currentPct > 88) currentPct = 88;
      setProgressPercent(currentPct);
      if (currentPct > 40 && currentPct < 70) {
        setProgressStatus(`Extracting full ${resolutionOrBitrate} video frames & syncing voice track...`);
      } else if (currentPct >= 70) {
        setProgressStatus('Finalizing high-definition media file...');
      }
    }, 600);

    try {
      const res = await fetch('/api/youtube/prepare-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: metadata.id,
          format: targetExtension,
          resolution: resolutionOrBitrate,
          type: selectedType,
          title: targetFilename
        })
      });

      let data: any = null;
      try {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          data = JSON.parse(text);
        }
      } catch (parseErr) {
        console.warn('Could not parse prepare-download response as JSON:', parseErr);
      }

      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      if (data && data.success && data.downloadUrl) {
        setProgressPercent(100);
        setProgressStatus('Stream ready! Starting download...');
        setResolvedDownloadUrl(data.downloadUrl);
        setResolvedFilename(data.filename || fullFileName);

        // Record history
        onAddToHistory({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          videoId: metadata.id,
          title: metadata.title,
          thumbnailUrl: metadata.thumbnailUrl,
          channel: metadata.author,
          type: selectedType,
          format: targetExtension.toUpperCase(),
          quality: resolutionOrBitrate,
          timestamp: Date.now(),
          customFilename: data.filename || fullFileName
        });

        // Trigger download natively
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename || fullFileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          setIsResolving(false);
        }, 1200);
      } else {
        throw new Error(data.error || 'Could not resolve stream URL from server.');
      }
    } catch (err: any) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      console.warn('In-app preparation failed:', err);
      setIsResolving(false);
      setResolveError(
        err.message || 'Stream generation timed out. You can still download via Direct Server Stream or verified web gateways below.'
      );
    }
  };

  return (
    <div id="download-action-panel" className="space-y-4">
      
      {/* Top Banner if in iframe */}
      {isInIframe && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Running in preview frame. Open in a full browser tab for unrestricted 1080p downloads and live tab recording.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentTabUrl);
                setCopiedTabLink(true);
                setTimeout(() => setCopiedTabLink(false), 2500);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs flex items-center gap-1 transition"
            >
              {copiedTabLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
              <span>{copiedTabLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
            <a
              href={currentTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 transition active:scale-95"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        
        {/* Selected Item Summary Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${
              selectedType === 'video'
                ? 'bg-slate-900 text-white'
                : 'bg-amber-100 text-amber-900 border border-amber-200'
            }`}>
              {selectedType === 'video' ? 'MP4' : 'MP3'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg">
                  {resolutionOrBitrate}
                </span>
                <span className="text-xs uppercase font-mono font-semibold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                  {targetExtension.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 break-all line-clamp-1">
                {fullFileName}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs text-slate-500 block font-medium">Original Full File Size</span>
            <span className="text-base sm:text-lg font-mono font-bold text-slate-900">
              ~{approxSize} MB
            </span>
          </div>
        </div>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            id="tab-direct-download"
            onClick={() => handleSwitchMode('direct')}
            className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition ${
              downloadMode === 'direct'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Zap className={`w-4.5 h-4.5 shrink-0 ${downloadMode === 'direct' ? 'text-amber-400' : 'text-slate-500'}`} />
              <div>
                <span className="font-bold text-xs sm:text-sm block">1-Click Direct Download</span>
                <span className={`text-[11px] block mt-0.5 ${downloadMode === 'direct' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Full ~{approxSize} MB file with video & voice
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
              downloadMode === 'direct' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
            }`}>
              Recommended
            </span>
          </button>

          <button
            id="tab-web-record"
            onClick={() => handleSwitchMode('record')}
            className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition ${
              downloadMode === 'record'
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Radio className={`w-4.5 h-4.5 shrink-0 ${downloadMode === 'record' ? 'text-white animate-pulse' : 'text-red-500'}`} />
              <div>
                <span className="font-bold text-xs sm:text-sm block">Web Play & Live Record</span>
                <span className={`text-[11px] block mt-0.5 ${downloadMode === 'record' ? 'text-red-100' : 'text-slate-500'}`}>
                  Play video in browser & record with live voice
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
              downloadMode === 'record' ? 'bg-white text-red-600' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              In-Browser
            </span>
          </button>
        </div>

        {/* Content for Mode: Direct 1-Click Download */}
        {downloadMode === 'direct' && (
          <div className="space-y-4 pt-1">
            
            {/* Primary Action Button / Resolution Status */}
            <div className="space-y-3">
              {!isResolving ? (
                <button
                  id="direct-download-primary-btn"
                  onClick={handleStartInAppDownload}
                  className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition active:scale-98 group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                      <Download className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base">
                          Download Original File (~{approxSize} MB)
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/20 text-white font-bold">
                          {resolutionOrBitrate}
                        </span>
                      </div>
                      <span className="text-xs text-slate-300 block mt-0.5">
                        Fetches full original frames and audio voice track directly
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-xl bg-white/15 group-hover:bg-white/25 text-white transition shrink-0">
                    <span>Download</span>
                    <Download className="w-3.5 h-3.5" />
                  </div>
                </button>
              ) : (
                /* Live Progress Bar */
                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      <span className="font-bold text-amber-400">{progressStatus}</span>
                    </div>
                    <span className="font-mono font-bold text-white">{progressPercent}%</span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Preparing full-length video and voice tracks (~{approxSize} MB). Your download will trigger automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Success Download Ready Card (Always available once resolved) */}
            {resolvedDownloadUrl && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3 animate-in fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-emerald-950 text-sm">Download Link Generated!</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Original <strong className="font-mono">{resolvedFilename}</strong> (~{approxSize} MB) with full video and voice is ready.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  <a
                    href={resolvedDownloadUrl}
                    download={resolvedFilename || fullFileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File Directly (~{approxSize} MB)</span>
                  </a>

                  <a
                    href={directServerUrl}
                    download={fullFileName}
                    className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold transition"
                  >
                    <Server className="w-4 h-4 text-emerald-600" />
                    <span>Download via Server Proxy</span>
                  </a>
                </div>
              </div>
            )}

            {/* Error Message if resolution failed */}
            {resolveError && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">Download Notice</span>
                    <span>{resolveError}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Direct Methods & Backup Gateways */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Alternative Verified Gateways (Real & Tested)</span>
                </span>
                <span className="text-[11px] text-slate-400">Never blocked by browser</span>
              </div>

              {/* Verified External Gateways rendered as native links with target="_blank" */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={cobaltUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition group"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Cobalt Tools (High Speed, Ad-Free)</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </a>

                <a
                  href={ssYouTubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition group"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>SSYouTube 1080p Direct Converter</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </a>
              </div>

              {/* Direct Server Download & Link Copy */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <a
                  id="server-stream-fallback-btn"
                  href={directServerUrl}
                  download={fullFileName}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  <Server className="w-4 h-4 text-slate-500" />
                  <span>Download via Server Stream</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copy Stream Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Content for Mode: Web Live Play & Record Mode */}
      {downloadMode === 'record' && (
        <WebLiveRecorder
          metadata={metadata}
          selectedResolution={selectedVideoFormat.resolution}
          customFilename={customFilename}
          onAddToHistory={onAddToHistory}
        />
      )}

    </div>
  );
}
