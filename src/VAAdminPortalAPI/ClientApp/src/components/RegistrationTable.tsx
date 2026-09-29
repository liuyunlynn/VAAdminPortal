import {
  Avatar,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  CheckmarkCircleRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  OpenRegular,
} from '@fluentui/react-icons';
import type { AiVirtualAssistantRegistration } from '../api/types';
import { formatDate, statusBadgeColor } from './status';

const useStyles = makeStyles({
  wrapper: {
    width: '100%',
  },
  tableScroll: {
    overflowX: 'auto',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  name: {
    fontWeight: 600,
  },
  assistant: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    flexShrink: 0,
  },
  nameLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  fullyPassedRow: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    borderLeft: `3px solid ${tokens.colorPaletteGreenBorderActive}`,
  },
  sub: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
    overflowWrap: 'anywhere',
  },
  empty: {
    padding: '32px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  pagination: {
    minHeight: '48px',
    padding: '8px 12px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
  },
});

export default function RegistrationTable({
  items,
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  onSelect,
}: {
  items: AiVirtualAssistantRegistration[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (pageIndex: number) => void;
  onSelect: (id: string) => void;
}) {
  const styles = useStyles();
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  if (items.length === 0) {
    return <div className={styles.empty}>No registrations match the current filters.</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableScroll}>
        <Table aria-label="AI virtual assistant registrations" size="medium">
          <TableHeader className={styles.tableHeader}>
            <TableRow>
              <TableHeaderCell>Bot</TableHeaderCell>
              <TableHeaderCell>Business</TableHeaderCell>
              <TableHeaderCell>Bot status</TableHeaderCell>
              <TableHeaderCell>Validation status</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell>Details</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const fullyPassed = item.verified;
              return (
              <TableRow key={item.id} className={fullyPassed ? styles.fullyPassedRow : undefined}>
                <TableCell>
                  <TableCellLayout>
                    <div className={styles.assistant}>
                      <Avatar
                        className={styles.logo}
                        name={item.displayName}
                        image={item.logoUrl?.trim() ? { src: item.logoUrl.trim() } : undefined}
                        size={36}
                      />
                      <div>
                        <div className={styles.nameLine}>
                          <span className={styles.name}>{item.displayName}</span>
                          {fullyPassed && (
                            <Badge
                              appearance="tint"
                              color="success"
                              icon={<CheckmarkCircleRegular />}
                            >
                              Fully passed
                            </Badge>
                          )}
                        </div>
                        <div className={styles.sub}>{item.primaryContact.email}</div>
                      </div>
                    </div>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <div>
                      <div>{item.legalEntity.businessName}</div>
                      <div className={styles.sub}>{item.legalEntity.country ?? '—'}</div>
                    </div>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <Badge
                    appearance="tint"
                    color={item.verification?.toLowerCase() === 'attested' ? 'success' : 'subtle'}
                  >
                    {item.verification || '—'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge appearance="filled" color={statusBadgeColor(item.validationStatus)}>
                    {item.validationStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Text>{formatDate(item.createdDateTime)}</Text>
                </TableCell>
                <TableCell>
                  <Button
                    appearance="subtle"
                    icon={<OpenRegular />}
                    onClick={() => onSelect(item.id)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className={styles.pagination} aria-label="Registration table pagination">
        <Text size={200}>
          {pageIndex * pageSize + 1}-{Math.min(pageIndex * pageSize + items.length, totalCount)} of{' '}
          {totalCount}
        </Text>
        <Button
          appearance="subtle"
          icon={<ChevronLeftRegular />}
          aria-label="Previous page"
          disabled={pageIndex === 0}
          onClick={() => onPageChange(pageIndex - 1)}
        />
        <Text size={200}>
          Page {pageIndex + 1} of {pageCount}
        </Text>
        <Button
          appearance="subtle"
          icon={<ChevronRightRegular />}
          aria-label="Next page"
          disabled={pageIndex >= pageCount - 1}
          onClick={() => onPageChange(pageIndex + 1)}
        />
      </div>
    </div>
  );
}
