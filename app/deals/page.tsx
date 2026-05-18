import Link from "next/link";
import { buildAllDeals } from "@/lib/deals";

export const revalidate = 3600;

export const metadata = {
  title: "Deals & inspirations voyage — BastiVoyage",
  description:
    "Découvrez les meilleurs deals voyage du moment : vols, hôtels et city breaks à prix imbattables depuis Paris. Comparez en temps réel et réservez en un clic.",
};

export default async function DealsPage() {
  const deals = await buildAllDeals();
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-stone-50 to-blue-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-stone-950/70 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-2xl">✈️</span>
            BastiVoyage
          </Link>
          <nav className="flex gap-1">
            <Link
              href="/"
              className="text-sm px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Planifier
            </Link>
            <Link
              href="/account"
              className="text-sm px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Mes voyages
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Les deals voyage{" "}
            <span className="bg-gradient-to-r from-brand-500 to-orange-600 bg-clip-text text-transparent">
              du moment
            </span>
          </h1>
          <p className="mt-3 text-lg text-stone-600 dark:text-stone-300 max-w-2xl">
            Vols + hôtels comparés en temps réel pour les destinations les plus populaires depuis Paris.
            3 jours, prix indicatif tout compris.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((d) => (
            <Link
              key={d.route.slug}
              href={`/deals/${d.route.slug}`}
              className="glass rounded-2xl p-5 hover:scale-[1.02] hover:shadow-xl transition border border-stone-200/60 dark:border-stone-800/60 flex flex-col"
            >
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-3xl">{d.route.emoji}</div>
                <div className="text-xs text-stone-500">Dès</div>
              </div>
              <div className="text-2xl font-bold">{d.route.destination}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">
                {d.route.country} · {d.route.tagline}
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-300 mt-3 line-clamp-2">
                {d.route.highlight}
              </p>

              <div className="mt-auto pt-4 flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-brand-600">{fmt(d.estimated_total_3d)}</div>
                  <div className="text-[10px] text-stone-500">3 jours, 2 voyageurs</div>
                </div>
                <span className="text-xs font-semibold text-brand-600 hover:underline">
                  Voir le deal →
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {d.cheapest_flight && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    ✈️ {fmt(d.cheapest_flight.price)} · {d.cheapest_flight.airline}
                  </span>
                )}
                {d.cheapest_hotel && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    🏨 {fmt(d.cheapest_hotel.price_per_night)}/nuit
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-stone-200/60 dark:border-stone-800/60 py-8 text-center text-sm text-stone-500 dark:text-stone-400">
        Prix mis à jour toutes les heures · Affiliation Booking & Skyscanner
      </footer>
    </main>
  );
}
