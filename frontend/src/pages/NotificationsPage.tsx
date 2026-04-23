import { useEffect, useState } from 'react';
import { notificationAPI } from '@/services/notificationAPI';
import type { NotificationItem } from '@/services/notificationAPI';
import LoadingSpinner from '@/components/Shared/LoadingSpinner';

const BellIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const [items, setItems]     = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    notificationAPI.list().then((r) => {
      // API might wrap in { data } or return array directly
      const raw = (r.data as { data?: NotificationItem[] })?.data ?? (r.data as unknown as NotificationItem[]) ?? [];
      setItems(Array.isArray(raw) ? raw : []);
    });

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const markRead = async (id: string) => {
    await notificationAPI.markRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  if (loading) return <LoadingSpinner size="lg" className="h-64" />;

  const unread = items.filter((n) => !n.read);
  const read   = items.filter((n) => n.read);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">Notifications</h1>
          <p className="text-sm text-charcoal/45 mt-0.5">
            {unread.length > 0 ? `${unread.length} unread` : 'All caught up'}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-14 rounded-2xl border border-dashed border-dust-grey/60 bg-white/50">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(219,211,216,0.22)', color: '#dbd3d8' }}>
            <BellIcon />
          </div>
          <p className="text-sm font-medium text-charcoal/55">No notifications yet</p>
          <p className="text-xs text-charcoal/35 mt-1">Disruption alerts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unread */}
          {unread.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold tracking-widest uppercase text-charcoal/40 mb-3">Unread</h2>
              <div className="space-y-2.5">
                {unread.map((n, i) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 rounded-xl px-4 py-3.5 border animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms`, background: 'rgba(215,122,97,0.06)', borderColor: 'rgba(215,122,97,0.20)' }}
                  >
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: '#d77a61' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-charcoal">Disruption Alert</p>
                      <p className="text-xs text-charcoal/50 mt-0.5 font-mono">Event: {n.eventId}</p>
                      <p className="text-[11px] text-charcoal/35 mt-1">{fmtDate(n.deliveredAt)} · {n.channel}</p>
                    </div>
                    <button
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg text-charcoal/35 hover:text-charcoal hover:bg-dust-grey/30 transition-colors cursor-pointer shrink-0"
                    >
                      <CheckIcon />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Read */}
          {read.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold tracking-widest uppercase text-charcoal/40 mb-3">Read</h2>
              <div className="space-y-2">
                {read.map((n, i) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 rounded-xl px-4 py-3 border border-dust-grey/60 bg-white animate-fade-in"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-dust-grey/60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal/60">Disruption Alert</p>
                      <p className="text-xs text-charcoal/40 mt-0.5 font-mono">Event: {n.eventId}</p>
                      <p className="text-[11px] text-charcoal/30 mt-1">{fmtDate(n.deliveredAt)} · {n.channel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
