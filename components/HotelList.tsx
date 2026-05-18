"use client";

import { useState } from "react";
import type { Hotel } from "@/lib/types";
import Reviews from "./Reviews";

interface Props {
  hotels: Hotel[];
  airbnbSearchLink?: string;
  currency?: string;
  source?: string;
}

export default function HotelList({ hotels, airbnbSearchLink, currency = "EUR", source }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  if (!hotels.length) {
    return <div className="text-sm text-stone-500 dark:text-stone-400 italic">Aucun logement trouvé.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {source && (
          <div className="text-xs text-stone-500 dark:text-stone-400">
            Source : {source === "rapidapi-booking" ? "Booking.com (live)" : "Estimations IA"}
          </div>
        )}
        {airbnbSearchLink && (
          <a
            href={airbnbSearchLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="text-xs px-3 py-1.5 rounded-full bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-semibold transition"
          >
            Voir sur Airbnb ↗
          </a>
        )}
      </div>

      <ul className="grid sm:grid-cols-2 gap-3">
        {hotels.map((h, i) => {
          const total = h.price_per_night * h.nights;
          const isOpen = expanded === i;
          return (
            <li
              key={i}
              className="p-4 rounded-2xl bg-white/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 hover:border-brand-400 transition flex flex-col"
            >
              {h.image_url && (
                <img
                  src={h.image_url}
                  alt={h.name}
                  className="w-full h-32 object-cover rounded-xl mb-3"
                  loading="lazy"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{h.name}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {h.city}
                    {h.nights ? ` · ${h.nights} nuit${h.nights > 1 ? "s" : ""}` : ""}
                  </div>
                </div>
                {h.rating != null && (
                  <div className="flex-shrink-0 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    ★ {Number(h.rating).toFixed(1)}
                  </div>
                )}
              </div>

              {h.tags && h.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {h.tags.slice(0, 4).map((t, j) => (
                    <span
                      key={j}
                      className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-end justify-between mt-3 pt-3 border-t border-stone-200/60 dark:border-stone-800/60">
                <div>
                  <div className="text-xs text-stone-500">{fmt(h.price_per_night)}/nuit</div>
                  <div className="text-lg font-bold text-brand-600">{fmt(total)}</div>
                  {h.reviews_count != null && (
                    <div className="text-[10px] text-stone-500">{h.reviews_count} avis</div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <a
                    href={h.affiliate_url ?? h.booking_link ?? h.fallback_link ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition text-center"
                  >
                    Réserver
                  </a>
                  {h.reviews && h.reviews.length > 0 && (
                    <button
                      onClick={() => setExpanded(isOpen ? null : i)}
                      className="text-[11px] text-stone-500 hover:text-brand-600 transition"
                    >
                      {isOpen ? "Masquer avis" : "Voir avis"}
                    </button>
                  )}
                </div>
              </div>

              {isOpen && h.reviews && h.reviews.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-200/60 dark:border-stone-800/60">
                  <Reviews reviews={h.reviews} compact />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
