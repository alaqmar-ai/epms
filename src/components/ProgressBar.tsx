'use client';

interface ProgressBarProps {
  value: number;
}

export default function ProgressBar({ value }: ProgressBarProps) {
  const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : value > 0 ? '#3b82f6' : '#334155';
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full progress-fill"
          style={{
            width: `${value}%`,
            backgroundColor: color,
            boxShadow: value > 0 ? `0 0 8px ${color}40` : 'none',
          }}
        />
      </div>
      <span className="font-mono text-[11px] text-text-muted w-8 text-right tabular-nums">{value}%</span>
    </div>
  );
}
