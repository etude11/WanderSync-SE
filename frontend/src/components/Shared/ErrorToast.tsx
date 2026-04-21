import { useEffect, useState } from 'react';

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export default function ErrorToast({ message, onDismiss, duration = 4000 }: ErrorToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg bg-red-900/90 border border-red-700 px-4 py-3 text-red-100 shadow-xl backdrop-blur transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
        className="ml-2 text-red-300 hover:text-red-100 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
