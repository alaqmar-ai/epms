import { statusBg } from '@/lib/status';
import type { Status } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function StatusPill({ status, className }: { status: Status | string; className?: string }) {
  return <span className={cn('pill', statusBg(status), className)}>{status}</span>;
}
