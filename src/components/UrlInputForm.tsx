import { useState, type FormEvent } from 'react';
import { Search, Clipboard, X, ArrowRight, Loader2, Sparkles, Youtube, CheckCircle2 } from 'lucide-react';

interface UrlInputFormProps {
  onFetch: (url: string) => Promise<void>;
  isLoading: boolean;
}

const SAMPLE_VIDEOS = [
  {
    name: 'Nature 4K HDR',
    url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    badge: '4K Ultra'
  },
  {
    name: 'Lo-Fi Chill Beats',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    badge: 'Audio / MP3'
  },
  {
    name: 'Tech Podcast Preview',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    badge: '1080p'
  },
  {
    name: 'YouTube Shorts Clip',
    url: 'https://www.youtube.com/shorts/kJQP7kiw5Fk',
    badge: 'Shorts'
  }
];

export function UrlInputForm({ onFetch, isLoading }: UrlInputFormProps) {
  const [url, setUrl] = useState('');
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim() || isLoading) return;
    onFetch(url.trim());
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);
          onFetch(text.trim());
        }
      }
    } catch (err) {
      console.warn('Clipboard read permission denied or unavailable:', err);
    }
  };

  const handleSampleClick = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onFetch(sampleUrl);
  };

  const isYouTubeUrl = (input: string) => {
    return /youtube\.com|youtu\.be/i.test(input) || /^[a-zA-Z0-9_-]{11}$/.test(input.trim());
  };

  return (
    <div id="url-input-section" className="w-full max-w-4xl mx-auto">
      {/* Hero Title & Subtext */}
      <div className="text-center mb-8 space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Save your favorite media instantly.
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Paste a YouTube link below to start downloading in <span className="text-slate-900 font-semibold">4K UHD, 1080p, 720p</span> video or crystal clear <span className="text-red-600 font-semibold">320kbps MP3 audio</span>.
        </p>
      </div>

      {/* Main Input Box */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white border border-slate-200 hover:border-slate-300 focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100 rounded-2xl shadow-sm p-2 sm:p-2.5 transition-all duration-200">
          
          <div className="flex items-center flex-1 min-w-0 px-3 py-2 sm:py-0">
            <Youtube className="w-6 h-6 text-red-600 shrink-0 mr-3" />
            <input
              id="youtube-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube link here (e.g. https://www.youtube.com/watch?v=...)"
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm sm:text-base focus:outline-none"
              autoComplete="off"
            />
            {url && (
              <button
                id="clear-url-btn"
                type="button"
                onClick={() => setUrl('')}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition mr-2"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
            <button
              id="paste-clipboard-btn"
              type="button"
              onClick={handlePaste}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition"
              title="Paste link from clipboard"
            >
              {pasteSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Pasted!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Paste</span>
                </>
              )}
            </button>

            <button
              id="fetch-video-btn"
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sm transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Process Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Quick Sample Links */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1 text-slate-400 mr-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Try quick sample:</span>
        </span>
        {SAMPLE_VIDEOS.map((sample, idx) => (
          <button
            key={idx}
            id={`sample-btn-${idx}`}
            onClick={() => handleSampleClick(sample.url)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs disabled:opacity-50 font-medium"
          >
            <span>{sample.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono font-semibold">
              {sample.badge}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
