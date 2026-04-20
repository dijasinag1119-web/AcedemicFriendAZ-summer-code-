'use client';
// components/charts/AttendanceBarChart.tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface DataPoint {
  subject: string;
  percent: number;
}

const getBarColor = (v: number) => v >= 75 ? '#10b981' : v >= 65 ? '#f59e0b' : '#f43f5e';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const v = payload[0].value;
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '10px 14px',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
        <p style={{ fontSize: '15px', fontWeight: 700, color: getBarColor(v) }}>{v}%</p>
      </div>
    );
  }
  return null;
};

export default function AttendanceBarChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={36}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={getBarColor(d.percent)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
