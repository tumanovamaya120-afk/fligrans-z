import React, { useState } from 'react';
import {
  Download,
  ClipboardPaste,
  X,
  Loader2,
  Video,
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SupportedPlatform } from '../types';

interface DownloaderFormProps {
  onExtract: (url: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

export const DownloaderForm: React.FC<DownloaderFormProps> = ({
  onExtract,
  isLoading,
  error,
  onClearError,
}) => {
  const [url, setUrl] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'instagram' | 'tiktok' | 'youtube'>('all');
  const [pasteSuccess, setPasteSuccess] = useState(false);

  // Detect platform automatically from input
  const detectPlatform = (inputUrl: string): SupportedPlatform => {
    const lower = inputUrl.toLowerCase();
    if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
      return 'instagram';
    }
    if (lower.includes('tiktok.com') || lower.includes('tiktokv.com') || lower.includes('douyin.com')) {
      return 'tiktok';
    }
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      return 'youtube';
    }
    return 'unknown';
  };

  const detectedPlatform = detectPlatform(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onExtract(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        onClearError();
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 2000);
      }
    } catch {
      // Fallback if clipboard permission is denied
      const manual = prompt('Lütfen video linkini yapıştırın:');
      if (manual) {
        setUrl(manual.trim());
        onClearError();
      }
    }
  };

  const handleClear = () => {
    setUrl('');
    onClearError();
  };

  // Sample links for instant testing
  const sampleLinks = [
    {
      label: '📱 TikTok (Filigransız)',
      platform: 'tiktok',
      url: 'https://www.tiktok.com/@scout2015/video/6718335390845095173',
    },
    {
      label: '▶️ YouTube Shorts',
      platform: 'youtube',
      url: 'https://www.youtube.com/shorts/kJQP7kiw5Fk',
    },
    {
      label: '📸 Instagram Reels',
      platform: 'instagram',
      url: 'https://www.instagram.com/reel/C8q8y7mSKb6/',
    },
  ];

  const handleSampleClick = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onClearError();
    onExtract(sampleUrl);
  };

  return (
    <div className="w-full">
      {/* Platform Badges / Filter Tabs */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            activeFilter === 'all'
              ? 'bg-white text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
              : 'border border-white/[0.08] bg-[#111114]/80 text-zinc-400 hover:border-white/20 hover:text-zinc-200 hover:bg-[#16161a]'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Tüm Platformlar
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('instagram')}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            activeFilter === 'instagram'
              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]'
              : 'border border-white/[0.08] bg-[#111114]/80 text-zinc-400 hover:border-pink-500/40 hover:text-pink-300 hover:bg-pink-500/5'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-pink-500"></span>
          Instagram Reels
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('tiktok')}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            activeFilter === 'tiktok'
              ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              : 'border border-white/[0.08] bg-[#111114]/80 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-cyan-500/5'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
          TikTok (Filigransız)
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('youtube')}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            activeFilter === 'youtube'
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]'
              : 'border border-white/[0.08] bg-[#111114]/80 text-zinc-400 hover:border-red-500/40 hover:text-red-300 hover:bg-red-500/5'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          YouTube Shorts
        </button>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="group relative flex flex-col gap-2 rounded-2xl border border-white/[0.1] bg-[#0c0c0e]/95 p-2 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 sm:flex-row sm:items-center sm:gap-3 sm:p-2.5">
          {/* Left Platform Icon Indicator */}
          <div className="hidden pl-2 sm:flex items-center">
            {detectedPlatform === 'instagram' && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                <span className="text-xs font-bold">IG</span>
              </div>
            )}
            {detectedPlatform === 'tiktok' && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <span className="text-xs font-bold">TT</span>
              </div>
            )}
            {detectedPlatform === 'youtube' && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <span className="text-xs font-bold">YT</span>
              </div>
            )}
            {detectedPlatform === 'unknown' && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18181c] text-zinc-400 border border-white/[0.06]">
                <Video className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Input Field */}
          <div className="relative flex-1">
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) onClearError();
              }}
              placeholder={
                activeFilter === 'instagram'
                  ? 'Instagram Reels veya Gönderi linkini yapıştırın...'
                  : activeFilter === 'tiktok'
                  ? 'TikTok video linkini buraya yapıştırın...'
                  : activeFilter === 'youtube'
                  ? 'YouTube Shorts linkini buraya yapıştırın...'
                  : 'Instagram, TikTok veya YouTube Shorts linkini yapıştırın...'
              }
              className="w-full bg-transparent px-3 py-2.5 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none"
              autoFocus
            />

            {/* Clear button if text exists */}
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                title="Temizle"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Buttons inside bar */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Quick Paste Button */}
            <button
              type="button"
              onClick={handlePaste}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#151518] px-3.5 py-2.5 text-xs font-medium text-zinc-300 transition-all hover:border-white/20 hover:bg-[#1e1e23] hover:text-white shadow-sm"
              title="Panodan Yapıştır"
            >
              {pasteSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">Yapıştırıldı</span>
                </>
              ) : (
                <>
                  <ClipboardPaste className="h-4 w-4 text-zinc-400" />
                  <span>Yapıştır</span>
                </>
              )}
            </button>

            {/* Main Submit Download Button */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex min-w-[110px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                  <span>İşleniyor...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>İndir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200 backdrop-blur-md shadow-lg">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
          <div className="flex-1">
            <p className="font-medium text-red-300">İndirme Başarısız Oldu</p>
            <p className="mt-0.5 text-xs text-red-300/80">{error}</p>
            <p className="mt-2 text-xs text-zinc-400">
              💡 İpucu: Profilin herkese açık (public) olduğundan ve bağlantının doğrudan videoya ait olduğundan emin olun.
            </p>
          </div>
          <button
            onClick={onClearError}
            className="text-red-400 hover:text-red-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Quick Test Samples */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
        <span className="font-medium text-zinc-500">Hızlı Test İçin Örnekler:</span>
        {sampleLinks.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSampleClick(sample.url)}
            className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#0d0d10]/90 px-2.5 py-1 text-zinc-300 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 shadow-sm"
          >
            <Play className="h-2.5 w-2.5" />
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
