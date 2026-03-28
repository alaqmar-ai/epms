'use client';

import { STATUS_COLORS } from '@/lib/constants';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || '#475569';
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span style={{ color }}>{status}</span>
    </span>
  );
}
