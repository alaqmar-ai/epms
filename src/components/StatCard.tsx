'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor: string;
}

export default function StatCard({ label, value, subtitle, accentColor }: StatCardProps) {
  return (
    <div
      className="bg-card border border-border rounded-md p-4 transition-colors duration-150 hover:bg-elevated"
      style={{ borderLeftWidth: '3px', borderLeftColor: accentColor }}
    >
      <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="font-mono text-2xl font-bold text-text-primary">{value}</p>
      {subtitle && <p className="font-mono text-xs text-text-muted mt-1">{subtitle}</p>}
    </div>
  );
}
