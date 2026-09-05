export type SupportedPlatform = 'instagram' | 'tiktok' | 'youtube' | 'unknown';

export interface VideoDownloadOption {
  id: string;
  label: string;
  quality: string;
  format: 'mp4' | 'mp3';
  url: string;
  size?: string;
  type: 'video' | 'audio';
  isHD?: boolean;
  isWatermarkFree?: boolean;
}

export interface ExtractedVideo {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  title: string;
  author: string;
  authorUrl?: string;
  thumbnail: string;
  duration?: string;
  originalUrl: string;
  downloads: VideoDownloadOption[];
  previewUrl?: string;
  timestamp: number;
}

export interface ExtractApiResponse {
  success: boolean;
  data?: ExtractedVideo;
  error?: string;
}
