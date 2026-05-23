'use client';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, eachDayOfInterval } from 'date-fns';

export type BurndownPoint = {
  date: string;
  ideal: number;
  remaining: number | null;
};

export function buildBurndownData(args: {
  start: Date;
  end: Date;
  total: number;
  donePoints: number;
  today?: Date;
}): BurndownPoint[] {
  const { start, end, total, donePoints } = args;
  const today = args.today ?? new Date();
  const days = eachDayOfInterval({ start, end });
  const dayCount = days.length;
  // Ideal line decreases linearly to 0 on the last day
  return days.map((d, i) => {
    const ideal = Math.max(0, Math.round((total * (dayCount - 1 - i)) / (dayCount - 1)));
    let remaining: number | null = null;
    if (d <= today) {
      // For demo: distribute completed points along elapsed days with slight curve
      const elapsedRatio = i / Math.max(1, dayCount - 1);
      const burnedByNow = donePoints * Math.min(1, elapsedRatio + 0.2);
      remaining = Math.max(0, Math.round(total - burnedByNow));
    }
    return {
      date: format(d, 'dd MMM'),
      ideal,
      remaining,
    };
  });
}

export function BurndownChart({ data, height = 280 }: { data: BurndownPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="burndown-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4A843" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#D4A843" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 4" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#666"
          tick={{ fontSize: 10, fontFamily: 'DM Mono, ui-monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#2A2A2A' }}
          interval={'preserveStartEnd'}
        />
        <YAxis
          stroke="#666"
          tick={{ fontSize: 10, fontFamily: 'DM Mono, ui-monospace' }}
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
          labelStyle={{ color: '#D4A843', fontWeight: 700 }}
          itemStyle={{ color: '#FFFFFF' }}
        />
        <Line
          type="monotone"
          dataKey="ideal"
          stroke="#555"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          name="Ideal"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="remaining"
          stroke="#F0C866"
          strokeWidth={2.5}
          fill="url(#burndown-gold)"
          dot={{ r: 3, fill: '#F0C866', stroke: 'none' }}
          connectNulls={false}
          name="Remaining"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
