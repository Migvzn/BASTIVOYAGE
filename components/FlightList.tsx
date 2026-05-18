"use client";

import type { Flight } from "@/lib/types";
import { flightComparison } from "@/lib/links";
import CompareDropdown from "./CompareDropdown";

interface Props {
  flights: Flight[];
  currency?: string;
  source?: string;
  defaultOrigin?: string;
  defaultDestination?: string;
  defaultDepartDate?: string;
  defaultReturnDate?: string;
  defaultAdults?: number;
}

const SOURCE_LABELS: Record<string, string> = {
  amadeus: "Amadeus (live)",
  skyscanner: "Skyscanner",
  "google-flights": "Google Flights",
  mock: "Estimations IA",
  fallback: "Recherche externe",
};

function flightCabin(c?: string): "economy" | "premiumeconomy" | "business" | "first" {
  const s = (c ?? "").toLowerCase();
  if (s.includes("business")) return "business";
  if (s.includes("premium")) return "premiumeconomy";
  if (s.includes("first")) return "first";
  return "economy";
}

export default function FlightList({
  flights,
  currency = "EUR",
  source,
  defaultOrigin,
  defaultDestination,
  defaultDepartDate,
  defaultReturnDate,
  defaultAdults,
}: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  if (!flights.length) {
    return (
      <div className="text-sm text-stone-500 dark:text-stone-400 italic">
        Aucun vol trouvé. Essayez d'élargir vos dates.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {source && (
        <div className="text-xs text-stone-500 dark:text-stone-400">
          Source : {SOURCE_LABELS[source] ?? source}
        </div>
      )}
      <ul className="space-y-2">
        {flights.map((f, i) => {
          const compareLinks = flightComparison({
            origin: f.from || defaultOrigin,
            destination: f.to || defaultDestination || "",
            departDate: defaultDepartDate,
            returnDate: defaultReturnDate,
            adults: defaultAdults,
            cabin: flightCabin(f.cabin),
            maxStops: f.stops,
          });
          return (
            <li
              key={i}
              className="flex flex-wrap items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 hover:border-brand-400 transition"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-xl">
                ✈️
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {f.airline}
                  {f.flight_number ? ` · ${f.flight_number}` : ""}
                </div>
                <div className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                  {f.from} → {f.to} · {f.duration} ·{" "}
                  {f.stops === 0 ? "Direct" : `${f.stops} escale${f.stops > 1 ? "s" : ""}`}
                  {f.cabin ? ` · ${f.cabin}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg sm:text-xl font-bold text-brand-600">{fmt(f.price)}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={f.affiliate_url ?? f.booking_link ?? f.fallback_link}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition whitespace-nowrap"
                >
                  Skyscanner →
                </a>
                <CompareDropdown links={compareLinks} label="Comparer" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
