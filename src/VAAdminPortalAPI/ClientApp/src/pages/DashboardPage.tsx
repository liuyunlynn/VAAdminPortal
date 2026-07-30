import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Body1,
  Button,
  Card,
  Caption1,
  Dropdown,
  Field,
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
import { getAllOverview } from '../api/client';
import { signOut } from '../features/auth/authSlice';
import {
  fetchRegistrationCharts,
  fetchRegistrations,
  selectRegistration,
} from '../features/registrations/registrationsSlice';
import type {
  AllOverview,
  LegalStatus,
  RegistrationQuery,
  ValidationStatus,
} from '../api/types';
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
    gap: '8px',
    flexWrap: 'nowrap',
    alignItems: 'flex-end',
    minWidth: 'max-content',
  },
  filterToolbar: {
    overflowX: 'auto',
    padding: '12px',
  },
  dateInput: {
    width: '145px',
    minWidth: '145px',
  },
  searchInput: {
    width: '240px',
    minWidth: '240px',
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
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const dropdownWidth = (labels: string[]) => `${Math.max(...labels.map((label) => label.length)) + 6}ch`;
const VALIDATION_DROPDOWN_WIDTH = dropdownWidth(
  VALIDATION_OPTIONS.map((option) => (option === 'All' ? 'All validation' : option)),
);
const LEGAL_DROPDOWN_WIDTH = dropdownWidth(
  LEGAL_OPTIONS.map((option) => (option === 'All' ? 'All legal' : option)),
);
const PAGE_SIZE_DROPDOWN_WIDTH = dropdownWidth(PAGE_SIZE_OPTIONS.map(String));

export default function DashboardPage() {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const admin = useAppSelector((s) => s.auth.admin);
  const { items, chartItems, totalCount, status, error, selectedId } = useAppSelector(
    (s) => s.registrations,
  );

  const [search, setSearch] = useState('');
  const [validation, setValidation] = useState<ValidationStatus | 'All'>('All');
  const [legal, setLegal] = useState<LegalStatus | 'All'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [submittedPageSize, setSubmittedPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [submittedQuery, setSubmittedQuery] = useState<RegistrationQuery>({});
  const [overview, setOverview] = useState<AllOverview | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    dispatch(fetchRegistrations({ pageIndex: 0, pageSize: 10 }));
    dispatch(fetchRegistrationCharts({}));
    getAllOverview()
      .then((result) => {
        if (active) setOverview(result);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setOverviewError(
            requestError instanceof Error ? requestError.message : 'Failed to load overview.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const createQuery = (): RegistrationQuery => ({
    startDate: startDate ? `${startDate}T00:00:00.000Z` : null,
    endDate: endDate ? `${endDate}T23:59:59.999Z` : null,
    searchTerm: search.trim() || null,
    validationStatus: validation === 'All' ? null : validation,
    legalStatus: legal === 'All' ? null : legal,
  });

  const handleQuery = () => {
    const query = createQuery();
    setSubmittedQuery(query);
    setSubmittedPageSize(pageSize);
    setPageIndex(0);
    dispatch(fetchRegistrations({ ...query, pageIndex: 0, pageSize }));
    dispatch(fetchRegistrationCharts(query));
  };

  const handlePageChange = (nextPageIndex: number) => {
    setPageIndex(nextPageIndex);
    dispatch(
      fetchRegistrations({
        ...submittedQuery,
        pageIndex: nextPageIndex,
        pageSize: submittedPageSize,
      }),
    );
  };

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

        {(error || overviewError) && (
          <MessageBar intent="error">
            <MessageBarBody>{error ?? overviewError}</MessageBarBody>
          </MessageBar>
        )}

        <div className={styles.kpiRow}>
          <Card className={styles.kpiCard}>
            <Caption1>Total registrations</Caption1>
            <span className={styles.kpiValue}>{overview?.totalRegistrationsCount ?? 0}</span>
          </Card>
          <Card className={styles.kpiCard}>
            <Caption1>Validation passed</Caption1>
            <span className={styles.kpiValue} style={{ color: '#107c10' }}>
              {overview?.validationPassedCount ?? 0}
            </span>
          </Card>
          <Card className={styles.kpiCard}>
            <Caption1>Pending review</Caption1>
            <span className={styles.kpiValue} style={{ color: '#f7a501' }}>
              {overview?.pendingReviewCount ?? 0}
            </span>
          </Card>
          <Card className={styles.kpiCard}>
            <Caption1>Attested assistants</Caption1>
            <span className={styles.kpiValue} style={{ color: '#4f6bed' }}>
              {overview?.attestedAssistantsCount ?? 0}
            </span>
          </Card>
        </div>

        <Subtitle1>Insights</Subtitle1>
        <DashboardCharts items={chartItems} />

        <Card className={styles.tableCard}>
          <div style={{ padding: '12px 12px 0' }}>
            <Subtitle2>Registrations</Subtitle2>
          </div>
          <Toolbar className={styles.filterToolbar}>
            <div className={styles.filters}>
              <Field label="Validation status">
                <Dropdown
                  style={{
                    width: VALIDATION_DROPDOWN_WIDTH,
                    minWidth: VALIDATION_DROPDOWN_WIDTH,
                  }}
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
              </Field>
              <Field label="Legal status">
                <Dropdown
                  style={{ width: LEGAL_DROPDOWN_WIDTH, minWidth: LEGAL_DROPDOWN_WIDTH }}
                  value={legal}
                  selectedOptions={[legal]}
                  onOptionSelect={(_, d) =>
                    setLegal((d.optionValue as LegalStatus | 'All') ?? 'All')
                  }
                >
                  {LEGAL_OPTIONS.map((opt) => (
                    <Option key={opt} value={opt}>
                      {opt === 'All' ? 'All legal' : opt}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Start date">
                <Input
                  className={styles.dateInput}
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(_, d) => setStartDate(d.value)}
                />
              </Field>
              <Field label="End date">
                <Input
                  className={styles.dateInput}
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(_, d) => setEndDate(d.value)}
                />
              </Field>
              <Field label="Search">
                <Input
                  className={styles.searchInput}
                  value={search}
                  onChange={(_, d) => setSearch(d.value)}
                  contentBefore={<SearchRegular />}
                  placeholder="Name, business, or email"
                />
              </Field>
              <Field label="Page size">
                <Dropdown
                  style={{
                    width: PAGE_SIZE_DROPDOWN_WIDTH,
                    minWidth: PAGE_SIZE_DROPDOWN_WIDTH,
                  }}
                  value={String(pageSize)}
                  selectedOptions={[String(pageSize)]}
                  onOptionSelect={(_, d) => setPageSize(Number(d.optionValue ?? 10))}
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <Option key={option} value={String(option)}>
                      {String(option)}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Button
                icon={<ArrowClockwiseRegular />}
                onClick={handleQuery}
                disabled={status === 'loading'}
              >
                Query
              </Button>
            </div>
          </Toolbar>

          {status === 'loading' ? (
            <div className={styles.loading}>
              <Spinner label="Loading registrations..." />
            </div>
          ) : (
            <RegistrationTable
              items={items}
              pageIndex={pageIndex}
              pageSize={submittedPageSize}
              totalCount={totalCount}
              onPageChange={handlePageChange}
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
