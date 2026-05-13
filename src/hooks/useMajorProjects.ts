'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MajorProject } from '@/lib/types';
import { listMajorProjects } from '@/lib/data/store';

export function useMajorProjects() {
  const [data, setData] = useState<MajorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listMajorProjects();
      setData(rows);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
