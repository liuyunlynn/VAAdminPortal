import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  fetchRegistrationCharts,
  fetchNotificationRegistrations,
  fetchRegistrations,
  invalidateRegistrationCharts,
  registrationUpdated,
  selectRegistration,
} from '../features/registrations/registrationsSlice';
import type {
  AiVirtualAssistantRegistration,
  AdminInfo,
  AllOverview,
  BotVerificationLevel,
  RegistrationQuery,
  ValidationStatus,
} from '../api/types';
import RegistrationTable from '../components/RegistrationTable';
import RegistrationDetailPanel from '../components/RegistrationDetailPanel';
import CopilotPanel from '../components/CopilotPanel';
import CopilotIcon from '../components/CopilotIcon';
import NotificationPanel, {
  countNewFailedRegistrations,
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
    display: 'none',
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
  overviewFiltersWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  overviewFilters: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    flexWrap: 'wrap',
  },
  overviewFilterHint: {
    fontSize: '12px',
    lineHeight: '16px',
    color: tokens.colorNeutralForeground3,
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

const REVIEW_RESULT_OPTIONS = ['All', 'Completed', 'Not Completed'] as const;
const VALIDATION_STATUS_OPTIONS: (ValidationStatus | 'All')[] = [
  'All', 'NotStarted', 'Pending', 'Passed', 'Failed',
];
const VERIFICATION_OPTIONS: (BotVerificationLevel | 'All')[] = [
  'All', 'Registered', 'Validated',
];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const NOTIFICATIONS_LAST_READ_KEY = 'va-admin-portal-notifications-last-read';

const dropdownWidth = (labels: string[]) => `${Math.max(...labels.map((label) => label.length)) + 6}ch`;
const REVIEW_RESULT_DROPDOWN_WIDTH = '180px';
const VALIDATION_STATUS_DROPDOWN_WIDTH = dropdownWidth(['Validation status', ...VALIDATION_STATUS_OPTIONS]);
const VERIFICATION_DROPDOWN_WIDTH = dropdownWidth(['BotValidationLevel', ...VERIFICATION_OPTIONS]);
const PAGE_SIZE_DROPDOWN_WIDTH = dropdownWidth(PAGE_SIZE_OPTIONS.map(String));

export default function DashboardPage({ admin }: { admin: AdminInfo }) {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const {
    items, chartItems, notificationItems, totalCount, status, error, selectedId,
    pageIndex: loadedPageIndex, pageSize: loadedPageSize,
    chartStatus, chartError, chartRequestId, notificationStatus, notificationError,
  } = useAppSelector(
    (s) => s.registrations,
  );

  const [search, setSearch] = useState('');
  const [reviewResult, setReviewResult] = useState<(typeof REVIEW_RESULT_OPTIONS)[number]>('All');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus | 'All'>('All');
  const [verification, setVerification] = useState<BotVerificationLevel | 'All'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [submittedPageSize, setSubmittedPageSize] = useState(10);
  const [submittedQuery, setSubmittedQuery] = useState<RegistrationQuery>({});
  const [overview, setOverview] = useState<AllOverview | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [overviewStartDate, setOverviewStartDate] = useState('');
  const [overviewEndDate, setOverviewEndDate] = useState('');
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectionSource, setSelectionSource] = useState<'table' | 'notification'>('table');
  const [notificationsLastReadAt, setNotificationsLastReadAt] = useState<string | null>(() =>
    localStorage.getItem(NOTIFICATIONS_LAST_READ_KEY),
  );
  const tableRequest = useRef<{ abort: () => void } | null>(null);
  const submittedTableQuery = useRef<RegistrationQuery>({ pageIndex: 0, pageSize: 10 });
  const notificationRequest = useRef<{ abort: () => void } | null>(null);
  const chartRequest = useRef<{ abort: () => void } | null>(null);
  const overviewRequest = useRef<AbortController | null>(null);
  const submittedOverviewDates = useRef<{ start?: string | null; end?: string | null }>({});
  const mounted = useRef(false);
  const copilotOpenRef = useRef(copilotOpen);
  copilotOpenRef.current = copilotOpen;

  const loadTable = useCallback((query: RegistrationQuery) => {
    tableRequest.current?.abort();
    submittedTableQuery.current = { ...query };
    tableRequest.current = dispatch(fetchRegistrations(query));
  }, [dispatch]);

  const loadNotifications = useCallback(() => {
    notificationRequest.current?.abort();
    notificationRequest.current = dispatch(fetchNotificationRegistrations());
  }, [dispatch]);

  const loadOverview = useCallback(() => {
    overviewRequest.current?.abort();
    const controller = new AbortController();
    overviewRequest.current = controller;
    setOverviewError(null);
    setOverviewLoading(true);
    const { start, end } = submittedOverviewDates.current;
    getAllOverview(start, end, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setOverview(result);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setOverviewError(
            requestError instanceof Error ? requestError.message : 'Failed to load overview.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setOverviewLoading(false);
      });
  }, []);

  useEffect(() => {
    mounted.current = true;
    loadTable({ pageIndex: 0, pageSize: 10 });
    loadNotifications();
    loadOverview();
    return () => {
      mounted.current = false;
      tableRequest.current?.abort();
      notificationRequest.current?.abort();
      chartRequest.current?.abort();
      overviewRequest.current?.abort();
    };
  }, [loadTable, loadNotifications, loadOverview]);

  const loadAnalysis = () => {
    chartRequest.current?.abort();
    chartRequest.current = dispatch(fetchRegistrationCharts({ ...submittedTableQuery.current }));
  };

  const invalidateAnalysis = () => {
    chartRequest.current?.abort();
    dispatch(invalidateRegistrationCharts());
  };

  const selected = useMemo(
    () =>
      (selectionSource === 'notification' ? notificationItems : items)
        .find((item) => item.id === selectedId) ??
      null,
    [notificationItems, items, selectedId, selectionSource],
  );

  const newFailedNotificationCount = useMemo(
    () => countNewFailedRegistrations(notificationItems, notificationsLastReadAt),
    [notificationItems, notificationsLastReadAt],
  );

  const reviewCounts = useMemo(
    () => ({
      validation: {
        Passed: overview?.validationPassedCount ?? 0,
        Pending: overview?.validationPendingCount ?? 0,
        NotStarted: overview?.validationNotStartedCount ?? 0,
        Failed: overview?.validationFailedCount ?? 0,
      },
    }),
    [overview],
  );

  const copilotFilterSummary = useMemo(() => {
    const parts: string[] = [];
    if (submittedQuery.startDate || submittedQuery.endDate) {
      parts.push(`date ${submittedQuery.startDate?.slice(0, 10) ?? 'any'} to ${submittedQuery.endDate?.slice(0, 10) ?? 'any'}`);
    }
    if (submittedQuery.fullyPassed != null) {
      parts.push(submittedQuery.fullyPassed ? 'completed only' : 'not completed only');
    }
    if (submittedQuery.validationStatus) {
      parts.push(`Validation status ${submittedQuery.validationStatus}`);
    }
    if (submittedQuery.verification) {
      parts.push(`BotValidationLevel ${submittedQuery.verification}`);
    }
    if (submittedQuery.searchTerm) parts.push(`search "${submittedQuery.searchTerm}"`);
    return parts.length > 0 ? `filters: ${parts.join(', ')}` : 'no filters applied';
  }, [submittedQuery]);

  const createQuery = (): RegistrationQuery => ({
    startDate: startDate ? `${startDate}T00:00:00.000Z` : null,
    endDate: endDate ? `${endDate}T23:59:59.999Z` : null,
    searchTerm: search.trim() || null,
    validationStatus: validationStatus === 'All' ? null : validationStatus,
    verification: verification === 'All' ? null : verification,
    fullyPassed:
      reviewResult === 'All' ? null : reviewResult === 'Completed',
  });

  const handleQuery = () => {
    const query = createQuery();
    setSubmittedQuery(query);
    setSubmittedPageSize(pageSize);
    loadTable({ ...query, pageIndex: 0, pageSize });
    invalidateAnalysis();
  };

  const handleOverviewQuery = () => {
    const overviewStart = overviewStartDate ? `${overviewStartDate}T00:00:00.000Z` : null;
    const overviewEnd = overviewEndDate ? `${overviewEndDate}T23:59:59.999Z` : null;

    submittedOverviewDates.current = { start: overviewStart, end: overviewEnd };
    loadOverview();
  };

  const handlePageChange = (nextPageIndex: number) => {
    loadTable({
      ...submittedQuery,
      pageIndex: nextPageIndex,
      pageSize: submittedPageSize,
    });
  };

  const handleActionComplete = (updated: AiVirtualAssistantRegistration) => {
    if (!mounted.current) return;
    dispatch(registrationUpdated(updated));
    // Actions can finish after another query/page has been submitted.
    loadTable(submittedTableQuery.current);
    loadNotifications();
    loadOverview();
    if (copilotOpenRef.current) loadAnalysis();
    else invalidateAnalysis();
  };

  const handleSignOut = () => {
    window.location.assign('/auth/logout');
  };

  const closeNotifications = () => {
    const readAt = new Date().toISOString();
    localStorage.setItem(NOTIFICATIONS_LAST_READ_KEY, readAt);
    setNotificationsLastReadAt(readAt);
    setNotificationsOpen(false);
  };

  const handleFailedNotificationSelect = (id: string) => {
    closeNotifications();
    setSelectionSource('notification');
    dispatch(selectRegistration(id));
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <BotSparkleRegular fontSize={24} color="#ffffff" />
          Teams Bot Identification Program Admin Portal
        </div>
        <div className={styles.userBox}>
          <Tooltip
            content={`${newFailedNotificationCount} new failed ${newFailedNotificationCount === 1 ? 'bot' : 'bots'}`}
            relationship="label"
          >
            <Button
              className={styles.notificationButton}
              appearance="subtle"
              icon={<AlertRegular />}
              aria-label="Open failed bot notifications"
              onClick={() => setNotificationsOpen(true)}
            >
              {newFailedNotificationCount > 0 && (
                <CounterBadge
                  className={styles.notificationBadge}
                  size="small"
                  color="danger"
                  count={newFailedNotificationCount}
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
        {(error || overviewError || notificationError) && (
          <MessageBar intent="error">
            <MessageBarBody>
              {[error, overviewError, notificationError && `Notifications: ${notificationError}`]
                .filter(Boolean).join(' ')}
            </MessageBarBody>
          </MessageBar>
        )}

        <div className={styles.overviewHeader}>
          <div>
            <Subtitle1>Overview</Subtitle1>
          </div>
          <div className={styles.overviewFiltersWrap}>
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
            <Caption1 className={styles.overviewFilterHint}>
              Leave both dates empty to show all-time data.
            </Caption1>
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
            <Caption1 className={styles.kpiHint}>Validation passed and agreement accepted</Caption1>
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
        </div>

        <Card className={styles.tableCard}>
          <Toolbar className={styles.filterToolbar}>
            <div className={styles.filters}>
              <Field label="Overall Status">
                <Dropdown
                  style={{
                    width: REVIEW_RESULT_DROPDOWN_WIDTH,
                    minWidth: REVIEW_RESULT_DROPDOWN_WIDTH,
                  }}
                  value={reviewResult}
                  selectedOptions={[reviewResult]}
                  onOptionSelect={(_, d) =>
                    setReviewResult(
                      REVIEW_RESULT_OPTIONS.find((option) => option === d.optionValue) ?? 'All',
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
                    width: VALIDATION_STATUS_DROPDOWN_WIDTH,
                    minWidth: VALIDATION_STATUS_DROPDOWN_WIDTH,
                  }}
                  value={validationStatus}
                  selectedOptions={[validationStatus]}
                  onOptionSelect={(_, d) =>
                    setValidationStatus(
                      VALIDATION_STATUS_OPTIONS.find((option) => option === d.optionValue) ?? 'All',
                    )
                  }
                >
                  {VALIDATION_STATUS_OPTIONS.map((option) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="BotValidationLevel">
                <Dropdown
                  style={{
                    width: VERIFICATION_DROPDOWN_WIDTH,
                    minWidth: VERIFICATION_DROPDOWN_WIDTH,
                  }}
                  value={verification}
                  selectedOptions={[verification]}
                  onOptionSelect={(_, d) =>
                    setVerification(
                      VERIFICATION_OPTIONS.find((option) => option === d.optionValue) ?? 'All',
                    )
                  }
                >
                  {VERIFICATION_OPTIONS.map((option) => (
                    <Option key={option} value={option}>
                      {option}
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
          ) : status === 'failed' ? (
            <div className={styles.loading}>Registrations could not be loaded. Run Query to retry.</div>
          ) : (
            <RegistrationTable
              items={items}
              pageIndex={loadedPageIndex}
              pageSize={loadedPageSize}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onSelect={(id) => {
                setSelectionSource('table');
                dispatch(selectRegistration(id));
              }}
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
          onClick={() => {
            setCopilotOpen(true);
            loadAnalysis();
          }}
        />
      </Tooltip>

      <RegistrationDetailPanel
        registration={selected}
        open={selected != null}
        onClose={() => dispatch(selectRegistration(null))}
        onActionComplete={handleActionComplete}
      />

      <NotificationPanel
        items={notificationItems}
        open={notificationsOpen}
        onClose={closeNotifications}
        onSelect={handleFailedNotificationSelect}
        status={notificationStatus}
        error={notificationError}
        onRefresh={loadNotifications}
      />

      {copilotOpen && (
        <CopilotPanel
          key={chartRequestId ?? 'idle'}
          open={copilotOpen}
          onClose={() => {
            setCopilotOpen(false);
            invalidateAnalysis();
          }}
          items={chartItems}
          overview={overview}
          filterSummary={copilotFilterSummary}
          dataStatus={chartStatus}
          dataError={chartError}
          onReload={loadAnalysis}
        />
      )}
    </div>
  );
}
