import React from 'react';
import {
  History,
  X,
  Trash2,
  Download,
  Film,
  Music,
  ExternalLink,
  Cloud,
  CloudCheck,
  LogIn,
} from 'lucide-react';
import { ExtractedVideo } from '../types';
import { useAuth } from '../context/AuthContext';

interface DownloadHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: ExtractedVideo[];
  onSelectVideo: (video: ExtractedVideo) => void;
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
}

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({
  isOpen,
  onClose,
  history,
  onSelectVideo,
  onClearHistory,
  onRemoveItem,
}) => {
  const { user, signInWithGoogle } = useAuth();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="flex h-full max-h-[600px] w-full max-w-xl flex-col rounded-2xl border border-white/[0.1] bg-[#0d0d10] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0a0a0c]/60 p-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-white">İndirme Geçmişi</h3>
            <span className="rounded-full border border-white/[0.08] bg-[#16161a] px-2.5 py-0.5 text-xs text-zinc-300">
              {history.length} video
            </span>
            {user && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                <Cloud className="h-3 w-3" />
                Bulut Senkronize
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1 rounded-xl border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                title="Tüm geçmişi sil"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Temizle</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Cloud Sync Prompt banner if not logged in */}
        {!user && (
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-emerald-950/20 px-4 py-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
              <Cloud className="h-4 w-4 flex-shrink-0" />
              <span>Videolarınızı tüm cihazlarınızda görmek için Google ile giriş yapın.</span>
            </div>
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
            >
              <LogIn className="h-3 w-3" />
              <span>Giriş Yap</span>
            </button>
          </div>
        )}

        {/* Modal Body */}

        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-zinc-500">
              <History className="h-10 w-10 text-zinc-600 mb-2" />
              <p className="text-sm font-medium text-zinc-400">Henüz indirme geçmişiniz yok</p>
              <p className="text-xs text-zinc-500 mt-1">
                İndirdiğiniz videolar hızlı erişim için burada saklanır.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#070709]/80 p-3 transition-all hover:border-white/[0.14] hover:bg-[#111115]"
                >
                  <div
                    onClick={() => {
                      onSelectVideo(item);
                      onClose();
                    }}
                    className="flex flex-1 items-center gap-3 cursor-pointer"
                  >
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[#141418] border border-white/[0.06]">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Film className="h-6 w-6 text-zinc-600" />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[9px] font-bold text-white uppercase">
                        {item.platform === 'youtube' ? 'Shorts' : item.platform}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 text-sm font-medium text-white group-hover:text-emerald-400">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {item.author} • {new Date(item.timestamp).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onSelectVideo(item);
                        onClose();
                      }}
                      className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400 transition-colors hover:bg-emerald-500/20"
                      title="Görüntüle ve İndir"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      title="Geçmişten Kaldır"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
