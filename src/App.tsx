import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DownloaderForm } from './components/DownloaderForm';
import { VideoResultCard } from './components/VideoResultCard';
import { DownloadHistory } from './components/DownloadHistory';
import { FeaturesAndFaq } from './components/FeaturesAndFaq';
import { Toast } from './components/Toast';
import { ExtractedVideo, ExtractApiResponse } from './types';
import { Sparkles, ArrowDown } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import {
  saveDownloadToFirestore,
  deleteDownloadFromFirestore,
  subscribeToUserDownloads,
} from './lib/firebase';

const STORAGE_KEY = 'video_downloader_history_v1';

export function App() {
  const { user } = useAuth();
  const [extractedVideo, setExtractedVideo] = useState<ExtractedVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ExtractedVideo[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load history from localStorage when signed out
  useEffect(() => {
    if (!user) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setHistory(JSON.parse(saved));
        }
      } catch {
        // ignore
      }
    }
  }, [user]);

  // Subscribe to Firestore cloud history when signed in
  useEffect(() => {
    if (!user) return;

    // First, sync any existing local items to Firestore if signed in
    try {
      const localSaved = localStorage.getItem(STORAGE_KEY);
      if (localSaved) {
        const parsed: ExtractedVideo[] = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((item) => {
            saveDownloadToFirestore(user.uid, item).catch(() => {});
          });
        }
      }
    } catch {
      // ignore
    }

    // Subscribe to Firestore real-time updates
    const unsubscribe = subscribeToUserDownloads(
      user.uid,
      (cloudVideos) => {
        setHistory(cloudVideos);
      },
      (err) => {
        console.warn('Firestore subscription notice:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const saveToHistory = (video: ExtractedVideo) => {
    // 1. Update local state
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.originalUrl !== video.originalUrl);
      const updated = [video, ...filtered].slice(0, 30);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // 2. If user is signed in, sync to Firestore
    if (user) {
      saveDownloadToFirestore(user.uid, video).catch((err) => {
        console.error('Failed to save to Firestore:', err);
      });
    }
  };

  const handleClearHistory = () => {
    const currentItems = [...history];
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    if (user) {
      currentItems.forEach((item) => {
        deleteDownloadFromFirestore(user.uid, item.id).catch(() => {});
      });
    }

    showToast('İndirme geçmişi temizlendi.');
  };

  const handleRemoveHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    if (user) {
      deleteDownloadFromFirestore(user.uid, id).catch((err) => {
        console.error('Failed to delete from Firestore:', err);
      });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };


  const handleExtract = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const json: ExtractApiResponse = await res.json();

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Video bilgileri alınamadı. Bağlantıyı kontrol edip tekrar deneyin.');
      }

      setExtractedVideo(json.data);
      saveToHistory(json.data);
      showToast('Video başarıyla bulundu ve hazırlandı!');

      // Smooth scroll to result
      window.scrollTo({ top: 180, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Video işlenirken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setExtractedVideo(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToFaq = () => {
    const el = document.getElementById('features-faq');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-x-hidden">
      {/* Elegant Dark Ambient Lighting Effects */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[550px] w-full max-w-6xl bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(16,185,129,0.10),transparent_70%)] blur-2xl" />
      <div className="pointer-events-none absolute top-32 right-12 -z-10 h-80 w-80 rounded-full bg-cyan-500/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute top-32 left-12 -z-10 h-80 w-80 rounded-full bg-emerald-500/[0.04] blur-3xl" />

      {/* Navigation Bar */}
      <Navbar
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onScrollToFaq={scrollToFaq}
      />

      {/* Main Content Hero */}
      <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-16 sm:px-6 relative">
        <div className="w-full max-w-4xl flex flex-col items-center text-center">
          {/* Hero Header */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.12)] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Filigransız HD Video & MP3 İndirici</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
            Instagram, TikTok ve YouTube Shorts
            <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
              Videolarını Ücretsiz İndirin
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm sm:text-base text-zinc-400 leading-relaxed">
            İstediğiniz videonun linkini yapıştırın, saniyeler içinde yüksek kalitede (HD) ve filigransız olarak cihazınıza kaydedin.
          </p>

          {/* Form / URL Input Area */}
          <div className="mt-8 w-full max-w-2xl">
            <DownloaderForm
              onExtract={handleExtract}
              isLoading={isLoading}
              error={error}
              onClearError={() => setError(null)}
            />
          </div>

          {/* Result Card when video extracted */}
          {extractedVideo && (
            <div className="mt-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <VideoResultCard
                video={extractedVideo}
                onReset={handleReset}
                onNotify={showToast}
              />
            </div>
          )}
        </div>

        {/* Features & FAQ Section */}
        <FeaturesAndFaq />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.06] bg-[#070709] py-8 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Videoİndir. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Instagram Reels</span>
            <span>•</span>
            <span>TikTok Filigransız</span>
            <span>•</span>
            <span>YouTube Shorts MP4/MP3</span>
          </div>
        </div>
      </footer>

      {/* History Drawer Modal */}
      <DownloadHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectVideo={(video) => {
          setExtractedVideo(video);
          showToast('Geçmişteki video yüklendi.');
        }}
        onClearHistory={handleClearHistory}
        onRemoveItem={handleRemoveHistoryItem}
      />

      {/* Global Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

export default App;
