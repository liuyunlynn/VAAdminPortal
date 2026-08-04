import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Body1,
  Button,
  Card,
  Caption1,
  CounterBadge,
  Dropdown,
  Field,
  Input,
  Option,
  Spinner,
  Subtitle1,
  Subtitle2,
  Title2,
  Toolbar,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  ArrowClockwiseRegular,
  AlertRegular,
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
  registrationUpdated,
  selectRegistration,
} from '../features/registrations/registrationsSlice';
import type {
  AiVirtualAssistantRegistration,
  AllOverview,
  LegalStatus,
  RegistrationQuery,
  ValidationStatus,
} from '../api/types';
import DashboardCharts from '../components/DashboardCharts';
import RegistrationTable from '../components/RegistrationTable';
import RegistrationDetailPanel from '../components/RegistrationDetailPanel';
import CopilotPanel from '../components/CopilotPanel';
import CopilotIcon from '../components/CopilotIcon';
import NotificationPanel, {
  countNewRegistrations,
  latestRegistrationTimestamp,
} from '../components/NotificationPanel';
import { STATUS_COLORS } from '../components/status';

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
  notificationButton: {
    color: '#ffffff',
    position: 'relative',
    ':hover': {
      color: '#ffffff',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
  },
  notificationBadge: {
    position: 'absolute',
    top: '1px',
    right: '1px',
  },
  copilotFab: {
    position: 'fixed',
    right: '24px',
    bottom: '24px',
    zIndex: 20,
    width: '56px',
    minWidth: '56px',
    height: '56px',
    padding: 0,
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
    ':hover': {
      backgroundColor: '#f7f7ff',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.22)',
    },
    '@media (max-width: 600px)': {
      right: '16px',
      bottom: '16px',
      width: '48px',
      minWidth: '48px',
      height: '48px',
    },
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
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
    fontSize: '44px',
    lineHeight: '52px',
    fontWeight: 700,
  },
  kpiHint: {
    color: tokens.colorNeutralForeground3,
  },
  statusMetrics: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: '16px',
    rowGap: '10px',
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

const REVIEW_STATUS_LABELS: Record<string, string> = {
  Passed: 'Passed',
  Pending: 'Pending',
  NotStarted: 'Not started',
  Failed: 'Failed',
};
const REVIEW_STATUS_ORDER = ['Passed', 'Pending', 'NotStarted', 'Failed'] as const;

const VALIDATION_OPTIONS: (ValidationStatus | 'All')[] = [
  'All',
  'NotStarted',
  'Pending',
  'Passed',
  'Failed',
];
const LEGAL_OPTIONS: (LegalStatus | 'All')[] = ['All', 'NotStarted', 'Pending', 'Passed', 'Failed'];
const REVIEW_RESULT_OPTIONS = ['All', 'Fully passed', 'Not fully passed'] as const;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const NOTIFICATIONS_LAST_READ_KEY = 'va-admin-portal-notifications-last-read';

const dropdownWidth = (labels: string[]) => `${Math.max(...labels.map((label) => label.length)) + 6}ch`;
const VALIDATION_DROPDOWN_WIDTH = dropdownWidth(
  VALIDATION_OPTIONS.map((option) => (option === 'All' ? 'All validation' : option)),
);
const LEGAL_DROPDOWN_WIDTH = dropdownWidth(
  LEGAL_OPTIONS.map((option) => (option === 'All' ? 'All legal' : option)),
);
const REVIEW_RESULT_DROPDOWN_WIDTH = dropdownWidth([...REVIEW_RESULT_OPTIONS]);
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
  const [reviewResult, setReviewResult] = useState<(typeof REVIEW_RESULT_OPTIONS)[number]>('All');
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
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLastReadAt, setNotificationsLastReadAt] = useState<string | null>(() =>
    localStorage.getItem(NOTIFICATIONS_LAST_READ_KEY),
  );

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
    () =>
      items.find((item) => item.id === selectedId) ??
      chartItems.find((item) => item.id === selectedId) ??
      null,
    [chartItems, items, selectedId],
  );

  const newNotificationCount = useMemo(
    () => countNewRegistrations(chartItems, notificationsLastReadAt),
    [chartItems, notificationsLastReadAt],
  );

  const reviewCounts = useMemo(
    () => ({
      validation: {
        Passed: overview?.validationPassedCount ?? 0,
        Pending: overview?.validationPendingCount ?? 0,
        NotStarted: overview?.validationNotStartedCount ?? 0,
        Failed: overview?.validationFailedCount ?? 0,
      },
      legal: {
        Passed: overview?.legalPassedCount ?? 0,
        Pending: overview?.legalPendingCount ?? 0,
        NotStarted: overview?.legalNotStartedCount ?? 0,
        Failed: overview?.legalFailedCount ?? 0,
      },
    }),
    [overview],
  );

  const copilotFilterSummary = useMemo(() => {
    const parts: string[] = [];
    if (submittedQuery.startDate || submittedQuery.endDate) {
      parts.push(`date ${submittedQuery.startDate?.slice(0, 10) ?? 'any'} to ${submittedQuery.endDate?.slice(0, 10) ?? 'any'}`);
    }
    if (submittedQuery.validationStatus) parts.push(`validation ${submittedQuery.validationStatus}`);
    if (submittedQuery.legalStatus) parts.push(`legal ${submittedQuery.legalStatus}`);
    if (submittedQuery.fullyPassed != null) {
      parts.push(submittedQuery.fullyPassed ? 'fully passed only' : 'not fully passed only');
    }
    if (submittedQuery.searchTerm) parts.push(`search "${submittedQuery.searchTerm}"`);
    return parts.length > 0 ? `filters: ${parts.join(', ')}` : 'no filters applied';
  }, [submittedQuery]);

  const createQuery = (): RegistrationQuery => ({
    startDate: startDate ? `${startDate}T00:00:00.000Z` : null,
    endDate: endDate ? `${endDate}T23:59:59.999Z` : null,
    searchTerm: search.trim() || null,
    validationStatus: validation === 'All' ? null : validation,
    legalStatus: legal === 'All' ? null : legal,
    fullyPassed: reviewResult === 'All' ? null : reviewResult === 'Fully passed',
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

  const handleActionComplete = (updated: AiVirtualAssistantRegistration) => {
    dispatch(registrationUpdated(updated));
    dispatch(
      fetchRegistrations({
        ...submittedQuery,
        pageIndex,
        pageSize: submittedPageSize,
      }),
    );
    dispatch(fetchRegistrationCharts(submittedQuery));

    const overviewStart = overviewStartDate ? `${overviewStartDate}T00:00:00.000Z` : null;
    const overviewEnd = overviewEndDate ? `${overviewEndDate}T23:59:59.999Z` : null;
    getAllOverview(overviewStart, overviewEnd).then(setOverview).catch(() => undefined);
  };

  const handleSignOut = () => {
    dispatch(signOut());
    navigate('/');
  };

  const closeNotifications = () => {
    const latestTimestamp = latestRegistrationTimestamp(chartItems);
    if (latestTimestamp) {
      localStorage.setItem(NOTIFICATIONS_LAST_READ_KEY, latestTimestamp);
      setNotificationsLastReadAt(latestTimestamp);
    }
    setNotificationsOpen(false);
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <BotSparkleRegular fontSize={24} color="#ffffff" />
          VA Admin Portal
        </div>
        <div className={styles.userBox}>
          <Tooltip
            content={`${newNotificationCount} new ${newNotificationCount === 1 ? 'notification' : 'notifications'}`}
            relationship="label"
          >
            <Button
              className={styles.notificationButton}
              appearance="subtle"
              icon={<AlertRegular />}
              aria-label="Open notifications"
              onClick={() => setNotificationsOpen(true)}
            >
              {newNotificationCount > 0 && (
                <CounterBadge
                  className={styles.notificationBadge}
                  size="small"
                  color="danger"
                  count={newNotificationCount}
                  overflowCount={99}
                />
              )}
            </Button>
          </Tooltip>
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
          <Card className={mergeClasses(styles.kpiCard, styles.primaryKpiCard)}>
            <Caption1>Total registrations</Caption1>
            <span className={styles.kpiValue} style={{ color: '#5b5fc7' }}>{overview?.totalRegistrationsCount ?? 0}</span>
            <Caption1 className={styles.kpiHint}>All submitted assistants</Caption1>
          </Card>
          <Card className={mergeClasses(styles.kpiCard, styles.primaryKpiCard)}>
            <Caption1>Fully passed</Caption1>
            <span className={styles.kpiValue} style={{ color: '#107c10' }}>
              {overview?.verifiedCount ?? 0}
            </span>
            <Caption1 className={styles.kpiHint}>Validation and legal passed</Caption1>
          </Card>
          <Card className={mergeClasses(styles.kpiCard, styles.primaryKpiCard)}>
            <Caption1>Validation review</Caption1>
            <div className={styles.statusMetrics}>
              {REVIEW_STATUS_ORDER.map((status) => (
                <div key={status} className={styles.statusMetric}>
                  <span className={styles.statusValue} style={{ color: STATUS_COLORS[status] }}>
                    {reviewCounts.validation[status]}
                  </span>
                  <Caption1 className={styles.kpiHint}>{REVIEW_STATUS_LABELS[status]}</Caption1>
                </div>
              ))}
            </div>
          </Card>
          <Card className={mergeClasses(styles.kpiCard, styles.primaryKpiCard)}>
            <Caption1>Legal review</Caption1>
            <div className={styles.statusMetrics}>
              {REVIEW_STATUS_ORDER.map((status) => (
                <div key={status} className={styles.statusMetric}>
                  <span className={styles.statusValue} style={{ color: STATUS_COLORS[status] }}>
                    {reviewCounts.legal[status]}
                  </span>
                  <Caption1 className={styles.kpiHint}>{REVIEW_STATUS_LABELS[status]}</Caption1>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className={styles.sectionHeader}>
          <Subtitle1>Insights</Subtitle1>
          <Button
            appearance="outline"
            icon={<CopilotIcon fontSize={18} />}
            onClick={() => setCopilotOpen(true)}
          >
            Summarize with Copilot
          </Button>
        </div>
        <DashboardCharts overview={overview} />

        <Card className={styles.tableCard}>
          <div style={{ padding: '12px 12px 0' }}>
            <Subtitle2>Registrations</Subtitle2>
          </div>
          <Toolbar className={styles.filterToolbar}>
            <div className={styles.filters}>
              <Field label="Review result">
                <Dropdown
                  style={{
                    width: REVIEW_RESULT_DROPDOWN_WIDTH,
                    minWidth: REVIEW_RESULT_DROPDOWN_WIDTH,
                  }}
                  value={reviewResult}
                  selectedOptions={[reviewResult]}
                  onOptionSelect={(_, d) =>
                    setReviewResult(
                      (d.optionValue as (typeof REVIEW_RESULT_OPTIONS)[number]) ?? 'All',
                    )
                  }
                >
                  {REVIEW_RESULT_OPTIONS.map((option) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
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

      <Tooltip content="Ask Copilot" relationship="label" positioning="before">
        <Button
          className={styles.copilotFab}
          appearance="subtle"
          shape="circular"
          icon={<CopilotIcon fontSize={30} />}
          onClick={() => setCopilotOpen(true)}
        />
      </Tooltip>

      <RegistrationDetailPanel
        registration={selected}
        open={selected != null}
        onClose={() => dispatch(selectRegistration(null))}
        onActionComplete={handleActionComplete}
      />

      <NotificationPanel
        items={chartItems}
        open={notificationsOpen}
        onClose={closeNotifications}
      />

      <CopilotPanel
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        items={chartItems}
        overview={overview}
        filterSummary={copilotFilterSummary}
      />
    </div>
  );
}
