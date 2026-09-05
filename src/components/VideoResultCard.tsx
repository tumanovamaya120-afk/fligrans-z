import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  Film,
  Music,
  RotateCcw,
  Sparkles,
  Share2,
  Loader2,
} from 'lucide-react';
import { ExtractedVideo, VideoDownloadOption } from '../types';

interface VideoResultCardProps {
  video: ExtractedVideo;
  onReset: () => void;
  onNotify: (message: string) => void;
}

export const VideoResultCard: React.FC<VideoResultCardProps> = ({
  video,
  onReset,
  onNotify,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadStatusText, setDownloadStatusText] = useState<{ [id: string]: string }>({});
  const [, setDownloadProgress] = useState<{ [id: string]: number }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return {
          name: 'Instagram Reels',
          badgeClass: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
          dotClass: 'bg-pink-500',
        };
      case 'tiktok':
        return {
          name: 'TikTok (Filigransız)',
          badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          dotClass: 'bg-cyan-400',
        };
      case 'youtube':
        return {
          name: 'YouTube Shorts',
          badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
          dotClass: 'bg-red-500',
        };
      default:
        return {
          name: 'Sosyal Video',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dotClass: 'bg-emerald-400',
        };
    }
  };

  const badge = getPlatformBadge(video.platform);

  const handleDownload = async (opt: VideoDownloadOption) => {
    if (downloadingId) return;
    setDownloadingId(opt.id);
    setDownloadStatusText((prev) => ({ ...prev, [opt.id]: 'Hazırlanıyor...' }));
    setDownloadProgress((prev) => ({ ...prev, [opt.id]: 0 }));

    try {
      // Build download filename
      const cleanTitle = (video.title || 'video')
        .slice(0, 30)
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const ext = opt.format === 'mp3' ? 'mp3' : 'mp4';
      const filename = `${video.platform}_${cleanTitle}_${opt.quality.replace(/[^a-zA-Z0-9]/g, '')}.${ext}`;

      const proxyUrl = `/api/download?url=${encodeURIComponent(opt.url)}&filename=${encodeURIComponent(filename)}&type=${opt.type}`;

      // Fetch with client-side retries to guarantee we never save a corrupt 10.1 KB placeholder
      let response: Response | null = null;
      let lastErrorMessage = '';

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (attempt > 1) {
            setDownloadStatusText((prev) => ({
              ...prev,
              [opt.id]: `Yeniden deneniyor (${attempt}/3)...`,
            }));
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          response = await fetch(proxyUrl);
          const ct = response.headers.get('content-type') || '';

          if (response.ok && !ct.includes('html') && !ct.includes('json')) {
            break;
          } else {
            lastErrorMessage = `Sunucu yanıtı: ${response.status}`;
            response = null;
          }
        } catch (err: any) {
          lastErrorMessage = err.message || 'Ağ bağlantısı kurulamadı';
          response = null;
        }
      }

      if (!response || !response.ok) {
        throw new Error(lastErrorMessage || 'Video dosyası alınamadı');
      }

      const contentLengthHeader = response.headers.get('content-length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

      if (!response.body) {
        throw new Error('İndirme akışı başlatılamadı');
      }

      setDownloadStatusText((prev) => ({ ...prev, [opt.id]: 'İndiriliyor...' }));

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          if (totalBytes > 0) {
            const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
            setDownloadProgress((prev) => ({ ...prev, [opt.id]: percent }));
            setDownloadStatusText((prev) => ({ ...prev, [opt.id]: `%${percent}` }));
          } else {
            const mb = (receivedBytes / (1024 * 1024)).toFixed(1);
            setDownloadStatusText((prev) => ({ ...prev, [opt.id]: `${mb} MB` }));
          }
        }
      }

      // Safeguard: Any video smaller than 20KB is an error/challenge page
      if (receivedBytes < 20000 && opt.type === 'video') {
        throw new Error('İndirilen dosya boyutu beklenenden küçük. Lütfen doğrudan indirmeyi deneyin.');
      }

      setDownloadStatusText((prev) => ({ ...prev, [opt.id]: 'Kaydediliyor...' }));

      const mimeType = opt.format === 'mp3' ? 'audio/mpeg' : 'video/mp4';
      const blob = new Blob(chunks, { type: mimeType });
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(blobUrl);
      }, 10000);

      onNotify(`"${opt.label}" başarıyla indirildi!`);
    } catch (err: any) {
      console.warn('Proxy blob download failed, falling back to direct link:', err);
      onNotify('Doğrudan indirme bağlantısı açılıyor...');
      // Direct window download fallback
      const fallbackA = document.createElement('a');
      fallbackA.href = opt.url;
      fallbackA.target = '_blank';
      fallbackA.rel = 'noopener noreferrer';
      fallbackA.download = '';
      document.body.appendChild(fallbackA);
      fallbackA.click();
      setTimeout(() => {
        if (document.body.contains(fallbackA)) {
          document.body.removeChild(fallbackA);
        }
      }, 1000);
    } finally {
      setDownloadingId(null);
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[opt.id];
        return next;
      });
      setDownloadStatusText((prev) => {
        const next = { ...prev };
        delete next[opt.id];
        return next;
      });
    }
  };

  const handleCopyLink = async (opt: VideoDownloadOption) => {
    try {
      await navigator.clipboard.writeText(opt.url);
      setCopiedId(opt.id);
      onNotify('İndirme bağlantısı panoya kopyalandı!');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      onNotify('Bağlantı kopyalanamadı.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          url: video.originalUrl,
        });
      } catch {
        // Ignored if user dismissed share dialog
      }
    } else {
      try {
        await navigator.clipboard.writeText(video.originalUrl);
        onNotify('Video bağlantısı panoya kopyalandı!');
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0e0e11]/95 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0a0a0c]/60 p-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badge.badgeClass}`}
          >
            <span className={`h-2 w-2 rounded-full ${badge.dotClass}`} />
            {badge.name}
          </span>
          {video.duration && (
            <span className="rounded-md border border-white/[0.08] bg-[#16161a] px-2 py-0.5 text-xs text-zinc-300">
              {video.duration}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#141417] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-white/20 hover:bg-[#1d1d22] hover:text-white shadow-sm"
            title="Paylaş"
          >
            <Share2 className="h-3.5 w-3.5 text-zinc-400" />
            <span>Paylaş</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#141417] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-white/20 hover:bg-[#1d1d22] hover:text-white shadow-sm"
            title="Yeni Video İndir"
          >
            <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
            <span>Yeni Video</span>
          </button>
        </div>
      </div>

      {/* Main Content: Preview and Download Options */}
      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-12">
        {/* Left Side: Video Preview Player & Details */}
        <div className="flex flex-col gap-3 lg:col-span-5">
          <div className="relative aspect-[9/16] max-h-[420px] w-full overflow-hidden rounded-xl bg-[#060608] border border-white/[0.06] shadow-inner flex items-center justify-center">
            {video.previewUrl ? (
              <video
                src={video.previewUrl}
                controls
                playsInline
                poster={video.thumbnail || undefined}
                className="h-full w-full object-contain"
              />
            ) : video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                <Film className="h-12 w-12 text-zinc-600 mb-2" />
                <span className="text-xs">Önizleme hazır</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="line-clamp-2 text-sm font-semibold text-white sm:text-base">
              {video.title}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="text-zinc-500">Kanal / Yazar:</span>
              {video.authorUrl ? (
                <a
                  href={video.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  {video.author}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : (
                <span className="font-medium text-zinc-300">{video.author}</span>
              )}
            </p>
          </div>
        </div>

        {/* Right Side: Download Quality Options */}
        <div className="flex flex-col justify-between lg:col-span-7">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                İndirme Seçenekleri
              </h4>
              <span className="text-xs text-zinc-400">
                {video.downloads.length} format mevcut
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {video.downloads.map((opt) => (
                <div
                  key={opt.id}
                  className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-[#09090c]/80 p-3 transition-all hover:border-white/[0.16] hover:bg-[#121216] shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left Option Info */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                        opt.type === 'audio'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : opt.isHD
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-[#18181c] text-zinc-300 border border-white/[0.06]'
                      }`}
                    >
                      {opt.type === 'audio' ? (
                        <Music className="h-5 w-5" />
                      ) : (
                        <Film className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {opt.label}
                        </span>
                        {opt.isWatermarkFree && (
                          <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                            Filigransız
                          </span>
                        )}
                        {opt.isHD && (
                          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                            HD
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
                        <span>Format: {opt.format.toUpperCase()}</span>
                        <span>•</span>
                        <span>Kalite: {opt.quality}</span>
                        {opt.size && (
                          <>
                            <span>•</span>
                            <span>{opt.size}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {/* Copy direct link button */}
                    <button
                      onClick={() => handleCopyLink(opt)}
                      className="rounded-lg border border-white/[0.08] bg-[#151518] px-2.5 py-2 text-xs font-medium text-zinc-300 transition-all hover:border-white/20 hover:bg-[#1f1f25] hover:text-white shadow-sm"
                      title="Bağlantıyı Kopyala"
                    >
                      {copiedId === opt.id ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>

                    {/* Direct link in browser fallback button */}
                    <a
                      href={opt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-white/[0.08] bg-[#151518] px-2.5 py-2 text-xs font-medium text-zinc-300 transition-all hover:border-white/20 hover:bg-[#1f1f25] hover:text-white shadow-sm"
                      title="Tarayıcıda Aç"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    {/* Primary Download Button */}
                    <button
                      onClick={() => handleDownload(opt)}
                      disabled={downloadingId !== null}
                      className={`relative flex items-center justify-center gap-1.5 overflow-hidden rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-md min-w-[95px] ${
                        downloadingId === opt.id
                          ? 'bg-emerald-600 text-white cursor-wait'
                          : 'bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50'
                      }`}
                    >
                      {downloadingId === opt.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white flex-shrink-0" />
                          <span className="whitespace-nowrap font-medium">
                            {downloadStatusText[opt.id] || 'İndiriliyor...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>İndir</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notice */}
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#070709]/80 p-3 text-xs text-zinc-400">
            <p className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>
                İndirme otomatik olarak başlamazsa, "Tarayıcıda Aç" butonuna tıklayıp sağ tıkla &quot;Videoyu Farklı Kaydet&quot; yapabilirsiniz.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
