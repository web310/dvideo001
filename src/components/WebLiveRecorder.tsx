import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { 
  Play, 
  Square, 
  Pause, 
  Volume2, 
  VolumeX, 
  Video as VideoIcon, 
  Download, 
  AlertCircle, 
  Maximize2, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Mic,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { VideoMetadata, DownloadHistoryItem } from '../types';

interface WebLiveRecorderProps {
  metadata: VideoMetadata;
  selectedResolution?: string;
  customFilename?: string;
  onAddToHistory?: (item: DownloadHistoryItem) => void;
}

export function WebLiveRecorder({
  metadata,
  selectedResolution = '1080p',
  customFilename,
  onAddToHistory
}: WebLiveRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTimeSec, setRecordingTimeSec] = useState(0);
  const [recordedBytes, setRecordedBytes] = useState(0);
  const [audioDetected, setAudioDetected] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedExtension, setRecordedExtension] = useState('webm');
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDirectLinkBox, setShowDirectLinkBox] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const targetFilename = (customFilename?.trim() || metadata.title).replace(/[\\/:*?"<>|]/g, '_').trim();
  const directTabUrl = `${window.location.origin}/?v=${encodeURIComponent(metadata.id)}&mode=record`;

  // Detect if app is in an iframe
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  const handleOpenInNewTab = (e?: React.MouseEvent) => {
    // 1. Copy direct link to clipboard so user can always paste it
    try {
      navigator.clipboard.writeText(directTabUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      console.warn('Could not copy link to clipboard:', err);
    }

    // 2. Try window.open
    let newWin: Window | null = null;
    try {
      newWin = window.open(directTabUrl, '_blank');
    } catch (err) {
      console.warn('window.open caught error:', err);
    }

    // 3. If popup is blocked by browser or iframe sandbox, show manual link box
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      setShowDirectLinkBox(true);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format bytes to MB/KB
  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  // Start live screen & audio tab recording
  const handleStartRecording = async () => {
    setRecordingError(null);
    setRecordedBlobUrl(null);
    setRecordedBlob(null);
    chunksRef.current = [];
    setRecordedBytes(0);
    setRecordingTimeSec(0);

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Your browser does not support web screen & audio recording. Please use modern Chrome, Edge, or Firefox.');
      }

      // Prompt browser capture for tab/screen with audio
      // Standard universal constraints compatible with all Chromium & Firefox browsers
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      streamRef.current = displayStream;

      // Check audio track presence (voice/music)
      const audioTracks = displayStream.getAudioTracks();
      const hasAudio = audioTracks.length > 0;
      setAudioDetected(hasAudio);

      // Setup Web Audio Analyser for live VU volume level meter
      if (hasAudio) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(new MediaStream([audioTracks[0]]));
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        } catch (audioErr) {
          console.warn('Could not attach audio analyser:', audioErr);
        }
      }

      // Select best supported MIME type
      let mimeType = 'video/webm;codecs=vp9,opus';
      let extension = 'webm';

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a')) {
          mimeType = 'video/mp4;codecs=avc1,mp4a';
          extension = 'mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          mimeType = 'video/webm;codecs=vp8,opus';
          extension = 'webm';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
          extension = 'webm';
        } else {
          mimeType = '';
        }
      }

      setRecordedExtension(extension);

      const recorder = new MediaRecorder(displayStream, mimeType ? { mimeType, videoBitsPerSecond: 4_000_000 } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          setRecordedBytes((prev) => prev + event.data.size);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
        setRecordedBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setRecordedBlobUrl(url);
        setIsRecording(false);
        setIsPaused(false);

        // Stop all tracks
        displayStream.getTracks().forEach((t) => t.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }

        // Add to history
        if (onAddToHistory) {
          onAddToHistory({
            id: `${Date.now()}`,
            videoId: metadata.id,
            title: metadata.title,
            thumbnailUrl: metadata.thumbnailUrl,
            channel: metadata.author,
            type: 'video',
            format: extension.toUpperCase(),
            quality: selectedResolution,
            timestamp: Date.now(),
            customFilename: `${targetFilename}.${extension}`
          });
        }
      };

      // Handle user stopping screen share via native browser bar
      displayStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      };

      // Request data in 1-second chunks for accurate live bytes counter
      recorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTimeSec((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Error starting live recording:', err);
      let msg = err.message || 'Could not start recording.';
      if (err.name === 'NotAllowedError') {
        msg = isInIframe 
          ? 'Browser iframe security restricted tab screen & audio capture inside the preview. Please click "Open in New Tab for Tab Recording" to open this video in a full tab and record with full audio.'
          : 'Screen recording permission was cancelled or not granted in the browser prompt.';
      }
      setRecordingError(msg);
      setIsRecording(false);
      setShowDirectLinkBox(true);
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Pause / Resume
  const handleTogglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  // Trigger download of the recorded file
  const handleDownloadRecordedFile = () => {
    if (!recordedBlobUrl) return;
    const a = document.createElement('a');
    a.href = recordedBlobUrl;
    a.download = `${targetFilename}_${selectedResolution}.${recordedExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div id="web-live-recorder" className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Web Live Play & Record Mode</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                Full-Screen & Voice Audio
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Plays the YouTube video directly in the browser and captures the real video frames and audio voice track into a real downloadable file.
          </p>
        </div>

        <button
          onClick={() => setIsTheaterMode(!isTheaterMode)}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 self-start sm:self-center transition"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{isTheaterMode ? 'Standard View' : 'Theater View'}</span>
        </button>
      </div>

      {/* Informative helper banner when inside iframe */}
      {isInIframe && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-900">Embedded Preview Notice</span>
                <span className="text-amber-800">
                  Browsers require screen & tab recording to run in a top-level tab. Open this video in a new tab to enable 100% full tab audio capture.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(directTabUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs flex items-center gap-1 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <a
                id="header-open-new-tab-btn"
                href={directTabUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenInNewTab}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition shadow-xs active:scale-95"
              >
                <span>Open in New Tab for Tab Recording</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {(showDirectLinkBox || copiedLink) && (
            <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <span className="text-[11px] text-amber-900 font-mono truncate select-all bg-white px-2.5 py-1 rounded-md border border-amber-200">
                {directTabUrl}
              </span>
              <span className="text-[11px] text-amber-700 font-medium shrink-0">
                {copiedLink ? '✓ Copied to clipboard! Paste in new browser tab.' : 'Direct URL pre-configured with this video'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Embedded High-Definition Player */}
      <div className={`relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-md transition-all duration-300 ${
        isTheaterMode ? 'aspect-[21/9] min-h-[380px]' : 'aspect-video'
      }`}>
        <iframe
          src={`https://www.youtube.com/embed/${metadata.id}?autoplay=1&enablejsapi=1&origin=${window.location.origin}`}
          title={metadata.title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Live Recording HUD Overlay on Player */}
        {isRecording && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-red-500/50 text-white text-xs font-semibold shadow-lg">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span>RECORDING LIVE</span>
              <span className="font-mono text-red-400 font-bold ml-1">{formatTime(recordingTimeSec)}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-slate-700 text-white text-xs font-mono font-bold">
              <span>{formatSize(recordedBytes)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Recording Status & Audio Visualizer Banner */}
      {isRecording && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                {audioDetected ? (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Voice & Sound Track Active</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300">No Tab Audio Detected (Check 'Share tab audio')</span>
                  </>
                )}
              </span>

              <span className="text-slate-400 font-mono">
                Duration: <strong className="text-white">{formatTime(recordingTimeSec)}</strong> / {metadata.formattedDuration}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Captured File Size:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{formatSize(recordedBytes)}</span>
            </div>
          </div>

          {/* Audio VU Volume Meter Bar */}
          {audioDetected && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Mic className="w-3 h-3 text-emerald-400" />
                  <span>Live Voice Input Level</span>
                </span>
                <span>{audioLevel}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-75 rounded-full ${
                    audioLevel > 80 ? 'bg-red-500' : audioLevel > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.max(5, audioLevel)}%` }}
                />
              </div>
            </div>
          )}

          {/* Controls Bar while recording */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={handleTogglePause}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              onClick={handleStopRecording}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Finish & Save Video ({formatSize(recordedBytes)})</span>
            </button>
          </div>
        </div>
      )}

      {/* Completion Card with In-App Player and Download Action */}
      {recordedBlobUrl && !isRecording && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">Full Recording Finished!</h4>
                <p className="text-emerald-700 text-xs mt-0.5">
                  Captured <strong className="font-mono">{formatSize(recordedBlob?.size || 0)}</strong> with full video and synchronized audio.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadRecordedFile}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download File ({formatSize(recordedBlob?.size || 0)})</span>
            </button>
          </div>

          {/* Instant Local Preview */}
          <div className="rounded-xl overflow-hidden bg-black border border-emerald-200 aspect-video max-h-60 mx-auto">
            <video
              src={recordedBlobUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Error alert */}
      {recordingError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-sm text-amber-950">Tab Recording Notice</span>
              <span className="text-amber-800 mt-0.5 block">{recordingError}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="text-[11px] text-amber-800 font-mono truncate max-w-sm sm:max-w-md bg-white px-2 py-1 rounded border border-amber-200 select-all">
              {directTabUrl}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(directTabUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs flex items-center gap-1 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <a
                id="error-open-in-new-tab-btn"
                href={directTabUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenInNewTab}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-xs active:scale-95"
              >
                <span>Open in New Tab for Tab Recording</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar when not recording */}
      {!isRecording && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Click Start, select <strong>"This Tab"</strong> in the browser prompt, and check <strong>"Share tab audio"</strong>.</span>
          </div>

          <div className="flex items-center gap-2">
            {isInIframe && (
              <a
                id="footer-open-new-tab-btn"
                href={directTabUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenInNewTab}
                className="px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                title="Open in new window for full tab capture"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={handleStartRecording}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm transition active:scale-95"
            >
              <VideoIcon className="w-4.5 h-4.5" />
              <span>Start Web Play & Record</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
