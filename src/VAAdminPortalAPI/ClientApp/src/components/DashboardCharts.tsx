import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
  tokens,
} from '@fluentui/react-components';
import type { AiVirtualAssistantRegistration } from '../api/types';
import { registrationsByMonth } from './status';

const useStyles = makeStyles({
  card: {
    padding: '16px',
    height: '360px',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  },
  chartArea: {
    flex: 1,
    minHeight: 0,
    color: tokens.colorNeutralForeground1,
  },
});

export default function DashboardCharts({
  items,
}: {
  items: AiVirtualAssistantRegistration[];
}) {
  const styles = useStyles();

  const monthly = registrationsByMonth(items);

  return (
    <Card className={styles.card}>
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
  );
}
