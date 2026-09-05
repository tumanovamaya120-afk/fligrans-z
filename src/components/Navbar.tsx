import React, { useState } from 'react';
import { Download, History, Sparkles, LogIn, LogOut, Cloud, CloudCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  historyCount: number;
  onOpenHistory: () => void;
  onScrollToFaq: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  historyCount,
  onOpenHistory,
  onScrollToFaq,
}) => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#070709]/80 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-white/20">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">
                Video<span className="text-emerald-400">İndir</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                Ücretsiz & Hızlı
              </span>
            </div>
            <p className="hidden text-xs text-zinc-400 sm:block">
              Instagram • TikTok • YouTube Shorts
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onScrollToFaq}
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white sm:flex"
            title="Nasıl Kullanılır?"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Nasıl İndirilir?
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#121215] px-3.5 py-1.5 text-xs font-medium text-zinc-200 shadow-sm transition-all hover:border-white/20 hover:bg-[#18181c] hover:text-white"
            title="İndirme Geçmişi"
          >
            <History className="h-4 w-4 text-emerald-400" />
            <span>Geçmiş</span>
            {historyCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-zinc-950">
                {historyCount}
              </span>
            )}
          </button>

          {/* Firebase Authentication & User Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#121215] p-1 pr-2.5 text-xs font-medium text-zinc-200 hover:border-emerald-500/40 hover:bg-[#18181c] transition-all"
                title={user.displayName || user.email || 'Kullanıcı'}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    referrerPolicy="no-referrer"
                    className="h-7 w-7 rounded-lg object-cover ring-1 ring-emerald-500/40"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
                <span className="hidden sm:inline-block max-w-[100px] truncate">
                  {user.displayName?.split(' ')[0] || 'Hesap'}
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" title="Bulut Eşitleme Aktif" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/[0.1] bg-[#111115] p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="border-b border-white/[0.08] px-3 py-2">
                    <p className="text-xs font-medium text-white truncate">{user.displayName || 'Kullanıcı'}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
                      <Cloud className="h-3 w-3" />
                      <span>Firestore Bulut Eşitleme Aktif</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="mt-1.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400 shadow-sm transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50 active:scale-95 disabled:opacity-50"
              title="Google ile Giriş Yaparak İndirmelerinizi Buluta Kaydedin"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Google ile Giriş</span>
              <span className="sm:hidden">Giriş</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

