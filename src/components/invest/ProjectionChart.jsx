import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART } from "@/lib/theme";
import { formatRand, formatRandCompact } from "@/lib/format";

const LABELS = {
  value: "Projected",
  high: "If markets do well",
  low: "If markets disappoint",
};

export default function ProjectionChart({ points }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points || []} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={CHART.line} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: CHART.muted }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: CHART.muted }}
            tickLine={false}
            axisLine={false}
            width={54}
            tickFormatter={(value) => formatRandCompact(value)}
          />
          <Tooltip
            formatter={(value, name) => [formatRand(value), LABELS[name] || name]}
            labelStyle={{ fontSize: 11, color: CHART.ink }}
            contentStyle={{ borderRadius: 14, border: `1px solid ${CHART.line}`, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="high" stroke="none" fill={CHART.protea} fillOpacity={0.14} />
          <Area type="monotone" dataKey="low" stroke="none" fill="#FFFFFF" fillOpacity={1} />
          <Line type="monotone" dataKey="value" stroke={CHART.protea} strokeWidth={2.5} dot={false} animationDuration={700} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
