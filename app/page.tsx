"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Chat from "@/components/Chat";
import TripView from "@/components/TripView";
import type { TripPlan } from "@/lib/types";

const STORAGE_KEY = "bastivoyage:lastPlan";

interface Extras {
  airbnb_search_link?: string;
  sources?: Record<string, string>;
}

export default function Home() {
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [extras, setExtras] = useState<Extras>({});
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.plan) {
          setPlan(parsed.plan as TripPlan);
          setExtras({
            airbnb_search_link: parsed.airbnb_search_link,
            sources: parsed.sources,
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  function handlePlan(p: TripPlan, prompt: string, ex?: Extras) {
    setPlan(p);
    setExtras(ex ?? {});
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          plan: p,
          prompt,
          airbnb_search_link: ex?.airbnb_search_link,
          sources: ex?.sources,
          savedAt: Date.now(),
        }),
      );
    } catch {
      // ignore
    }
    setTimeout(() => {
      document
        .getElementById("trip-result")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore
    }
  }

  function reset() {
    setPlan(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-stone-50 to-blue-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-stone-950/70 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={reset}
            className="text-xl font-bold tracking-tight flex items-center gap-2"
          >
            <span className="text-2xl">✈️</span>
            BastiVoyage
          </button>
          <div className="flex items-center gap-2">
            {plan && (
              <button
                onClick={reset}
                className="text-sm px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                Nouveau voyage
              </button>
            )}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition flex items-center justify-center"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-8">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Votre voyage,{" "}
            <span className="bg-gradient-to-r from-brand-500 to-orange-600 bg-clip-text text-transparent">
              optimisé par IA
            </span>
          </h1>
          <p className="mt-4 text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto">
            Donnez votre budget et votre envie — l'IA compare vols, trains,
            hôtels, activités et bâtit un itinéraire jour par jour.
          </p>
        </div>

        <Chat onPlan={handlePlan} />
      </section>

      {plan && (
        <section
          id="trip-result"
          className="max-w-6xl mx-auto px-4 sm:px-6 pb-20"
        >
          <div className="flex justify-end mb-4">
            <Link
              href="/results"
              className="text-sm px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold transition"
            >
              Voir tous les vols & hôtels →
            </Link>
          </div>
          <TripView
            plan={plan}
            airbnbSearchLink={extras.airbnb_search_link}
            flightsSource={extras.sources?.flights}
            hotelsSource={extras.sources?.hotels}
          />
        </section>
      )}

      <footer className="border-t border-stone-200/60 dark:border-stone-800/60 py-8 text-center text-sm text-stone-500 dark:text-stone-400">
        <p>BastiVoyage · IA Travel Planner · Déployé sur Vercel</p>
      </footer>
    </main>
  );
}
