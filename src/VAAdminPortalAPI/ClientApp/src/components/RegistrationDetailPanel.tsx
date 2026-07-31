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
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowResetRegular,
  CheckmarkCircleFilled,
  CheckmarkRegular,
  DismissCircleRegular,
  DismissRegular,
} from '@fluentui/react-icons';
import { applyRegistrationAction } from '../api/client';
import type {
  AiVirtualAssistantRegistration,
  RegistrationAction,
} from '../api/types';
import { formatDate, statusBadgeColor } from './status';

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

function Row({ label, value }: { label: string; value?: string | null }) {
  const styles = useStyles();
  return (
    <div className={styles.row}>
      <Caption1 className={styles.label}>{label}</Caption1>
      <Body1>{value && value.length > 0 ? value : '—'}</Body1>
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
                <Badge appearance="outline">Verification: {registration.verification}</Badge>
              </div>
            </div>

            <div className={styles.section}>
              <Subtitle2 className={styles.sectionTitle}>Overview</Subtitle2>
              {/* <Row label="Registration ID" value={registration.id} />
              <Row label="App ID" value={registration.appId} />
              <Row label="Tenant ID" value={registration.tenantId} /> */}
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
              <Caption1 className={styles.label}>Registration decision</Caption1>
              <div className={styles.actionGroup}>
                <Button
                  appearance="primary"
                  icon={<CheckmarkRegular />}
                  disabled={fullyPassed}
                  onClick={() => openAction('ApproveRegistration')}
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
    </Drawer>
  );
}
