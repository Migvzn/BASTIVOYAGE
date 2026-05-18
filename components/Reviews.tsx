"use client";

import type { Review } from "@/lib/types";

interface Props {
  reviews: Review[];
  compact?: boolean;
}

export default function Reviews({ reviews, compact = false }: Props) {
  if (!reviews?.length) {
    return <div className="text-xs text-stone-500 italic">Aucun avis disponible.</div>;
  }
  return (
    <ul className={compact ? "space-y-2" : "space-y-3"}>
      {reviews.map((r, i) => (
        <li
          key={i}
          className={`rounded-lg ${
            compact ? "p-2 text-xs" : "p-3 text-sm"
          } bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="font-semibold truncate">
              {r.author ?? "Voyageur"}
              {r.date ? <span className="text-stone-400 ml-2 font-normal">· {r.date}</span> : null}
            </div>
            <div className="text-amber-500 flex-shrink-0">
              {"★".repeat(Math.round(r.rating))}
              <span className="text-stone-300">{"★".repeat(5 - Math.round(r.rating))}</span>
            </div>
          </div>
          <p className={`text-stone-700 dark:text-stone-300 ${compact ? "line-clamp-3" : ""}`}>
            {r.text}
          </p>
        </li>
      ))}
    </ul>
  );
}
