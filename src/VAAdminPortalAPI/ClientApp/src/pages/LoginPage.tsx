import {
  Body1,
  Button,
  Card,
  Title1,
  Title3,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  BotSparkleRegular,
  PersonAccountsRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  hero: {
    flex: '1 1 52%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 'clamp(40px, 7vw, 96px)',
    color: '#ffffff',
    backgroundColor: '#5b5fc7',
    borderRight: '1px solid #4f52b2',
    '@media (max-width: 760px)': {
      display: 'none',
    },
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '32px',
  },
  heroList: {
    marginTop: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    fontSize: '16px',
    opacity: 0.92,
    maxWidth: '460px',
  },
  formSide: {
    flex: '1 1 45%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '8px',
  },
  actions: {
    marginTop: '8px',
  },
  hint: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
    textAlign: 'center',
  },
});

export default function LoginPage() {
  const styles = useStyles();
  const query = new URLSearchParams(window.location.search);
  const signInFailed = query.has('authError');
  const traceId = query.get('traceId');

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <BotSparkleRegular fontSize={28} />
          VA Admin Portal
        </div>
        <Title1 style={{ color: '#ffffff' }}>
          Manage your AI virtual assistant registrations
        </Title1>
        <div className={styles.heroList}>
          <span>• Monitor validation and legal review progress</span>
          <span>• Explore registrations with rich charts and tables</span>
          <span>• Drill into the full details of every submission</span>
        </div>
      </section>

      <section className={styles.formSide}>
        <Card className={styles.card}>
          <div className={styles.header}>
            <Title3>Welcome back</Title3>
            <Body1>Sign in to continue to the admin portal.</Body1>
          </div>

          {signInFailed && (
            <MessageBar intent="error">
              <MessageBarBody>
                Microsoft sign-in could not be completed.
                {traceId ? ` Reference: ${traceId}` : ''}
              </MessageBarBody>
            </MessageBar>
          )}

          <div className={styles.actions}>
            <Button
              appearance="primary"
              size="large"
              icon={<PersonAccountsRegular />}
              onClick={() => window.location.assign('/auth/login?returnUrl=/dashboard')}
              style={{ width: '100%' }}
            >
              Sign in with Microsoft
            </Button>
          </div>

          <span className={styles.hint}>
            Access is limited to Microsoft accounts authorized for this portal.
          </span>
        </Card>
      </section>
    </div>
  );
}
