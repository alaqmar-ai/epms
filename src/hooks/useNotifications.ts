'use client';

import { useCallback, useEffect, useState } from 'react';
import type { NotificationItem } from '@/lib/types';
import { listNotifications, markNotificationRead } from '@/lib/data/store';
import { runNotificationScan } from '@/lib/notifications';

export function useNotifications(userId: string | undefined) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const rows = await listNotifications(userId);
    setItems(rows);
    setLoading(false);
  }, [userId]);

  // Initial scan + load
  useEffect(() => {
    if (!userId) return;
    (async () => {
      await runNotificationScan();
      await load();
    })();
  }, [userId, load]);

  const markRead = async (id: string) => {
    await markNotificationRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await Promise.all(items.filter((n) => !n.isRead).map((n) => markNotificationRead(n.id)));
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unread = items.filter((n) => !n.isRead).length;

  return { items, loading, unread, markRead, markAllRead, reload: load };
}
