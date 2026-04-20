'use client';
// components/charts/StudyPieChart.tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '10px 14px',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{payload[0].name}</p>
        <p style={{ fontSize: '15px', fontWeight: 700, color: payload[0].payload.color }}>
          {payload[0].value} min
        </p>
      </div>
    );
  }
  return null;
};

export default function StudyPieChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data} cx="50%" cy="45%"
          innerRadius={60} outerRadius={90}
          paddingAngle={3} dataKey="value"
          strokeWidth={0}
        >
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle" iconSize={8}
          wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
