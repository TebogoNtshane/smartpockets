import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART } from "@/lib/theme";
import { formatRand } from "@/lib/format";

export default function ForecastChart({ daily }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={daily || []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.protea} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART.protea} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART.line} vertical={false} />
          <XAxis
            dataKey="label"
            interval="preserveStartEnd"
            tick={{ fontSize: 10, fill: CHART.muted }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: CHART.muted }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(value) => formatRand(value)}
          />
          <Tooltip
            formatter={(value) => [formatRand(value, { cents: true }), "Balance"]}
            labelStyle={{ fontSize: 11, color: CHART.ink }}
            contentStyle={{ borderRadius: 14, border: `1px solid ${CHART.line}`, fontSize: 12 }}
          />
          <ReferenceLine y={0} stroke={CHART.clay} strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="balance"
            stroke={CHART.protea}
            strokeWidth={2}
            fill="url(#forecastFill)"
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}