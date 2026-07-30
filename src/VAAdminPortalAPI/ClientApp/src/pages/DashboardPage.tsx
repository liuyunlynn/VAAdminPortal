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
  mergeClasses,
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '48px',
    padding: '8px 24px',
    color: '#ffffff',
    backgroundColor: '#5b5fc7',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    '@media (max-width: 600px)': {
      minHeight: '52px',
      padding: '8px 12px',
    },
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 600,
    fontSize: '16px',
    color: '#ffffff',
    whiteSpace: 'nowrap',
    '@media (max-width: 600px)': {
      fontSize: '14px',
    },
  },
  userBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#ffffff',
    '@media (max-width: 600px)': {
      gap: '6px',
    },
  },
  userDetails: {
    '@media (max-width: 600px)': {
      display: 'none',
    },
  },
  signOutText: {
    '@media (max-width: 600px)': {
      display: 'none',
    },
  },
  signOut: {
    color: '#ffffff',
    ':hover': {
      color: '#ffffff',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    '@media (max-width: 600px)': {
      minWidth: '32px',
    },
  },
  content: {
    padding: '24px 28px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  primaryKpiCard: {
    borderTop: '3px solid #5b5fc7',
    backgroundColor: '#f7f7ff',
  },
  kpiValue: {
    fontSize: '30px',
    fontWeight: 700,
  },
  kpiHint: {
    color: tokens.colorNeutralForeground3,
  },
  statusMetrics: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '4px',
  },
  statusMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statusValue: {
    fontSize: '24px',
    fontWeight: 700,
  },
  overviewHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  overviewFilters: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    flexWrap: 'wrap',
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
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
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
  const [overviewStartDate, setOverviewStartDate] = useState('');
  const [overviewEndDate, setOverviewEndDate] = useState('');
  const [overviewLoading, setOverviewLoading] = useState(false);

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

  const handleOverviewQuery = () => {
    const overviewStart = overviewStartDate ? `${overviewStartDate}T00:00:00.000Z` : null;
    const overviewEnd = overviewEndDate ? `${overviewEndDate}T23:59:59.999Z` : null;

    setOverviewError(null);
    setOverviewLoading(true);
    getAllOverview(overviewStart, overviewEnd)
      .then(setOverview)
      .catch((requestError: unknown) => {
        setOverviewError(
          requestError instanceof Error ? requestError.message : 'Failed to load overview.',
        );
      })
      .finally(() => setOverviewLoading(false));
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
          <BotSparkleRegular fontSize={24} color="#ffffff" />
          VA Admin Portal
        </div>
        <div className={styles.userBox}>
          <Avatar name={admin?.name ?? 'Admin'} color="colorful" />
          <div className={styles.userDetails}>
            <Body1 style={{ display: 'block', fontWeight: 600 }}>{admin?.name}</Body1>
            <Caption1>{admin?.email}</Caption1>
          </div>
          <Button
            className={styles.signOut}
            icon={<SignOutRegular />}
            appearance="subtle"
            aria-label="Sign out"
            onClick={handleSignOut}
          >
            <span className={styles.signOutText}>Sign out</span>
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

        <div className={styles.overviewHeader}>
          <div>
            <Subtitle1>Overview</Subtitle1>
            <Body1 style={{ display: 'block', color: tokens.colorNeutralForeground3 }}>
              Leave both dates empty to show all-time data.
            </Body1>
          </div>
          <div className={styles.overviewFilters}>
            <Field label="Start date">
              <Input
                className={styles.dateInput}
                type="date"
                value={overviewStartDate}
                max={overviewEndDate || undefined}
                onChange={(_, d) => setOverviewStartDate(d.value)}
              />
            </Field>
            <Field label="End date">
              <Input
                className={styles.dateInput}
                type="date"
                value={overviewEndDate}
                min={overviewStartDate || undefined}
                onChange={(_, d) => setOverviewEndDate(d.value)}
              />
            </Field>
            <Button
              icon={<ArrowClockwiseRegular />}
              onClick={handleOverviewQuery}
              disabled={overviewLoading}
            >
              {overviewLoading ? 'Loading' : 'Apply'}
            </Button>
          </div>
        </div>

        <div className={styles.kpiRow}>
          <Card className={styles.kpiCard}>
            <Caption1>Total registrations</Caption1>
            <span className={styles.kpiValue}>{overview?.totalRegistrationsCount ?? 0}</span>
            <Caption1 className={styles.kpiHint}>All submitted assistants</Caption1>
          </Card>
          <Card className={mergeClasses(styles.kpiCard, styles.primaryKpiCard)}>
            <Caption1>Fully verified</Caption1>
            <span className={styles.kpiValue} style={{ color: '#107c10' }}>
              {overview?.verifiedCount ?? 0}
            </span>
            <Caption1 className={styles.kpiHint}>Validation and legal passed</Caption1>
          </Card>
          <Card className={styles.kpiCard}>
            <Caption1>Validation review</Caption1>
            <div className={styles.statusMetrics}>
              <div className={styles.statusMetric}>
                <span className={styles.statusValue} style={{ color: '#107c10' }}>
                  {overview?.validationPassedCount ?? 0}
                </span>
                <Caption1 className={styles.kpiHint}>Passed</Caption1>
              </div>
              <div className={styles.statusMetric}>
                <span className={styles.statusValue} style={{ color: '#b45309' }}>
                  {overview?.validationPendingCount ?? 0}
                </span>
                <Caption1 className={styles.kpiHint}>Pending</Caption1>
              </div>
            </div>
          </Card>
          <Card className={styles.kpiCard}>
            <Caption1>Legal review</Caption1>
            <div className={styles.statusMetrics}>
              <div className={styles.statusMetric}>
                <span className={styles.statusValue} style={{ color: '#107c10' }}>
                  {overview?.legalPassedCount ?? 0}
                </span>
                <Caption1 className={styles.kpiHint}>Passed</Caption1>
              </div>
              <div className={styles.statusMetric}>
                <span className={styles.statusValue} style={{ color: '#b45309' }}>
                  {overview?.legalPendingCount ?? 0}
                </span>
                <Caption1 className={styles.kpiHint}>Pending</Caption1>
              </div>
            </div>
          </Card>
          <Card className={styles.kpiCard}>
            <Caption1>Attested assistants</Caption1>
            <span className={styles.kpiValue} style={{ color: '#5b5fc7' }}>
              {overview?.attestedAssistantsCount ?? 0}
            </span>
            <Caption1 className={styles.kpiHint}>Highest verification level</Caption1>
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
