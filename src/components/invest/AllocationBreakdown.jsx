import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatPercent, formatRand } from "@/lib/format";

export default function AllocationBreakdown({ weights, expectedReturn }) {
  return (
    <div className="space-y-4">
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={weights}
              dataKey="weight"
              nameKey="name"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
              animationDuration={700}
            >
              {weights.map((item) => (
                <Cell key={item.key} fill={item.colour} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40">Expected</p>
            <p className="font-display text-lg font-bold text-ink">{formatPercent(expectedReturn)}</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40">a year</p>
          </div>
        </div>
      </div>

      <ul className="divide-y divide-line/60">
        {weights.map((item) => (
          <li key={item.key} className="flex items-center gap-3 py-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.colour }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium leading-tight text-ink">{item.name}</p>
              <p className="mt-0.5 text-[11px] text-ink/45">{item.detail}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="tnum text-[13px] font-semibold text-ink">{formatPercent(item.weight, 0)}</p>
              <p className="tnum text-[11px] text-ink/45">{formatRand(item.amount)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}