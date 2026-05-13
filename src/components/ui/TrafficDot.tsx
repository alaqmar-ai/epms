import type { Traffic } from '@/lib/status';
import { cn } from '@/lib/utils';

const map: Record<Traffic, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
};

export default function TrafficDot({ tone, className }: { tone: Traffic; className?: string }) {
  return <span className={cn('inline-block w-2 h-2 rounded-full', map[tone], className)} />;
}
