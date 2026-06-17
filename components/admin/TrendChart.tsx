'use client';
import {
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
} from 'recharts';
import { format } from 'date-fns';

export type TrendPoint = { date: string; value: number };

export function TrendChart({
  data,
  height = 80,
  color = '#1a73e8',
  yFormatter,
}: {
  data: TrendPoint[];
  height?: number;
  color?: string;
  yFormatter?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 6, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id={`sa-trend-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1A1A1A" strokeDasharray="3 4" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#555"
          tick={{ fontSize: 9, fontFamily: 'DM Mono, ui-monospace' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) => format(new Date(v), 'dd MMM')}
          minTickGap={36}
        />
        <YAxis
          stroke="#555"
          tick={{ fontSize: 9, fontFamily: 'DM Mono, ui-monospace' }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v: number) => (yFormatter ? yFormatter(v) : String(v))}
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
          labelFormatter={(v: string) => format(new Date(v), 'dd MMM')}
          formatter={(v: number) => [yFormatter ? yFormatter(v) : v, '']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#sa-trend-${color})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
