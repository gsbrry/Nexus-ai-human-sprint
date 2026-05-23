import { cn } from '@/lib/utils';
import type { MockTaskPriority, MockTaskStatus } from '@/lib/mock/yallo';
import { statusLabel } from '@/lib/mock/yallo';
import { Badge } from '@/components/ui/badge';

const PRIORITY_COLOR: Record<MockTaskPriority, string> = {
  low: 'bg-[#555]',
  medium: 'bg-[#378ADD]',
  high: 'bg-[#EF9F27]',
  critical: 'bg-[#E24B4A]',
};

export function PriorityDot({ priority, className }: { priority: MockTaskPriority; className?: string }) {
  return (
    <span
      className={cn('inline-block size-2 rounded-full shrink-0', PRIORITY_COLOR[priority], className)}
      title={`${priority} priority`}
    />
  );
}

const STATUS_VARIANT: Record<
  MockTaskStatus,
  'default' | 'gold' | 'blue' | 'teal' | 'purple' | 'red' | 'amber' | 'green'
> = {
  todo: 'default',
  in_progress: 'blue',
  in_review: 'purple',
  blocked: 'red',
  done: 'teal',
};

export function StatusBadge({ status }: { status: MockTaskStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{statusLabel(status)}</Badge>;
}
