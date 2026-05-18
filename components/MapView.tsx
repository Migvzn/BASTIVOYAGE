"use client";

import { googleMapsLink } from "@/lib/links";

interface Props {
  query: string;
  lat?: number;
  lng?: number;
  height?: number;
}

export default function MapView({ query, lat, lng, height = 320 }: Props) {
  const hasCoords = lat != null && lng != null;
  const bbox = hasCoords
    ? `${(lng! - 0.05).toFixed(4)},${(lat! - 0.03).toFixed(4)},${(lng! + 0.05).toFixed(4)},${(lat! + 0.03).toFixed(4)}`
    : null;
  const marker = hasCoords ? `&marker=${lat},${lng}` : "";

  const src = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=-180,-60,180,80&layer=mapnik`;

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 relative group">
      <iframe
        title={`Carte ${query}`}
        src={src}
        loading="lazy"
        style={{ width: "100%", height, border: 0 }}
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={googleMapsLink(query)}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-stone-900/90 backdrop-blur text-xs font-semibold shadow hover:bg-white dark:hover:bg-stone-900 transition"
      >
        Ouvrir Google Maps ↗
      </a>
    </div>
  );
}
