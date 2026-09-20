import { useState } from 'react';
import {
  Avatar,
  Badge,
  Body1,
  Button,
  Caption1,
  Divider,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Link,
  MessageBar,
  MessageBarBody,
  Subtitle2,
  Textarea,
  Field,
  Tooltip,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowResetRegular,
  CheckmarkCircleFilled,
  CheckmarkRegular,
  CopyRegular,
  DismissCircleRegular,
  DismissRegular,
  LightbulbRegular,
} from '@fluentui/react-icons';
import { applyRegistrationAction } from '../api/client';
import type {
  AiVirtualAssistantRegistration,
  RegistrationAction,
} from '../api/types';
import CopilotIcon from './CopilotIcon';
import { formatDate, statusBadgeColor } from './status';

type FailedReview = 'validation' | 'legal';

const useStyles = makeStyles({
  drawer: {
    borderLeft: '1px solid #e0e0e0',
    boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.12)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  drawerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
  },
  drawerTitleText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sectionTitle: {
    marginBottom: '4px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr',
    gap: '12px',
    alignItems: 'start',
  },
  label: {
    color: tokens.colorNeutralForeground3,
  },
  copyableValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    minWidth: 0,
  },
  badges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  fullyPassed: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    marginBottom: '16px',
    color: tokens.colorPaletteGreenForeground1,
    backgroundColor: tokens.colorPaletteGreenBackground1,
    border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  fullyPassedIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  fullyPassedText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  failureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  failureCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px 14px',
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderLeft: `3px solid ${tokens.colorPaletteRedBorder2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  failureHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
  failureReason: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  guidanceIntro: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    marginBottom: '14px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  guidanceIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '22px',
    flexShrink: 0,
  },
  guidanceList: {
    margin: 0,
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '18px 0 24px',
  },
  actionGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  rejectButton: {
    color: tokens.colorPaletteRedForeground1,
    border: '1px solid #d13438',
  },
  dialogReason: {
    minHeight: '96px',
  },
});

const ACTIONS: Record<
  RegistrationAction,
  { title: string; description: string; confirmLabel: string; intent: 'approve' | 'reject' | 'reset' }
> = {
  ApproveRegistration: {
    title: 'Approve registration',
    description: 'This will approve both validation and legal review.',
    confirmLabel: 'Approve registration',
    intent: 'approve',
  },
  RejectRegistration: {
    title: 'Reject registration',
    description: 'This will reject both validation and legal review.',
    confirmLabel: 'Reject registration',
    intent: 'reject',
  },
  ApproveValidation: {
    title: 'Approve validation',
    description: 'The validation status will be set to Passed.',
    confirmLabel: 'Approve validation',
    intent: 'approve',
  },
  ResetValidation: {
    title: 'Request re-validation',
    description: 'The validation status will be reset so the user can validate again.',
    confirmLabel: 'Request re-validation',
    intent: 'reset',
  },
  ApproveLegal: {
    title: 'Approve legal review',
    description: 'The legal status will be set to Passed.',
    confirmLabel: 'Approve legal review',
    intent: 'approve',
  },
  ResetLegal: {
    title: 'Request legal resubmission',
    description: 'The legal status will be reset so the user can resubmit legal validation.',
    confirmLabel: 'Request resubmission',
    intent: 'reset',
  },
};

function Row({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value?: string | null;
  copyable?: boolean;
}) {
  const styles = useStyles();
  const displayValue = value && value.length > 0 ? value : null;

  return (
    <div className={styles.row}>
      <Caption1 className={styles.label}>{label}</Caption1>
      <div className={styles.copyableValue}>
        <Body1>{displayValue ?? '—'}</Body1>
        {copyable && displayValue && (
          <Tooltip content={`Copy ${label}`} relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<CopyRegular />}
              aria-label={`Copy ${label}`}
              onClick={() => navigator.clipboard.writeText(displayValue)}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function getCopilotGuidance(review: FailedReview, reason: string): string[] {
  const normalizedReason = reason.toLowerCase();
  const guidance = review === 'validation'
    ? [
        'Confirm the app ID, tenant ID, and submitted domain match the source registration.',
        'Ask the technical contact to correct the failed item and provide evidence of a successful re-validation.',
        'Use Request re-validation after the updated details have been confirmed.',
      ]
    : [
        'Compare the submitted legal entity details with the supporting agreement and identifier.',
        'Ask the primary contact for corrected documentation or clarification of the failed item.',
        'Use Request legal resubmission after the replacement documents are available.',
      ];

  if (normalizedReason.includes('nda') || normalizedReason.includes('agreement')) {
    guidance.unshift('Verify that the NDA or agreement number is current and belongs to this legal entity.');
  } else if (normalizedReason.includes('domain') || normalizedReason.includes('tenant')) {
    guidance.unshift('Verify domain ownership and tenant association before requesting another validation.');
  } else if (normalizedReason.includes('contact') || normalizedReason.includes('email')) {
    guidance.unshift('Confirm the listed contact is reachable and authorized to respond for this registration.');
  }

  return guidance;
}

function FailureCard({
  review,
  reason,
  onAskCopilot,
}: {
  review: FailedReview;
  reason?: string | null;
  onAskCopilot: (review: FailedReview, reason: string) => void;
}) {
  const styles = useStyles();
  const reviewLabel = review === 'validation' ? 'Validation' : 'Legal review';
  const displayReason = reason?.trim() || 'No failure reason was provided.';

  return (
    <div className={styles.failureCard} role="status">
      <div className={styles.failureHeader}>
        <Subtitle2>{reviewLabel} failed</Subtitle2>
        <Button
          size="small"
          appearance="subtle"
          icon={<CopilotIcon fontSize={16} />}
          onClick={() => onAskCopilot(review, displayReason)}
        >
          Ask Copilot
        </Button>
      </div>
      <Caption1 className={styles.label}>Failure reason</Caption1>
      <Body1 className={styles.failureReason}>{displayReason}</Body1>
    </div>
  );
}

export default function RegistrationDetailPanel({
  registration,
  open,
  onClose,
  onActionComplete,
}: {
  registration: AiVirtualAssistantRegistration | null;
  open: boolean;
  onClose: () => void;
  onActionComplete: (registration: AiVirtualAssistantRegistration) => void;
}) {
  const styles = useStyles();
  const [pendingAction, setPendingAction] = useState<RegistrationAction | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copilotReview, setCopilotReview] = useState<{
    review: FailedReview;
    reason: string;
  } | null>(null);
  const fullyPassed =
    registration?.validationStatus === 'Passed' && registration.legalStatus === 'Passed';
  const actionDetails = pendingAction ? ACTIONS[pendingAction] : null;

  const openAction = (action: RegistrationAction) => {
    setPendingAction(action);
    setReason('');
    setActionError(null);
  };

  const closeAction = () => {
    if (submitting) return;
    setPendingAction(null);
    setReason('');
    setActionError(null);
  };

  const submitAction = async () => {
    if (!registration || !pendingAction || reason.trim().length === 0) return;

    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await applyRegistrationAction({
        registrationId: registration.id,
        action: pendingAction,
        reason: reason.trim(),
      });
      onActionComplete(updated);
      setPendingAction(null);
      setReason('');
    } catch (requestError) {
      setActionError(
        requestError instanceof Error ? requestError.message : 'The action could not be completed.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      className={styles.drawer}
      type="overlay"
      position="end"
      open={open}
      onOpenChange={(_, { open: isOpen }) => {
        if (!isOpen) onClose();
      }}
      size="medium"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<DismissRegular />}
              onClick={onClose}
            />
          }
        >
          {registration ? (
            <div className={styles.drawerTitle}>
              <Avatar
                name={registration.displayName}
                image={
                  registration.logoUrl?.trim() ? { src: registration.logoUrl.trim() } : undefined
                }
                size={40}
              />
              <span className={styles.drawerTitleText}>{registration.displayName}</span>
            </div>
          ) : (
            'Registration details'
          )}
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody>
        {registration && (
          <div style={{ paddingTop: '8px' }}>
            {fullyPassed && (
              <div className={styles.fullyPassed} role="status">
                <CheckmarkCircleFilled className={styles.fullyPassedIcon} />
                <div className={styles.fullyPassedText}>
                  <Subtitle2>Fully passed</Subtitle2>
                  <Caption1>Validation and legal reviews are complete.</Caption1>
                </div>
              </div>
            )}
            <div className={styles.section}>
              <div className={styles.badges}>
                <Badge appearance="filled" color={statusBadgeColor(registration.validationStatus)}>
                  Validation: {registration.validationStatus}
                </Badge>
                <Badge appearance="filled" color={statusBadgeColor(registration.legalStatus)}>
                  Legal: {registration.legalStatus}
                </Badge>
              </div>
              {(registration.validationStatus === 'Failed' || registration.legalStatus === 'Failed') && (
                <div className={styles.failureList}>
                  {registration.validationStatus === 'Failed' && (
                    <FailureCard
                      review="validation"
                      reason={registration.validationFailureReason}
                      onAskCopilot={(review, failureReason) =>
                        setCopilotReview({ review, reason: failureReason })
                      }
                    />
                  )}
                  {registration.legalStatus === 'Failed' && (
                    <FailureCard
                      review="legal"
                      reason={registration.legalFailureReason}
                      onAskCopilot={(review, failureReason) =>
                        setCopilotReview({ review, reason: failureReason })
                      }
                    />
                  )}
                </div>
              )}
            </div>

            <div className={styles.section}>
              <Subtitle2 className={styles.sectionTitle}>Overview</Subtitle2>
              <Row label="Registration ID" value={registration.id} copyable />
              <Row label="App ID" value={registration.appId} copyable />
              {/* <Row label="Tenant ID" value={registration.tenantId} /> */}
              <Row label="Domain" value={registration.domain} />
              <Row label="Created" value={formatDate(registration.createdDateTime)} />
              {registration.onboardingDocUrl && (
                <div className={styles.row}>
                  <Caption1 className={styles.label}>Onboarding doc</Caption1>
                  <Link href={registration.onboardingDocUrl} target="_blank">
                    Open document
                  </Link>
                </div>
              )}
            </div>

            <Divider />

            <div className={styles.section} style={{ marginTop: '16px' }}>
              <Subtitle2 className={styles.sectionTitle}>Legal entity</Subtitle2>
              <Row label="Entity type" value={registration.legalEntity.entityType} />
              <Row label="Business name" value={registration.legalEntity.businessName} />
              <Row label="Address" value={registration.legalEntity.addressLine1} />
              <Row label="Address 2" value={registration.legalEntity.addressLine2} />
              <Row label="City" value={registration.legalEntity.city} />
              <Row label="State/Province" value={registration.legalEntity.stateProvince} />
              <Row label="Country" value={registration.legalEntity.country} />
              <Row label="Zip code" value={registration.legalEntity.zipCode} />
              <Row label="Legal identifier" value={registration.legalEntity.legalIdentifier} />
              <Row label="NDA number" value={registration.legalEntity.nonDisclosureAgreementNumber} />
            </div>

            <Divider />

            <div className={styles.section} style={{ marginTop: '16px' }}>
              <Subtitle2 className={styles.sectionTitle}>Primary contact</Subtitle2>
              <Row label="Name" value={registration.primaryContact.name} />
              <Row label="Title" value={registration.primaryContact.title} />
              <Row label="Email" value={registration.primaryContact.email} />
              <Row label="Phone" value={registration.primaryContact.phone} />
            </div>

            <Divider />

            <div className={styles.section} style={{ marginTop: '16px' }}>
              <Subtitle2 className={styles.sectionTitle}>Technical contact</Subtitle2>
              <Row label="Name" value={registration.technicalContact.name} />
              <Row label="Email" value={registration.technicalContact.email} />
            </div>

            <div className={styles.section}>
              <Subtitle2 className={styles.sectionTitle}>Program manager</Subtitle2>
              <Row label="Name" value={registration.programManagerContact.name} />
              <Row label="Email" value={registration.programManagerContact.email} />
            </div>

            <Divider />

            <div className={styles.actions}>
              <Subtitle2>Administrative actions</Subtitle2>
              <Caption1 className={styles.label} style={{ display: 'none' }}>Registration decision</Caption1>
              <div className={styles.actionGroup}>
                <Button
                  appearance="primary"
                  icon={<CheckmarkRegular />}
                  disabled={fullyPassed}
                  onClick={() => openAction('ApproveRegistration')}
                  style={{ display: 'none' }}
                >
                  Approve registration
                </Button>
                <Button
                  className={styles.rejectButton}
                  icon={<DismissCircleRegular />}
                  disabled={
                    registration.validationStatus === 'Failed' && registration.legalStatus === 'Failed'
                  }
                  onClick={() => openAction('RejectRegistration')}
                  style={{ display: 'none' }}
                >
                  Reject registration
                </Button>
              </div>

              <Caption1 className={styles.label}>Validation review</Caption1>
              <div className={styles.actionGroup}>
                <Button
                  icon={<CheckmarkRegular />}
                  disabled={registration.validationStatus === 'Passed'}
                  onClick={() => openAction('ApproveValidation')}
                >
                  Approve validation
                </Button>
                <Button
                  icon={<ArrowResetRegular />}
                  disabled={registration.validationStatus === 'NotStarted'}
                  onClick={() => openAction('ResetValidation')}
                  style={{ display: 'none' }}
                >
                  Request re-validation
                </Button>
              </div>

              <Caption1 className={styles.label}>Legal review</Caption1>
              <div className={styles.actionGroup}>
                <Button
                  icon={<CheckmarkRegular />}
                  disabled={registration.legalStatus === 'Passed'}
                  onClick={() => openAction('ApproveLegal')}
                >
                  Approve legal
                </Button>
                <Button
                  icon={<ArrowResetRegular />}
                  disabled={registration.legalStatus === 'NotStarted'}
                  onClick={() => openAction('ResetLegal')}
                  style={{ display: 'none' }}
                >
                  Request legal resubmission
                </Button>
              </div>
            </div>
          </div>
        )}
      </DrawerBody>

      <Dialog open={pendingAction != null} onOpenChange={(_, data) => !data.open && closeAction()}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{actionDetails?.title}</DialogTitle>
            <DialogContent>
              <Body1>{actionDetails?.description}</Body1>
              {actionError && (
                <MessageBar intent="error" style={{ marginTop: '12px' }}>
                  <MessageBarBody>{actionError}</MessageBarBody>
                </MessageBar>
              )}
              <Field
                label="Reason"
                required
                validationMessage={reason.length > 0 && reason.trim().length === 0 ? 'Enter a reason.' : undefined}
                style={{ marginTop: '16px' }}
              >
                <Textarea
                  className={styles.dialogReason}
                  value={reason}
                  placeholder="Explain why this action is being taken"
                  resize="vertical"
                  disabled={submitting}
                  onChange={(_, data) => setReason(data.value)}
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" disabled={submitting} onClick={closeAction}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                disabled={submitting || reason.trim().length === 0}
                onClick={submitAction}
              >
                {submitting ? 'Applying...' : actionDetails?.confirmLabel}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={copilotReview != null}
        onOpenChange={(_, data) => !data.open && setCopilotReview(null)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              Copilot suggestions for {copilotReview?.review === 'validation' ? 'validation' : 'legal review'}
            </DialogTitle>
            <DialogContent>
              <div className={styles.guidanceIntro}>
                <LightbulbRegular className={styles.guidanceIcon} />
                <div>
                  <Caption1 className={styles.label}>Based on the failure reason</Caption1>
                  <Body1 className={styles.failureReason}>{copilotReview?.reason}</Body1>
                </div>
              </div>
              {copilotReview && (
                <ol className={styles.guidanceList}>
                  {getCopilotGuidance(copilotReview.review, copilotReview.reason).map((item) => (
                    <li key={item}>
                      <Body1>{item}</Body1>
                    </li>
                  ))}
                </ol>
              )}
              <Caption1 className={styles.label} style={{ display: 'block', marginTop: '16px' }}>
                Copilot suggestions are advisory. Review the evidence before changing a status.
              </Caption1>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={() => setCopilotReview(null)}>
                Done
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </Drawer>
  );
}
