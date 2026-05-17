"use client";

import type { BudgetBreakdown } from "@/lib/types";

interface Props {
  breakdown: BudgetBreakdown;
  total: number;
  currency?: string;
}

const COLORS: Record<keyof BudgetBreakdown, string> = {
  transport: "bg-blue-500",
  hotel: "bg-purple-500",
  food: "bg-amber-500",
  activities: "bg-emerald-500",
};

const LABELS: Record<keyof BudgetBreakdown, string> = {
  transport: "Transport",
  hotel: "Hébergement",
  food: "Nourriture",
  activities: "Activités",
};

export default function Budget({ breakdown, total, currency = "EUR" }: Props) {
  const sum =
    breakdown.transport + breakdown.hotel + breakdown.food + breakdown.activities;
  const displayTotal = sum > 0 ? sum : total;
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold">Répartition du budget</h3>
        <span className="text-2xl font-bold text-brand-600">
          {fmt(displayTotal)}
        </span>
      </div>

      <div className="flex h-3 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800 mb-4">
        {(Object.keys(breakdown) as Array<keyof BudgetBreakdown>).map((k) => {
          const pct = displayTotal > 0 ? (breakdown[k] / displayTotal) * 100 : 0;
          return (
            <div
              key={k}
              className={COLORS[k]}
              style={{ width: `${pct}%` }}
              title={`${LABELS[k]}: ${fmt(breakdown[k])}`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(breakdown) as Array<keyof BudgetBreakdown>).map((k) => (
          <div key={k} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${COLORS[k]}`} />
            <div className="text-sm">
              <div className="text-stone-500 dark:text-stone-400">
                {LABELS[k]}
              </div>
              <div className="font-semibold">{fmt(breakdown[k])}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
