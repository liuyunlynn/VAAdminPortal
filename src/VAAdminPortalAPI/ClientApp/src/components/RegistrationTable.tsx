import {
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
import { OpenRegular } from '@fluentui/react-icons';
import type { AiVirtualAssistantRegistration } from '../api/types';
import { formatDate, statusBadgeColor } from './status';

const useStyles = makeStyles({
  wrapper: {
    overflowX: 'auto',
  },
  name: {
    fontWeight: 600,
  },
  sub: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
  },
  empty: {
    padding: '32px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

export default function RegistrationTable({
  items,
  onSelect,
}: {
  items: AiVirtualAssistantRegistration[];
  onSelect: (id: string) => void;
}) {
  const styles = useStyles();

  if (items.length === 0) {
    return <div className={styles.empty}>No registrations match the current filters.</div>;
  }

  return (
    <div className={styles.wrapper}>
      <Table aria-label="AI virtual assistant registrations" size="medium">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Assistant</TableHeaderCell>
            <TableHeaderCell>Business</TableHeaderCell>
            <TableHeaderCell>Validation</TableHeaderCell>
            <TableHeaderCell>Legal</TableHeaderCell>
            <TableHeaderCell>Verification</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            <TableHeaderCell>Details</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <TableCellLayout>
                  <div>
                    <div className={styles.name}>{item.displayName}</div>
                    <div className={styles.sub}>{item.primaryContact.email}</div>
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
                <Badge appearance="filled" color={statusBadgeColor(item.validationStatus)}>
                  {item.validationStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge appearance="filled" color={statusBadgeColor(item.legalStatus)}>
                  {item.legalStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <Text>{item.verification}</Text>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
