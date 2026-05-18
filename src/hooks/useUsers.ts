'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@/lib/types';
import { listUsers } from '@/lib/data/store';

export function useUsers() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listUsers()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const userName = useMemo(() => {
    const map = new Map(data.map((u) => [u.id, u.name]));
    return (id?: string) => (id ? map.get(id) ?? '-' : '-');
  }, [data]);

  return { data, loading, userName };
}
