"use client";

import { useEffect, useRef, useState } from "react";
import type { PartnerLink } from "@/lib/links";

interface Props {
  links: PartnerLink[];
  label?: string;
  compact?: boolean;
}

export default function CompareDropdown({ links, label = "Comparer", compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!links.length) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`rounded-lg border border-stone-200 dark:border-stone-700 hover:border-brand-400 transition font-medium text-stone-700 dark:text-stone-200 ${
          compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label} ▾
      </button>
      {open && (
        <div className="absolute right-0 mt-1 min-w-[180px] z-20 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl py-1">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition"
            >
              <span className="text-base">{l.emoji}</span>
              <span className="flex-1">{l.label}</span>
              <span className="text-stone-400 text-xs">↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
