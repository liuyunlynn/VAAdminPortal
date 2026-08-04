import { useMemo } from 'react';
import {
  Body1,
  Button,
  Caption1,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Subtitle2,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import type { AiVirtualAssistantRegistration } from '../api/types';

interface DailySummary {
  key: string;
  label: string;
  total: number;
  fullyPassed: number;
  inReview: number;
  needsAttention: number;
}

const useStyles = makeStyles({
  drawer: {
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.12)',
  },
  introduction: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px 0 18px',
  },
  secondaryText: {
    display: 'block',
    color: tokens.colorNeutralForeground3,
  },
  day: {
    padding: '18px 0',
  },
  dayHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '12px',
  },
  totalCount: {
    fontSize: '28px',
    lineHeight: '32px',
    fontWeight: 700,
    color: tokens.colorBrandForeground1,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '8px',
  },
  summaryMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    minWidth: 0,
    padding: '10px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  metricCount: {
    fontSize: '20px',
    lineHeight: '24px',
    fontWeight: 700,
  },
  metricLabel: {
    color: tokens.colorNeutralForeground3,
  },
  empty: {
    padding: '48px 16px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

function localDateKey(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => (index === 0 ? String(part) : String(part).padStart(2, '0')))
    .join('-');
}

function groupByDay(items: AiVirtualAssistantRegistration[]): DailySummary[] {
  const groups = new Map<string, AiVirtualAssistantRegistration[]>();

  for (const item of items) {
    const key = localDateKey(item.createdDateTime);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([key, registrations]) => {
      const fullyPassed = registrations.filter(
        (item) => item.validationStatus === 'Passed' && item.legalStatus === 'Passed',
      ).length;
      const needsAttention = registrations.filter(
        (item) => item.validationStatus === 'Failed' || item.legalStatus === 'Failed',
      ).length;
      const inReview = registrations.length - fullyPassed - needsAttention;

      return {
        key,
        label: new Date(`${key}T00:00:00`).toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        total: registrations.length,
        fullyPassed,
        inReview,
        needsAttention,
      };
    });
}

export function countNewRegistrations(
  items: AiVirtualAssistantRegistration[],
  lastReadAt: string | null,
): number {
  const lastReadTime = lastReadAt ? new Date(lastReadAt).getTime() : Number.NEGATIVE_INFINITY;
  return items.filter((item) => {
    const createdTime = new Date(item.createdDateTime).getTime();
    return !Number.isNaN(createdTime) && createdTime > lastReadTime;
  }).length;
}

export function latestRegistrationTimestamp(
  items: AiVirtualAssistantRegistration[],
): string | null {
  const latestTime = items.reduce((latest, item) => {
    const createdTime = new Date(item.createdDateTime).getTime();
    return Number.isNaN(createdTime) ? latest : Math.max(latest, createdTime);
  }, Number.NEGATIVE_INFINITY);
  return Number.isFinite(latestTime) ? new Date(latestTime).toISOString() : null;
}

export default function NotificationPanel({
  items,
  open,
  onClose,
}: {
  items: AiVirtualAssistantRegistration[];
  open: boolean;
  onClose: () => void;
}) {
  const styles = useStyles();
  const summaries = useMemo(() => groupByDay(items), [items]);

  return (
    <Drawer
      className={styles.drawer}
      type="overlay"
      position="end"
      size="medium"
      open={open}
      onOpenChange={(_, data) => !data.open && onClose()}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              aria-label="Close notifications"
              onClick={onClose}
            />
          }
        >
          Notifications
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <div className={styles.introduction}>
          <Subtitle2>Daily registration activity</Subtitle2>
          <Caption1 className={styles.secondaryText}>
            Registration totals and review outcomes, grouped by day.
          </Caption1>
        </div>

        {summaries.length === 0 ? (
          <div className={styles.empty}>
            <Body1>No registration activity yet.</Body1>
          </div>
        ) : (
          summaries.map((summary, index) => (
            <div key={summary.key}>
              {index > 0 && <Divider />}
              <section className={styles.day} aria-labelledby={`notification-day-${summary.key}`}>
                <div className={styles.dayHeader}>
                  <div>
                    <Subtitle2 id={`notification-day-${summary.key}`}>{summary.label}</Subtitle2>
                    <Caption1 className={styles.secondaryText}>
                      Daily summary
                    </Caption1>
                  </div>
                  <div>
                    <div className={styles.totalCount}>{summary.total}</div>
                    <Caption1 className={styles.secondaryText}>
                      {summary.total === 1 ? 'registration' : 'registrations'}
                    </Caption1>
                  </div>
                </div>

                <div className={styles.summaryGrid}>
                  <div className={styles.summaryMetric}>
                    <span className={styles.metricCount}>{summary.fullyPassed}</span>
                    <Caption1 className={styles.metricLabel}>Fully passed</Caption1>
                  </div>
                  <div className={styles.summaryMetric}>
                    <span className={styles.metricCount}>{summary.inReview}</span>
                    <Caption1 className={styles.metricLabel}>In review</Caption1>
                  </div>
                  <div className={styles.summaryMetric}>
                    <span className={styles.metricCount}>{summary.needsAttention}</span>
                    <Caption1 className={styles.metricLabel}>Attention</Caption1>
                  </div>
                </div>
              </section>
            </div>
          ))
        )}
      </DrawerBody>
    </Drawer>
  );
}