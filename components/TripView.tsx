"use client";

import { useState } from "react";
import Link from "next/link";
import type { BudgetMode, TripPlan, TripOption } from "@/lib/types";
import Budget from "./Budget";
import Itinerary from "./Itinerary";
import FlightList from "./FlightList";
import HotelList from "./HotelList";
import PriceComparison from "./PriceComparison";
import MapView from "./MapView";

interface Props {
  plan: TripPlan;
  airbnbSearchLink?: string;
  hotelsSource?: string;
  flightsSource?: string;
  showMap?: boolean;
}

const MODE_LABELS: Record<BudgetMode, string> = {
  cheap: "Économique",
  balanced: "Équilibré",
  luxury: "Luxe",
};

export default function TripView({
  plan,
  airbnbSearchLink,
  hotelsSource,
  flightsSource,
  showMap = true,
}: Props) {
  const [mode, setMode] = useState<BudgetMode>("balanced");
  const currency = plan.currency ?? "EUR";
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  const selected: TripOption | undefined =
    plan.options.find((o) => o.type === mode) ?? plan.options[0];

  const topFlights = plan.flights ?? [];
  const topHotels = plan.hotels ?? [];
  const topTransport = plan.transport ?? selected?.transport ?? [];

  const flightsForMode = topFlights.length
    ? topFlights.slice(0, mode === "cheap" ? 5 : mode === "luxury" ? 5 : 8)
    : selected?.flights ?? [];

  const hotelsForMode = topHotels.length
    ? filterByTier(topHotels, mode)
    : selected?.hotels ?? [];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {plan.origin ? `Depuis ${plan.origin} · ` : ""}
              {plan.duration_days ? `${plan.duration_days} jours` : ""}
              {plan.travelers ? ` · ${plan.travelers} voyageur${plan.travelers > 1 ? "s" : ""}` : ""}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mt-1">{plan.destination}</h2>
            {plan.summary && (
              <p className="mt-3 text-stone-600 dark:text-stone-300 max-w-2xl">{plan.summary}</p>
            )}
            {plan.enrichment && (
              <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
                {Object.entries(plan.enrichment).map(([k, v]) => (
                  <span
                    key={k}
                    className={`px-2 py-0.5 rounded-full ${
                      v && v !== "mock"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                    }`}
                  >
                    {k}: {v}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-500 dark:text-stone-400">Budget total ({MODE_LABELS[mode]})</div>
            <div className="text-3xl font-bold text-brand-600">
              {fmt(selected?.total_price ?? selected?.price ?? plan.budget_total)}
            </div>
          </div>
        </div>
      </div>

      {/* Price comparison */}
      <PriceComparison plan={plan} selected={mode} onSelect={setMode} />

      {/* Flights */}
      {flightsForMode.length > 0 && (
        <section className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">✈️ Vols recommandés</h3>
            <Link
              href="/results"
              className="text-xs text-brand-600 hover:underline font-semibold"
            >
              Voir tout →
            </Link>
          </div>
          <FlightList flights={flightsForMode} currency={currency} source={flightsSource} />
        </section>
      )}

      {/* Hotels */}
      {hotelsForMode.length > 0 && (
        <section className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">🏠 Hébergements</h3>
            <Link
              href="/results"
              className="text-xs text-brand-600 hover:underline font-semibold"
            >
              Voir tout →
            </Link>
          </div>
          <HotelList
            hotels={hotelsForMode}
            airbnbSearchLink={airbnbSearchLink}
            currency={currency}
            source={hotelsSource}
          />
        </section>
      )}

      {/* Transport multi-modal */}
      {topTransport.length > 0 && (
        <section className="glass rounded-2xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">🚆 Comparateur transport</h3>
          <ul className="space-y-2">
            {topTransport.map((t, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-stone-800/40"
              >
                <div className="text-xl flex-shrink-0">{transportEmoji(t.mode)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium capitalize">
                    {t.mode} · {t.from} → {t.to}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {t.duration}
                    {t.carrier ? ` · ${t.carrier}` : ""}
                    {t.notes ? ` · ${t.notes}` : ""}
                  </div>
                </div>
                <div className="font-semibold">{t.price > 0 ? fmt(t.price) : "Variable"}</div>
                {(t.booking_link || t.fallback_link) && (
                  <a
                    href={t.affiliate_url ?? t.booking_link ?? t.fallback_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-stone-800 dark:bg-stone-100 dark:text-stone-900 text-white text-xs font-semibold transition hover:opacity-80 whitespace-nowrap"
                  >
                    Réserver →
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Activities for selected mode */}
      {selected && selected.activities.length > 0 && (
        <section className="glass rounded-2xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 Activités · {MODE_LABELS[mode]}</h3>
          <ul className="grid sm:grid-cols-2 gap-3">
            {selected.activities.map((a, i) => (
              <li
                key={i}
                className="p-3 rounded-lg bg-white/50 dark:bg-stone-800/40 flex flex-col"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="font-medium">{a.name}</div>
                  <div className="font-semibold whitespace-nowrap">
                    {a.price === 0 ? "Gratuit" : fmt(a.price)}
                  </div>
                </div>
                {a.description && (
                  <div className="text-xs text-stone-600 dark:text-stone-400 mt-1">{a.description}</div>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                  {a.duration && <span>⏱ {a.duration}</span>}
                  {a.rating != null && <span>★ {a.rating}</span>}
                </div>
                {(a.booking_link || a.fallback_link) && (
                  <a
                    href={a.affiliate_url ?? a.booking_link ?? a.fallback_link}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="mt-2 text-xs text-brand-600 hover:underline self-start"
                  >
                    Réserver / Infos →
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Budget breakdown={plan.budget_breakdown} total={plan.budget_total} currency={currency} />

      {showMap && (
        <section className="glass rounded-2xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">📍 Carte</h3>
          <MapView
            query={plan.destination}
            lat={plan.destination_lat}
            lng={plan.destination_lng}
            height={360}
          />
        </section>
      )}

      <Itinerary days={plan.itinerary} />

      {plan.tips?.length > 0 && (
        <section className="glass rounded-2xl p-5 sm:p-6">
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

function transportEmoji(mode: string): string {
  const m = mode.toLowerCase();
  if (m.includes("train")) return "🚆";
  if (m.includes("bus")) return "🚌";
  if (m.includes("flight") || m.includes("vol") || m.includes("avion")) return "✈️";
  if (m.includes("ferry") || m.includes("bateau")) return "⛴️";
  if (m.includes("car")) return "🚗";
  return "🧭";
}

function filterByTier(hotels: any[], tier: BudgetMode): any[] {
  const sorted = [...hotels].sort((a, b) => (a.price_per_night || 0) - (b.price_per_night || 0));
  if (tier === "cheap") return sorted.slice(0, Math.ceil(sorted.length / 3));
  if (tier === "luxury") return sorted.slice(-Math.ceil(sorted.length / 3)).reverse();
  const mid = Math.floor(sorted.length / 3);
  return sorted.slice(mid, mid * 2 + (sorted.length % 3));
}
