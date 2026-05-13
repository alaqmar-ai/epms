'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SubProject } from '@/lib/types';
import { listSubProjects } from '@/lib/data/store';

export function useSubProjects(majorId?: string) {
  const [data, setData] = useState<SubProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listSubProjects(majorId);
      setData(rows);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [majorId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
