"use client";

import type { ItineraryDay } from "@/lib/types";

interface Props {
  days: ItineraryDay[];
}

export default function Itinerary({ days }: Props) {
  if (!days?.length) return null;

  return (
    <section className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-6">Itinéraire jour par jour</h3>
      <ol className="relative border-l-2 border-stone-200 dark:border-stone-700 space-y-8 ml-3">
        {days.map((d) => (
          <li key={d.day} className="ml-6">
            <span className="absolute -left-3.5 w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center ring-4 ring-stone-50 dark:ring-stone-950">
              {d.day}
            </span>
            <div className="mb-2">
              <div className="font-semibold text-base">
                Jour {d.day}
                {d.city ? (
                  <span className="text-stone-500 dark:text-stone-400 font-normal">
                    {" "}
                    · {d.city}
                  </span>
                ) : null}
              </div>
            </div>
            <ul className="space-y-2">
              {d.schedule.map((s, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm p-3 rounded-lg bg-white/50 dark:bg-stone-800/40"
                >
                  {s.time && (
                    <span className="font-mono text-brand-700 dark:text-brand-300 font-semibold min-w-[3.5rem]">
                      {s.time}
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{s.title}</div>
                    {s.description && (
                      <div className="text-stone-600 dark:text-stone-400 text-xs mt-0.5">
                        {s.description}
                      </div>
                    )}
                    {s.location && (
                      <div className="text-stone-500 dark:text-stone-500 text-xs mt-0.5">
                        📍 {s.location}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
