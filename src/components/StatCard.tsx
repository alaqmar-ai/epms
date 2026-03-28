'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor: string;
}

export default function StatCard({ label, value, subtitle, accentColor }: StatCardProps) {
  return (
    <div className="card p-4 relative overflow-hidden group">
      {/* Accent gradient glow */}
      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />
      <div
        className="absolute top-0 left-0 w-16 h-16 rounded-full opacity-[0.04] -translate-x-4 -translate-y-4 group-hover:opacity-[0.08] transition-opacity"
        style={{ background: accentColor }}
      />

      <p className="text-text-muted text-[11px] font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className="font-mono text-2xl font-bold text-text-primary tabular-nums">{value}</p>
      {subtitle && <p className="font-mono text-[11px] text-text-muted mt-1.5">{subtitle}</p>}
    </div>
  );
}
