"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TripRow {
  id: string;
  destination: string;
  origin?: string;
  budget_total?: number;
  duration_days?: number;
  summary?: string;
  prompt?: string;
  created_at: string;
}

interface User {
  id: string;
  email?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me").then((r) => r.json());
        if (!me?.user) {
          router.push("/login?next=/account");
          return;
        }
        setUser(me.user);
        const list = await fetch("/api/trips").then((r) => r.json());
        setTrips(list?.trips ?? []);
      } catch {
        router.push("/login?next=/account");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function deleteTrip(id: string) {
    if (!confirm("Supprimer ce voyage ?")) return;
    await fetch(`/api/trips/${id}`, { method: "DELETE" });
    setTrips((t) => t.filter((x) => x.id !== id));
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-stone-500">
        Chargement...
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
          <button
            onClick={logout}
            className="text-sm px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            Se déconnecter
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Mes voyages</h1>
            <p className="text-sm text-stone-500 mt-1">{user?.email}</p>
          </div>
          <Link
            href="/"
            className="text-sm px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold transition"
          >
            + Nouveau voyage
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-stone-600 dark:text-stone-300 mb-4">
              Vous n'avez pas encore sauvegardé de voyage.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition"
            >
              Planifier mon premier voyage
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((t) => (
              <div
                key={t.id}
                className="glass rounded-2xl p-5 flex flex-col hover:shadow-lg transition"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-semibold truncate">{t.destination}</h2>
                  {t.budget_total ? (
                    <span className="text-brand-600 font-bold">{fmt(t.budget_total)}</span>
                  ) : null}
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  {t.origin ? `Depuis ${t.origin} · ` : ""}
                  {t.duration_days ? `${t.duration_days} jours · ` : ""}
                  {new Date(t.created_at).toLocaleDateString("fr-FR")}
                </div>
                {t.summary && (
                  <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 line-clamp-3">
                    {t.summary}
                  </p>
                )}
                <div className="mt-auto pt-4 flex items-center gap-2">
                  <Link
                    href={`/account/${t.id}`}
                    className="flex-1 text-center px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition"
                  >
                    Voir
                  </Link>
                  <button
                    onClick={() => deleteTrip(t.id)}
                    className="px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 text-sm transition"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
