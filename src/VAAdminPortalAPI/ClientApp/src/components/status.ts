import type { Badge } from '@fluentui/react-components';
import type { AiVirtualAssistantRegistration } from '../api/types';

type BadgeColor = React.ComponentProps<typeof Badge>['color'];

export const STATUS_COLORS: Record<string, string> = {
  NotStarted: '#8a8886',
  Pending: '#f7a501',
  Passed: '#107c10',
  Failed: '#d13438',
};

export function statusBadgeColor(status: string): BadgeColor {
  switch (status) {
    case 'Passed':
      return 'success';
    case 'Pending':
      return 'warning';
    case 'Failed':
      return 'danger';
    default:
      return 'informative';
  }
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function registrationsByMonth(items: AiVirtualAssistantRegistration[]) {
  const buckets = new Map<string, { registrations: number; fullyVerified: number }>();
  for (const item of items) {
    const date = new Date(item.createdDateTime);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.get(key) ?? { registrations: 0, fullyVerified: 0 };
    bucket.registrations += 1;
    if (item.verified) {
      bucket.fullyVerified += 1;
    }
    buckets.set(key, bucket);
  }
  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, counts]) => ({
      month: new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
      }),
      ...counts,
    }));
}
