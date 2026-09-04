import { Trash2, Download, Video, Music, Clock, FileCheck } from 'lucide-react';
import { DownloadHistoryItem } from '../types';

interface DownloadHistoryProps {
  history: DownloadHistoryItem[];
  onClearHistory: () => void;
  onSelectVideoId: (id: string) => void;
}

export function DownloadHistory({ history, onClearHistory, onSelectVideoId }: DownloadHistoryProps) {
  if (!history || history.length === 0) return null;

  return (
    <div id="download-history-section" className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">Recent Downloads</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {history.length}
          </span>
        </div>

        <button
          id="clear-history-btn"
          onClick={onClearHistory}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 font-medium transition"
          title="Clear download history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition"
          >
            {/* Thumbnail */}
            <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;
                }}
              />
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute bottom-1 right-1">
                {item.type === 'video' ? (
                  <Video className="w-3 h-3 text-white drop-shadow" />
                ) : (
                  <Music className="w-3 h-3 text-white drop-shadow" />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1" title={item.title}>
                {item.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                <span className="font-mono text-slate-900 font-bold">{item.quality}</span>
                <span>•</span>
                <span className="font-mono uppercase text-slate-600">{item.format}</span>
              </div>
            </div>

            {/* Quick Action */}
            <button
              id={`load-history-video-${item.videoId}`}
              onClick={() => onSelectVideoId(item.videoId)}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition shrink-0 shadow-2xs"
              title="Open video format options again"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
