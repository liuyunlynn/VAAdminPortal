import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Body1,
  Button,
  Card,
  Caption1,
  Dropdown,
  Input,
  Option,
  Spinner,
  Subtitle1,
  Subtitle2,
  Title2,
  Toolbar,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  ArrowClockwiseRegular,
  BotSparkleRegular,
  SearchRegular,
  SignOutRegular,
} from '@fluentui/react-icons';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { signOut } from '../features/auth/authSlice';
import { fetchRegistrations, selectRegistration } from '../features/registrations/registrationsSlice';
import type { LegalStatus, ValidationStatus } from '../api/types';
import DashboardCharts from '../components/DashboardCharts';
import RegistrationTable from '../components/RegistrationTable';
import RegistrationDetailPanel from '../components/RegistrationDetailPanel';

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 600,
    fontSize: '18px',
  },
  userBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  content: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  kpiValue: {
    fontSize: '30px',
    fontWeight: 700,
  },
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  tableCard: {
    padding: '8px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: '48px',
  },
});

const VALIDATION_OPTIONS: (ValidationStatus | 'All')[] = [
  'All',
  'NotStarted',
  'Pending',
  'Passed',
  'Failed',
];
const LEGAL_OPTIONS: (LegalStatus | 'All')[] = ['All', 'NotStarted', 'Pending', 'Passed', 'Failed'];

export default function DashboardPage() {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const admin = useAppSelector((s) => s.auth.admin);
  const { items, status, error, selectedId } = useAppSelector((s) => s.registrations);

  const [search, setSearch] = useState('');
  const [validation, setValidation] = useState<ValidationStatus | 'All'>('All');
  const [legal, setLegal] = useState<LegalStatus | 'All'>('All');

  useEffect(() => {
    dispatch(fetchRegistrations({}));
  }, [dispatch]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (validation !== 'All' && item.validationStatus !== validation) return false;
      if (legal !== 'All' && item.legalStatus !== legal) return false;
      if (term.length > 0) {
        const haystack = [
          item.displayName,
          item.legalEntity.businessName,
          item.primaryContact.email,
          item.domain ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [items, search, validation, legal]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const kpis = useMemo(() => {
    const total = items.length;
    const passed = items.filter((i) => i.validationStatus === 'Passed').length;
    const pending = items.filter(
      (i) => i.validationStatus === 'Pending' || i.legalStatus === 'Pending',
    ).length;
    const attested = items.filter((i) => i.verification === 'Attested').length;
    return { total, passed, pending, attested };
  }, [items]);

  const handleSignOut = () => {
    dispatch(signOut());
    navigate('/');
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <BotSparkleRegular fontSize={26} color="#4f6bed" />
          VA Admin Portal
        </div>
        <div className={styles.userBox}>
          <Avatar name={admin?.name ?? 'Admin'} color="colorful" />
          <div>
            <Body1 style={{ display: 'block', fontWeight: 600 }}>{admin?.name}</Body1>
            <Caption1>{admin?.email}</Caption1>
          </div>
          <Button icon={<SignOutRegular />} appearance="subtle" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main className={styles.content}>
        <div>
          <Title2>Dashboard</Title2>
          <Body1 style={{ display: 'block', color: tokens.colorNeutralForeground3 }}>
            Overview of AI virtual assistant registrations.
          </Body1>
        </div>

        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}

        <div className={styles.kpiRow}>
          <Card className={styles.kpiCard}>
            <Caption1>Total registrations</Caption1>
            <span className={styles.kpiValue}>{kpis.total}</span>
          </Card>
          <Card className={styles.kpiCard}>
            <Caption1>Validation passed</Caption1>
            <span className={styles.kpiValue} style={{ color: '#107c10' }}>
              {kpis.passed}
            </span>
          </Card>
          <Card className={styles.kpiCard}>
            <Caption1>Pending review</Caption1>
            <span className={styles.kpiValue} style={{ color: '#f7a501' }}>
              {kpis.pending}
            </span>
          </Card>
          <Card className={styles.kpiCard}>
            <Caption1>Attested assistants</Caption1>
            <span className={styles.kpiValue} style={{ color: '#4f6bed' }}>
              {kpis.attested}
            </span>
          </Card>
        </div>

        <Subtitle1>Insights</Subtitle1>
        <DashboardCharts items={items} />

        <Card className={styles.tableCard}>
          <div style={{ padding: '12px 12px 0' }}>
            <Subtitle2>Registrations</Subtitle2>
          </div>
          <Toolbar style={{ padding: '12px', gap: '12px' }}>
            <div className={styles.filters}>
              <Input
                value={search}
                onChange={(_, d) => setSearch(d.value)}
                contentBefore={<SearchRegular />}
                placeholder="Search name, business, email..."
                style={{ minWidth: '260px' }}
              />
              <Dropdown
                aria-label="Validation status filter"
                value={validation}
                selectedOptions={[validation]}
                onOptionSelect={(_, d) =>
                  setValidation((d.optionValue as ValidationStatus | 'All') ?? 'All')
                }
              >
                {VALIDATION_OPTIONS.map((opt) => (
                  <Option key={opt} value={opt}>
                    {opt === 'All' ? 'All validation' : opt}
                  </Option>
                ))}
              </Dropdown>
              <Dropdown
                aria-label="Legal status filter"
                value={legal}
                selectedOptions={[legal]}
                onOptionSelect={(_, d) => setLegal((d.optionValue as LegalStatus | 'All') ?? 'All')}
              >
                {LEGAL_OPTIONS.map((opt) => (
                  <Option key={opt} value={opt}>
                    {opt === 'All' ? 'All legal' : opt}
                  </Option>
                ))}
              </Dropdown>
              <Button
                icon={<ArrowClockwiseRegular />}
                onClick={() => dispatch(fetchRegistrations({}))}
              >
                Refresh
              </Button>
            </div>
          </Toolbar>

          {status === 'loading' ? (
            <div className={styles.loading}>
              <Spinner label="Loading registrations..." />
            </div>
          ) : (
            <RegistrationTable
              items={filtered}
              onSelect={(id) => dispatch(selectRegistration(id))}
            />
          )}
        </Card>
      </main>

      <RegistrationDetailPanel
        registration={selected}
        open={selected != null}
        onClose={() => dispatch(selectRegistration(null))}
      />
    </div>
  );
}
