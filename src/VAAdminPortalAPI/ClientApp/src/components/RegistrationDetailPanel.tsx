import {
  Badge,
  Body1,
  Button,
  Caption1,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Link,
  Subtitle2,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { CheckmarkCircleFilled, DismissRegular } from '@fluentui/react-icons';
import type { AiVirtualAssistantRegistration } from '../api/types';
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
});

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
}: {
  registration: AiVirtualAssistantRegistration | null;
  open: boolean;
  onClose: () => void;
}) {
  const styles = useStyles();
  const fullyPassed =
    registration?.validationStatus === 'Passed' && registration.legalStatus === 'Passed';

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
          {registration?.displayName ?? 'Registration details'}
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
          </div>
        )}
      </DrawerBody>
    </Drawer>
  );
}
