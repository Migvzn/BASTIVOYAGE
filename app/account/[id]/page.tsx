"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import TripView from "@/components/TripView";
import type { TripPlan } from "@/lib/types";

interface SavedTrip {
  id: string;
  plan: TripPlan;
  prompt?: string;
  airbnb_search_link?: string;
  sources?: Record<string, string>;
}

export default function SavedTripPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const router = useRouter();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/trips/${id}`);
        if (res.status === 401) {
          router.push(`/login?next=/account/${id}`);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Erreur");
        setTrip(data.trip);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-stone-500">
        Chargement...
      </main>
    );
  }
  if (error || !trip) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-stone-600 dark:text-stone-300 mb-4">{error ?? "Voyage introuvable"}</p>
        <Link
          href="/account"
          className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition"
        >
          ← Mes voyages
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-stone-50 to-blue-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-stone-950/70 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">✈️</span>
            BastiVoyage
          </Link>
          <Link
            href="/account"
            className="text-sm px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            ← Mes voyages
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <TripView
          plan={trip.plan}
          airbnbSearchLink={trip.airbnb_search_link}
          flightsSource={trip.sources?.flights}
          hotelsSource={trip.sources?.hotels}
        />
      </section>
    </main>
  );
}
