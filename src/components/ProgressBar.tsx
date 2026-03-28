'use client';

interface ProgressBarProps {
  value: number;
}

export default function ProgressBar({ value }: ProgressBarProps) {
  const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : value > 0 ? '#0ea5e9' : '#475569';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs text-text-secondary w-8 text-right">{value}%</span>
    </div>
  );
}
