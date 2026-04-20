'use client';
// components/charts/SubjectRadarChart.tsx
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

interface DataPoint {
  subject: string;
  progress: number;
}

export default function SubjectRadarChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
        <Radar
          name="Progress"
          dataKey="progress"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', fontSize: '13px', color: 'var(--text)',
          }}
          formatter={(v: number) => [`${v}%`, 'Progress']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
