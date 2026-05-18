"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FlightList from "@/components/FlightList";
import HotelList from "@/components/HotelList";
import MapView from "@/components/MapView";
import type { Flight, Hotel, TripPlan } from "@/lib/types";

const STORAGE_KEY = "bastivoyage:lastPlan";

interface StoredPlan {
  plan: TripPlan;
  prompt?: string;
  airbnb_search_link?: string;
  sources?: Record<string, string>;
  savedAt?: number;
}

type Tab = "flights" | "hotels" | "all";

export default function ResultsPage() {
  const [data, setData] = useState<StoredPlan | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [maxFlightPrice, setMaxFlightPrice] = useState<number>(0);
  const [maxStops, setMaxStops] = useState<number>(2);
  const [minHotelRating, setMinHotelRating] = useState<number>(0);
  const [maxHotelPrice, setMaxHotelPrice] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.plan) {
          setData(parsed);
          const flights = (parsed.plan.flights ?? []) as Flight[];
          const hotels = (parsed.plan.hotels ?? []) as Hotel[];
          if (flights.length) {
            const maxF = Math.max(...flights.map((f) => f.price));
            setMaxFlightPrice(maxF);
          }
          if (hotels.length) {
            const maxH = Math.max(...hotels.map((h) => h.price_per_night));
            setMaxHotelPrice(maxH);
          }
        }
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const filteredFlights = useMemo(() => {
    if (!data) return [];
    const list = data.plan.flights ?? [];
    return list
      .filter((f) => f.stops <= maxStops)
      .filter((f) => (maxFlightPrice > 0 ? f.price <= maxFlightPrice : true))
      .sort((a, b) => a.price - b.price);
  }, [data, maxFlightPrice, maxStops]);

  const filteredHotels = useMemo(() => {
    if (!data) return [];
    const list = data.plan.hotels ?? [];
    return list
      .filter((h) => (h.rating ?? 0) >= minHotelRating)
      .filter((h) => (maxHotelPrice > 0 ? h.price_per_night <= maxHotelPrice : true))
      .sort((a, b) => a.price_per_night - b.price_per_night);
  }, [data, minHotelRating, maxHotelPrice]);

  if (!loaded) {
    return (
      <main className="min-h-screen flex items-center justify-center text-stone-500">
        Chargement...
      </main>
    );
  }
  if (!data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="text-stone-600 dark:text-stone-300 mb-4">Aucun voyage planifié.</p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition"
        >
          Planifier un voyage
        </Link>
      </main>
    );
  }

  const { plan } = data;
  const currency = plan.currency ?? "EUR";
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-stone-50 to-blue-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-stone-950/70 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-2xl">✈️</span>
            BastiVoyage
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/trip"
              className="text-sm px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Itinéraire
            </Link>
            <Link
              href="/"
              className="text-sm px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              ← Nouveau
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-stone-500">Résultats</div>
              <h1 className="text-3xl sm:text-4xl font-bold mt-1">
                {plan.origin ? `${plan.origin} → ` : ""}
                {plan.destination}
              </h1>
              <div className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                {plan.duration_days ? `${plan.duration_days} jours` : ""}
                {plan.travelers ? ` · ${plan.travelers} voyageur${plan.travelers > 1 ? "s" : ""}` : ""}
                {plan.start_date ? ` · départ ${plan.start_date}` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-stone-500">Budget total</div>
              <div className="text-2xl font-bold text-brand-600">{fmt(plan.budget_total)}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(["all", "flights", "hotels"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                tab === t
                  ? "bg-brand-600 text-white"
                  : "bg-white/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-900 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-800"
              }`}
            >
              {t === "all" ? "Tout" : t === "flights" ? `✈️ Vols (${plan.flights?.length ?? 0})` : `🏠 Hôtels (${plan.hotels?.length ?? 0})`}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Filters sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            {(tab === "all" || tab === "flights") && (plan.flights?.length ?? 0) > 0 && (
              <div className="glass rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold">Filtres vols</h3>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">
                    Prix max : {fmt(maxFlightPrice || 9999)}
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={Math.max(...(plan.flights ?? [{ price: 1000 }]).map((f) => f.price))}
                    step={10}
                    value={maxFlightPrice || 1000}
                    onChange={(e) => setMaxFlightPrice(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">
                    Escales max : {maxStops}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={1}
                    value={maxStops}
                    onChange={(e) => setMaxStops(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                </div>
              </div>
            )}

            {(tab === "all" || tab === "hotels") && (plan.hotels?.length ?? 0) > 0 && (
              <div className="glass rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold">Filtres hébergement</h3>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">
                    Prix/nuit max : {fmt(maxHotelPrice || 9999)}
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={Math.max(
                      ...(plan.hotels ?? [{ price_per_night: 500 }]).map(
                        (h) => h.price_per_night,
                      ),
                    )}
                    step={10}
                    value={maxHotelPrice || 500}
                    onChange={(e) => setMaxHotelPrice(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">
                    Note min : {minHotelRating}★
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={minHotelRating}
                    onChange={(e) => setMinHotelRating(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                </div>
                {data.airbnb_search_link && (
                  <a
                    href={data.airbnb_search_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition"
                  >
                    Voir sur Airbnb ↗
                  </a>
                )}
              </div>
            )}

            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold mb-3">📍 Carte</h3>
              <MapView
                query={plan.destination}
                lat={plan.destination_lat}
                lng={plan.destination_lng}
                height={260}
              />
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {(tab === "all" || tab === "flights") && (
              <section className="glass rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">✈️ Vols</h2>
                  <span className="text-xs text-stone-500">
                    {filteredFlights.length} résultat{filteredFlights.length > 1 ? "s" : ""}
                  </span>
                </div>
                <FlightList
                  flights={filteredFlights}
                  currency={currency}
                  source={data.sources?.flights ?? plan.enrichment?.flights}
                />
              </section>
            )}

            {(tab === "all" || tab === "hotels") && (
              <section className="glass rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">🏠 Hébergements</h2>
                  <span className="text-xs text-stone-500">
                    {filteredHotels.length} résultat{filteredHotels.length > 1 ? "s" : ""}
                  </span>
                </div>
                <HotelList
                  hotels={filteredHotels}
                  airbnbSearchLink={data.airbnb_search_link}
                  currency={currency}
                  source={data.sources?.hotels ?? plan.enrichment?.hotels}
                />
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
