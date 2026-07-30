import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardHeader,
  Subtitle2,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';
import type { AiVirtualAssistantRegistration } from '../api/types';
import {
  STATUS_COLORS,
  countBy,
  registrationsByMonth,
  verificationBreakdown,
} from './status';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '16px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    padding: '16px',
    height: '320px',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  },
  monthlyCard: {
    gridColumn: '1 / -1',
    height: '360px',
  },
  chartArea: {
    flex: 1,
    minHeight: 0,
    color: tokens.colorNeutralForeground1,
  },
});

const PIE_COLORS = ['#8a8886', '#5b5fc7', '#237b4b'];

export default function DashboardCharts({
  items,
}: {
  items: AiVirtualAssistantRegistration[];
}) {
  const styles = useStyles();

  const monthly = registrationsByMonth(items);
  const validation = countBy(items, 'validationStatus');
  const legal = countBy(items, 'legalStatus');
  const verification = verificationBreakdown(items);

  return (
    <div className={styles.grid}>
      <Card className={mergeClasses(styles.card, styles.monthlyCard)}>
        <CardHeader header={<Subtitle2>Monthly registrations and fully passed</Subtitle2>} />
        <div className={styles.chartArea}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="registrations"
                name="Registrations"
                stroke="#5b5fc7"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="fullyVerified"
                name="Fully passed"
                stroke="#237b4b"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className={styles.card}>
        <CardHeader header={<Subtitle2>Validation status</Subtitle2>} />
        <div className={styles.chartArea}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={validation} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="status" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                {validation.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className={styles.card}>
        <CardHeader header={<Subtitle2>Legal status</Subtitle2>} />
        <div className={styles.chartArea}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={legal} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="status" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                {legal.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className={styles.card}>
        <CardHeader header={<Subtitle2>Verification level</Subtitle2>} />
        <div className={styles.chartArea}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={verification}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {verification.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
