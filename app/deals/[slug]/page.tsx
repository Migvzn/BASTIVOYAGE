import Link from "next/link";
import { notFound } from "next/navigation";
import FlightList from "@/components/FlightList";
import HotelList from "@/components/HotelList";
import MapView from "@/components/MapView";
import { POPULAR_ROUTES, findRoute, buildDeal } from "@/lib/deals";
import { searchFlights } from "@/lib/flights";
import { searchHotels } from "@/lib/hotels";
import { searchTransport } from "@/lib/transport";

export const revalidate = 3600;

export function generateStaticParams() {
  return POPULAR_ROUTES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const route = findRoute(params.slug);
  if (!route) return { title: "Deal introuvable" };
  return {
    title: `${route.origin} → ${route.destination} : vols et hôtels en temps réel — BastiVoyage`,
    description: `Comparez les meilleurs vols et hôtels ${route.origin} → ${route.destination} (${route.country}). ${route.tagline}. Réservation en un clic via Skyscanner, Booking et Airbnb.`,
  };
}

function offset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function DealPage({ params }: { params: { slug: string } }) {
  const route = findRoute(params.slug);
  if (!route) notFound();

  const depart = offset(14);
  const ret = offset(17);
  const [deal, flights, hotels, transport] = await Promise.all([
    buildDeal(route),
    searchFlights({
      origin: route.origin,
      destination: route.destination,
      departDate: depart,
      returnDate: ret,
      adults: 2,
      budgetHint: 600,
    }),
    searchHotels({
      city: route.destination,
      checkIn: depart,
      checkOut: ret,
      adults: 2,
      nights: 3,
      budgetHint: 600,
      tier: "balanced",
    }),
    searchTransport({ from: route.origin, to: route.destination, date: depart }),
  ]);

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
          <Link
            href="/deals"
            className="text-sm px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            ← Tous les deals
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="text-5xl mb-2">{route.emoji}</div>
          <h1 className="text-3xl sm:text-5xl font-bold">
            {route.origin} → {route.destination}
          </h1>
          <p className="mt-2 text-lg text-stone-600 dark:text-stone-300">
            {route.country} · {route.tagline}
          </p>
          <p className="mt-4 text-sm text-stone-500 dark:text-stone-400 max-w-2xl">
            <strong>À voir :</strong> {route.highlight}
          </p>

          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20">
              <div className="text-xs text-stone-500">Vol A/R dès</div>
              <div className="text-2xl font-bold text-brand-600">
                {fmt((deal.cheapest_flight?.price ?? 100) * 2)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <div className="text-xs text-stone-500">Hôtel 3 nuits dès</div>
              <div className="text-2xl font-bold text-purple-600">
                {fmt((deal.cheapest_hotel?.price_per_night ?? 50) * 3)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <div className="text-xs text-stone-500">Total estimé / 2 personnes</div>
              <div className="text-2xl font-bold text-emerald-600">
                {fmt(deal.estimated_total_3d)}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/?prompt=${encodeURIComponent(`Voyage de ${route.origin} à ${route.destination} 3 jours, budget 500€`)}`}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition"
            >
              ✨ Personnaliser avec l'IA
            </Link>
            <a
              href={deal.airbnb_link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold transition"
            >
              Voir sur Airbnb ↗
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">✈️ Vols recommandés</h2>
              <FlightList
                flights={flights.flights}
                source={flights.source}
                defaultOrigin={route.origin}
                defaultDestination={route.destination}
                defaultDepartDate={depart}
                defaultReturnDate={ret}
                defaultAdults={2}
              />
            </section>

            <section className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">🏠 Où dormir à {route.destination}</h2>
              <HotelList
                hotels={hotels.hotels}
                airbnbSearchLink={hotels.airbnb_search_link}
                source={hotels.source}
                defaultCheckIn={depart}
                defaultCheckOut={ret}
                defaultAdults={2}
              />
            </section>

            <section className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">🚆 Autres moyens d'y aller</h2>
              <ul className="space-y-2">
                {transport.legs.map((t, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-stone-800/40"
                  >
                    <div className="text-xl">
                      {t.mode === "train" ? "🚆" : t.mode === "bus" ? "🚌" : t.mode === "flight" ? "✈️" : "🧭"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium capitalize">{t.mode}</div>
                      <div className="text-xs text-stone-500 truncate">
                        {t.duration} · {t.carrier ?? ""} {t.notes ? `· ${t.notes}` : ""}
                      </div>
                    </div>
                    <div className="font-semibold">{t.price > 0 ? fmt(t.price) : "Variable"}</div>
                    {(t.booking_link || t.fallback_link) && (
                      <a
                        href={t.affiliate_url ?? t.booking_link ?? t.fallback_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-stone-800 dark:bg-stone-100 dark:text-stone-900 text-white text-xs font-semibold transition"
                      >
                        Réserver →
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="glass rounded-2xl p-5">
              <h3 className="font-semibold mb-3">📍 Carte</h3>
              <MapView query={route.destination} height={260} />
            </section>

            <section className="glass rounded-2xl p-5">
              <h3 className="font-semibold mb-3">💡 À savoir</h3>
              <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-300">
                <li>• Prix indicatifs, mis à jour toutes les heures</li>
                <li>• Réservation directe via Skyscanner / Booking</li>
                <li>• Pour un plan IA personnalisé, cliquez sur "Personnaliser"</li>
              </ul>
            </section>

            <section className="glass rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Autres destinations</h3>
              <ul className="space-y-1">
                {POPULAR_ROUTES.filter((r) => r.slug !== route.slug)
                  .slice(0, 5)
                  .map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/deals/${r.slug}`}
                        className="text-sm text-brand-600 hover:underline"
                      >
                        {r.emoji} {r.origin} → {r.destination}
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
