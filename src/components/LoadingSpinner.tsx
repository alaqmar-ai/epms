'use client';

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-10 w-full" />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-md p-4" style={{ borderLeftWidth: '3px', borderLeftColor: '#1e293b' }}>
      <div className="skeleton h-3 w-20 mb-2" />
      <div className="skeleton h-8 w-16 mb-1" />
      <div className="skeleton h-3 w-24" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="bg-elevated p-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-3 flex gap-4 border-t border-border">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
