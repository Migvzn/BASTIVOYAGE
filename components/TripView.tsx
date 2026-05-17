"use client";

import { useState } from "react";
import type { BudgetMode, TripPlan, TripOption } from "@/lib/types";
import Budget from "./Budget";
import Itinerary from "./Itinerary";

interface Props {
  plan: TripPlan;
}

const MODE_LABELS: Record<BudgetMode, string> = {
  cheap: "Économique",
  balanced: "Équilibré",
  luxury: "Luxe",
};

const MODE_ICONS: Record<BudgetMode, string> = {
  cheap: "💰",
  balanced: "⚖️",
  luxury: "✨",
};

export default function TripView({ plan }: Props) {
  const [mode, setMode] = useState<BudgetMode>("balanced");
  const currency = plan.currency ?? "EUR";
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  const selected: TripOption | undefined =
    plan.options.find((o) => o.type === mode) ?? plan.options[0];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {plan.origin ? `Depuis ${plan.origin} · ` : ""}
              {plan.duration_days ? `${plan.duration_days} jours` : ""}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mt-1">
              {plan.destination}
            </h2>
            {plan.summary && (
              <p className="mt-3 text-stone-600 dark:text-stone-300 max-w-2xl">
                {plan.summary}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-500 dark:text-stone-400">
              Budget total
            </div>
            <div className="text-3xl font-bold text-brand-600">
              {fmt(plan.budget_total)}
            </div>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-3">
        {(["cheap", "balanced", "luxury"] as BudgetMode[]).map((m) => {
          const opt = plan.options.find((o) => o.type === m);
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`p-4 rounded-2xl border-2 transition text-left ${
                active
                  ? "border-brand-600 bg-brand-50 dark:bg-brand-900/20"
                  : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white/40 dark:bg-stone-900/40"
              }`}
            >
              <div className="text-2xl mb-1">{MODE_ICONS[m]}</div>
              <div className="font-semibold">{MODE_LABELS[m]}</div>
              <div className="text-sm text-stone-500 dark:text-stone-400">
                {opt ? fmt(opt.price) : "—"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected option */}
      {selected && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Transport */}
          <section className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">🚆 Transport</h3>
            <ul className="space-y-3">
              {selected.transport.map((t, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center p-3 rounded-lg bg-white/50 dark:bg-stone-800/40"
                >
                  <div>
                    <div className="font-medium capitalize">
                      {t.mode} · {t.from} → {t.to}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      {t.duration} {t.notes ? `· ${t.notes}` : ""}
                    </div>
                  </div>
                  <div className="font-semibold">{fmt(t.price)}</div>
                </li>
              ))}
            </ul>
          </section>

          {/* Hotels */}
          <section className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">🏨 Hébergement</h3>
            <ul className="space-y-3">
              {selected.hotels.map((h, i) => (
                <li
                  key={i}
                  className="flex justify-between items-start p-3 rounded-lg bg-white/50 dark:bg-stone-800/40"
                >
                  <div>
                    <div className="font-medium">
                      {h.name}
                      {h.rating ? (
                        <span className="ml-2 text-amber-500">
                          {"★".repeat(h.rating)}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      {h.city} · {h.nights} nuit{h.nights > 1 ? "s" : ""} ·{" "}
                      {fmt(h.price_per_night)}/nuit
                    </div>
                  </div>
                  <div className="font-semibold whitespace-nowrap">
                    {fmt(h.price_per_night * h.nights)}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Activities */}
          <section className="glass rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">🎯 Activités</h3>
            <ul className="grid sm:grid-cols-2 gap-3">
              {selected.activities.map((a, i) => (
                <li
                  key={i}
                  className="p-3 rounded-lg bg-white/50 dark:bg-stone-800/40"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-medium">{a.name}</div>
                    <div className="font-semibold whitespace-nowrap">
                      {a.price === 0 ? "Gratuit" : fmt(a.price)}
                    </div>
                  </div>
                  {a.description && (
                    <div className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                      {a.description}
                    </div>
                  )}
                  {a.duration && (
                    <div className="text-xs text-stone-500 mt-1">
                      ⏱ {a.duration}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <Budget
        breakdown={plan.budget_breakdown}
        total={plan.budget_total}
        currency={currency}
      />

      <Itinerary days={plan.itinerary} />

      {plan.tips?.length > 0 && (
        <section className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">💡 Conseils pratiques</h3>
          <ul className="space-y-2">
            {plan.tips.map((t, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-brand-600 font-bold">→</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
