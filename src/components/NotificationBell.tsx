'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, AlertTriangle, Calendar, Info } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  stage_lead_time: Calendar,
  stage_delayed: AlertTriangle,
  project_delayed: AlertTriangle,
  system: Info,
} as const;

const TONE_MAP = {
  stage_lead_time: 'text-blue-600 bg-blue-50',
  stage_delayed: 'text-red-600 bg-red-50',
  project_delayed: 'text-red-600 bg-red-50',
  system: 'text-text-secondary bg-elevated',
} as const;

export default function NotificationBell() {
  const { user } = useApp();
  const { items, unread, markRead, markAllRead } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl bg-white border border-border hover:bg-elevated transition-colors"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
      >
        <Bell size={18} className="text-text-secondary" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-white border border-border rounded-2xl shadow-elevated overflow-hidden z-40">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-xs text-text-muted text-center">No notifications yet.</p>
            ) : (
              items.slice(0, 30).map((n) => <NotifRow key={n.id} n={n} onClick={() => markRead(n.id)} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({ n, onClick }: { n: NotificationItem; onClick: () => void }) {
  const Icon = ICON_MAP[n.kind];
  const tone = TONE_MAP[n.kind];
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-elevated transition-colors flex gap-3',
        !n.isRead && 'bg-primary-light/40'
      )}
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', tone)}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary leading-snug">{n.title}</p>
        {n.body && <p className="text-xs text-text-muted mt-0.5 leading-snug line-clamp-2">{n.body}</p>}
        <p className="text-[10px] text-text-muted mt-1">{new Date(n.createdAt).toLocaleString()}</p>
      </div>
      {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
    </button>
  );
}
