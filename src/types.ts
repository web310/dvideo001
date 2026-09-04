export interface VideoFormatOption {
  itag?: number;
  qualityLabel: string;
  resolution: string; // e.g. '2160p (4K)', '1080p (Full HD)', '720p (HD)', '480p', '360p'
  container: 'mp4' | 'webm' | 'mkv';
  fps?: number;
  hasAudio: boolean;
  hasVideo: boolean;
  approxSizeMb?: number;
  bitrate?: number;
  codec?: string;
  url?: string;
}

export interface AudioFormatOption {
  format: 'mp3' | 'm4a' | 'wav' | 'flac' | 'opus' | 'aac';
  bitrate: string; // '320 kbps', '256 kbps', '192 kbps', '128 kbps'
  label: string;
  approxSizeMb?: number;
  qualityBadge: 'Ultra High' | 'High Quality' | 'Standard' | 'Lossless';
}

export interface VideoMetadata {
  id: string;
  url: string;
  title: string;
  author: string;
  authorUrl?: string;
  authorAvatar?: string;
  thumbnailUrl: string;
  durationSeconds: number;
  formattedDuration: string;
  viewCount?: number;
  formattedViews?: string;
  publishDate?: string;
  description?: string;
  videoFormats: VideoFormatOption[];
  audioFormats: AudioFormatOption[];
}

export interface DownloadHistoryItem {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channel: string;
  type: 'video' | 'audio';
  format: string;
  quality: string;
  timestamp: number;
  customFilename: string;
}

export type DownloadStatus = 'idle' | 'preparing' | 'downloading' | 'completed' | 'error';
