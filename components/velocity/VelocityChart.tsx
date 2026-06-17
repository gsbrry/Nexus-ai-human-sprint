'use client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SprintVelocity } from '@/lib/mock/velocity';

export function VelocityChart({ data }: { data: SprintVelocity[] }) {
  // Recharts expects flat objects
  const rows = data.map((s) => ({
    name: `S${s.sprint_number}`,
    label: s.name,
    Committed: s.points_committed,
    Completed: s.points_completed,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 4" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#666"
          tick={{ fontSize: 11, fontFamily: 'DM Mono, ui-monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#2A2A2A' }}
        />
        <YAxis
          stroke="#666"
          tick={{ fontSize: 11, fontFamily: 'DM Mono, ui-monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#2A2A2A' }}
          width={32}
        />
        <Tooltip
          contentStyle={{
            background: '#1F1F1F',
            border: '1px solid #2A2A2A',
            borderRadius: 8,
            fontFamily: 'DM Mono, ui-monospace',
            fontSize: 11,
          }}
          labelStyle={{ color: '#1a73e8', fontWeight: 700 }}
          itemStyle={{ color: '#FFFFFF' }}
          cursor={{ fill: 'rgba(212, 168, 67, 0.08)' }}
        />
        <Legend
          wrapperStyle={{
            fontFamily: 'DM Mono, ui-monospace',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#AAA',
            paddingTop: 8,
          }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="Committed" fill="#2A2A2A" stroke="#3F3F3F" radius={[4, 4, 0, 0]} barSize={24} />
        <Bar dataKey="Completed" fill="#1a73e8" stroke="#4a90e8" radius={[4, 4, 0, 0]} barSize={24} />
        <Line
          type="monotone"
          dataKey="Completed"
          name="Trend"
          stroke="#4a90e8"
          strokeWidth={2}
          dot={{ r: 3, fill: '#4a90e8', stroke: 'none' }}
          activeDot={{ r: 5 }}
          legendType="none"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
