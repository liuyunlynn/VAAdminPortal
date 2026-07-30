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

const STATUS_ORDER = ['NotStarted', 'Pending', 'Passed', 'Failed'] as const;

export function countBy(
  items: AiVirtualAssistantRegistration[],
  key: 'validationStatus' | 'legalStatus',
) {
  const counts = new Map<string, number>();
  for (const status of STATUS_ORDER) counts.set(status, 0);
  for (const item of items) {
    counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
  }
  return STATUS_ORDER.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}

export function registrationsByMonth(items: AiVirtualAssistantRegistration[]) {
  const buckets = new Map<string, { registrations: number; fullyVerified: number }>();
  for (const item of items) {
    const date = new Date(item.createdDateTime);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.get(key) ?? { registrations: 0, fullyVerified: 0 };
    bucket.registrations += 1;
    if (item.validationStatus === 'Passed' && item.legalStatus === 'Passed') {
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

export function verificationBreakdown(items: AiVirtualAssistantRegistration[]) {
  const levels = ['None', 'Registered', 'Attested'];
  const counts = new Map<string, number>();
  for (const level of levels) counts.set(level, 0);
  for (const item of items) {
    counts.set(item.verification, (counts.get(item.verification) ?? 0) + 1);
  }
  return levels.map((name) => ({ name, value: counts.get(name) ?? 0 }));
}
