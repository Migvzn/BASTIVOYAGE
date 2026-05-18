"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TripView from "@/components/TripView";
import type { TripPlan } from "@/lib/types";

const STORAGE_KEY = "bastivoyage:lastPlan";

export default function TripPage() {
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [airbnb, setAirbnb] = useState<string | undefined>();
  const [sources, setSources] = useState<Record<string, string> | undefined>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.plan) {
          setPlan(parsed.plan as TripPlan);
          setAirbnb(parsed.airbnb_search_link);
          setSources(parsed.sources);
        }
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-stone-50 to-blue-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-stone-950/70 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight flex items-center gap-2"
          >
            <span className="text-2xl">✈️</span>
            BastiVoyage
          </Link>
          <Link
            href="/"
            className="text-sm px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            ← Retour
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {!loaded ? (
          <div className="text-center text-stone-500">Chargement...</div>
        ) : plan ? (
          <TripView
            plan={plan}
            airbnbSearchLink={airbnb}
            flightsSource={sources?.flights}
            hotelsSource={sources?.hotels}
          />
        ) : (
          <div className="text-center py-20">
            <p className="text-stone-600 dark:text-stone-300 mb-4">
              Aucun voyage sauvegardé.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition"
            >
              Planifier un voyage
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
