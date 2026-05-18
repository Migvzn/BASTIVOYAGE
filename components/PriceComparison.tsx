"use client";

import type { BudgetMode, TripOption, TripPlan } from "@/lib/types";

interface Props {
  plan: TripPlan;
  selected: BudgetMode;
  onSelect: (mode: BudgetMode) => void;
}

const ROWS: { key: BudgetMode; label: string; icon: string; tagline: string }[] = [
  { key: "cheap", label: "Économique", icon: "💰", tagline: "Minimiser le coût" },
  { key: "balanced", label: "Équilibré", icon: "⚖️", tagline: "Meilleur rapport qualité-prix" },
  { key: "luxury", label: "Premium", icon: "✨", tagline: "Confort et expériences" },
];

export default function PriceComparison({ plan, selected, onSelect }: Props) {
  const currency = plan.currency ?? "EUR";
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  const byMode: Record<BudgetMode, TripOption | undefined> = {
    cheap: plan.options.find((o) => o.type === "cheap"),
    balanced: plan.options.find((o) => o.type === "balanced"),
    luxury: plan.options.find((o) => o.type === "luxury"),
  };

  return (
    <section className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold">💸 Comparateur intelligent</h3>
        <div className="text-xs text-stone-500">Budget cible : {fmt(plan.budget_total)}</div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {ROWS.map((r) => {
          const opt = byMode[r.key];
          const active = selected === r.key;
          const total = opt?.total_price ?? opt?.price ?? 0;
          const transportCost = (opt?.transport ?? []).reduce((s, t) => s + (t.price || 0), 0);
          const hotelCost = (opt?.hotels ?? []).reduce(
            (s, h) => s + (h.price_per_night || 0) * (h.nights || 0),
            0,
          );
          const activitiesCost = (opt?.activities ?? []).reduce((s, a) => s + (a.price || 0), 0);

          return (
            <button
              key={r.key}
              onClick={() => onSelect(r.key)}
              className={`text-left p-4 rounded-xl border-2 transition ${
                active
                  ? "border-brand-600 bg-brand-50 dark:bg-brand-900/20 shadow-lg shadow-brand-500/10"
                  : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white/40 dark:bg-stone-900/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl">{r.icon}</div>
                  <div className="font-semibold mt-1">{r.label}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">{r.tagline}</div>
                </div>
                {active && (
                  <span className="text-xs font-semibold text-brand-600 bg-brand-100 dark:bg-brand-900/40 px-2 py-1 rounded-full">
                    Sélectionné
                  </span>
                )}
              </div>
              <div className="mt-3 text-2xl font-bold text-brand-600">{fmt(total)}</div>
              <ul className="mt-2 space-y-0.5 text-[11px] text-stone-500 dark:text-stone-400">
                <li>Transport : {fmt(transportCost)}</li>
                <li>Hôtels : {fmt(hotelCost)}</li>
                <li>Activités : {fmt(activitiesCost)}</li>
              </ul>
            </button>
          );
        })}
      </div>
    </section>
  );
}
