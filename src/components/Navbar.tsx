import { useState, useEffect } from 'react';
import { Youtube, ShieldCheck, Zap, ExternalLink } from 'lucide-react';

interface NavbarProps {
  activeVideoId?: string;
}

export function Navbar({ activeVideoId }: NavbarProps) {
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  const targetUrl = activeVideoId 
    ? `${window.location.origin}/?v=${encodeURIComponent(activeVideoId)}`
    : window.location.origin;

  return (
    <header id="app-navbar" className="w-full border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
            <Youtube className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-slate-900 tracking-tight">TubeFetch</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                Utility
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">Fast & Clean YouTube Media Downloader</p>
          </div>
        </div>

        {/* Badges / Quick stats & Open New Tab */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {isInIframe && (
            <a
              id="navbar-open-new-tab-btn"
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition active:scale-95"
              title="Open full page in a new tab"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </a>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium">4K & 320kbps</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">Free & Direct</span>
          </div>
        </div>
      </div>
    </header>
  );
}
