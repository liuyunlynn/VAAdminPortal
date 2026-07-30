import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Body1,
  Button,
  Card,
  Field,
  Input,
  Spinner,
  Title1,
  Title3,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  PersonRegular,
  LockClosedRegular,
  BotSparkleRegular,
} from '@fluentui/react-icons';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { clearError, signIn } from '../features/auth/authSlice';

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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error } = useAppSelector((s) => s.auth);

  const [userId, setUserId] = useState('admin-001');
  const [password, setPassword] = useState('');

  const loading = status === 'loading';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(signIn({ userId, password }));
    if (signIn.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

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

          {error && (
            <MessageBar intent="error" onClick={() => dispatch(clearError())}>
              <MessageBarBody>{error}</MessageBarBody>
            </MessageBar>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="User ID" required>
              <Input
                value={userId}
                onChange={(_, d) => setUserId(d.value)}
                contentBefore={<PersonRegular />}
                placeholder="Enter your user id"
                disabled={loading}
              />
            </Field>

            <Field label="Password" required>
              <Input
                type="password"
                value={password}
                onChange={(_, d) => setPassword(d.value)}
                contentBefore={<LockClosedRegular />}
                placeholder="Enter your password"
                disabled={loading}
              />
            </Field>

            <div className={styles.actions}>
              <Button
                appearance="primary"
                type="submit"
                size="large"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? <Spinner size="tiny" label="Signing in..." /> : 'Sign in'}
              </Button>
            </div>
          </form>

          <span className={styles.hint}>
            Demo build - use user id <strong>admin-001</strong> and any password.
          </span>
        </Card>
      </section>
    </div>
  );
}
