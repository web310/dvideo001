import { useState } from 'react';
import { ExternalLink, Play, Clock, Eye, Calendar, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { VideoMetadata } from '../types';

interface VideoDetailsCardProps {
  metadata: VideoMetadata;
}

export function VideoDetailsCard({ metadata }: VideoDetailsCardProps) {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  return (
    <div id="video-details-card" className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Thumbnail / Player Preview */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group shadow-xs">
            {isPlayingPreview ? (
              <iframe
                src={`https://www.youtube.com/embed/${metadata.id}?autoplay=1`}
                title={metadata.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <img
                  src={metadata.thumbnailUrl}
                  alt={metadata.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${metadata.id}/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <button
                    id="play-preview-btn"
                    onClick={() => setIsPlayingPreview(true)}
                    className="w-13 h-13 rounded-full bg-white/95 hover:bg-white text-red-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
                    title="Play Preview"
                  >
                    <Play className="w-5 h-5 ml-0.5 fill-red-600 text-red-600" />
                  </button>
                </div>
                {/* Duration Badge */}
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 text-[11px] font-mono text-white font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-300" />
                  <span>{metadata.formattedDuration}</span>
                </div>
              </>
            )}
          </div>
          {isPlayingPreview && (
            <button
              onClick={() => setIsPlayingPreview(false)}
              className="mt-2 text-xs text-slate-500 hover:text-slate-900 flex items-center justify-center w-full py-1.5 rounded-lg bg-slate-100 font-medium"
            >
              Close video player preview
            </button>
          )}
        </div>

        {/* Info & Metadata */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            {/* Title */}
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug line-clamp-2" title={metadata.title}>
              {metadata.title}
            </h2>

            {/* Author / Channel */}
            <div className="mt-2.5 flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
                <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>{metadata.author}</span>
              </div>

              <a
                href={metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 font-medium transition"
              >
                <span>Open on YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Quick stats pills */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 font-medium">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{metadata.formattedViews || '100K+ views'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{metadata.publishDate || 'Published recently'}</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px]">
                <span>ID: {metadata.id}</span>
              </div>
            </div>
          </div>

          {/* Description Snippet */}
          {metadata.description && (
            <div className="mt-4 pt-3.5 border-t border-slate-100 text-xs text-slate-500">
              <p className={isDescExpanded ? 'text-slate-700' : 'line-clamp-2 text-slate-500'}>
                {metadata.description}
              </p>
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="mt-1.5 text-slate-900 hover:text-red-600 font-semibold inline-flex items-center gap-1"
              >
                <span>{isDescExpanded ? 'Show less' : 'Read full description'}</span>
                {isDescExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
