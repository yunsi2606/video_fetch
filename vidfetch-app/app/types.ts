// Shared types for the video downloader
export interface DownloadOption {
  quality: string;        // "1080p", "720p", "480p", "360p", "Audio"
  label: string;          // Human readable: "1080p Full HD", "MP3 Audio"
  url: string;            // Direct video/audio URL
  type: 'video' | 'audio';
  filesize?: number;      // bytes, optional
  hasWatermark?: boolean; // for TikTok
  ext?: string;           // "mp4", "mp3", "webm"
  width?: number;
  height?: number;
}

export interface VideoInfo {
  title: string;
  thumbnailUrl: string;
  platform: 'YouTube' | 'TikTok' | 'Facebook' | 'Shopee' | 'Unknown';
  duration?: number;     // seconds
  author?: string;
  downloadOptions: DownloadOption[];
  originalUrl: string;
}

export interface FetchInfoRequest {
  url: string;
  includeWatermark?: boolean; // for TikTok
}

export interface ApiError {
  message: string;
  code?: string;
}
