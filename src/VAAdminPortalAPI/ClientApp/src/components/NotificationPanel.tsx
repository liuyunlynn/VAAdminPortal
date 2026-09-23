import { useMemo } from 'react';
import {
  Avatar,
  Badge,
  Body1,
  Button,
  Caption1,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Subtitle2,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ChevronRightRegular, DismissRegular } from '@fluentui/react-icons';
import type { AiVirtualAssistantRegistration } from '../api/types';
import { formatDate } from './status';

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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  item: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    textAlign: 'left',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    ':focus-visible': {
      outline: `2px solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: '2px',
    },
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  botName: {
    overflow: 'hidden',
    fontWeight: 600,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  failedChecks: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
    flexWrap: 'wrap',
  },
  chevron: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3,
  },
  empty: {
    padding: '48px 16px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

export function isFailedRegistration(item: AiVirtualAssistantRegistration): boolean {
  return item.validationStatus === 'Failed';
}

export function countNewFailedRegistrations(
  items: AiVirtualAssistantRegistration[],
  lastReadAt: string | null,
): number {
  const parsedLastReadTime = lastReadAt ? new Date(lastReadAt).getTime() : Number.NaN;
  const lastReadTime = Number.isNaN(parsedLastReadTime)
    ? Number.NEGATIVE_INFINITY
    : parsedLastReadTime;

  return items.filter((item) => {
    const createdTime = new Date(item.createdDateTime).getTime();
    return isFailedRegistration(item) && !Number.isNaN(createdTime) && createdTime > lastReadTime;
  }).length;
}

export default function NotificationPanel({
  items,
  open,
  onClose,
  onSelect,
}: {
  items: AiVirtualAssistantRegistration[];
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const styles = useStyles();
  const failedItems = useMemo(
    () =>
      items
        .filter(isFailedRegistration)
        .sort(
          (left, right) =>
            new Date(right.createdDateTime).getTime() - new Date(left.createdDateTime).getTime(),
        ),
    [items],
  );

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
          <Subtitle2>Failed bots</Subtitle2>
          <Caption1 className={styles.secondaryText}>
            Select a bot to review and update its failed checks.
          </Caption1>
        </div>

        {failedItems.length === 0 ? (
          <div className={styles.empty}>
            <Body1>No failed bots.</Body1>
          </div>
        ) : (
          <div className={styles.list}>
            {failedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.item}
                onClick={() => onSelect(item.id)}
                aria-label={`Review failed bot ${item.displayName}`}
              >
                <Avatar
                  name={item.displayName}
                  image={item.logoUrl?.trim() ? { src: item.logoUrl.trim() } : undefined}
                  size={40}
                />
                <div className={styles.itemContent}>
                  <div className={styles.itemHeader}>
                    <span className={styles.botName}>{item.displayName}</span>
                    <Caption1 className={styles.secondaryText}>
                      {formatDate(item.createdDateTime)}
                    </Caption1>
                  </div>
                  <Caption1 className={styles.secondaryText}>
                    {item.legalEntity.businessName}
                  </Caption1>
                  <div className={styles.failedChecks}>
                    {item.validationStatus === 'Failed' && (
                      <Badge appearance="tint" color="danger">Validation failed</Badge>
                    )}
                  </div>
                </div>
                <ChevronRightRegular className={styles.chevron} />
              </button>
            ))}
          </div>
        )}
      </DrawerBody>
    </Drawer>
  );
}