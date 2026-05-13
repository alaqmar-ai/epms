'use client';

import { useEffect, useState } from 'react';
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

  return { data, loading };
}
