import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-white/[0.12] bg-[#101014]/95 px-4 py-3 text-sm text-white shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
      <span className="flex-1 text-xs font-medium">{message}</span>
      <button
        onClick={onClose}
        className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
        title="Kapat"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
