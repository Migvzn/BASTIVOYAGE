"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TripPlan } from "@/lib/types";

interface Props {
  plan: TripPlan;
  prompt?: string;
  airbnbSearchLink?: string;
  sources?: Record<string, string>;
}

type Status = "idle" | "saving" | "saved" | "error";

export default function SaveTripButton({ plan, prompt, airbnbSearchLink, sources }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setStatus("saving");
    setMsg(null);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          prompt,
          airbnb_search_link: airbnbSearchLink,
          sources,
        }),
      });
      if (res.status === 401) {
        router.push("/login?next=/");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur");
      setStatus("saved");
      setMsg("Voyage enregistré dans votre compte");
    } catch (e) {
      setStatus("error");
      setMsg(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={save}
        disabled={status === "saving" || status === "saved"}
        className={`text-sm px-4 py-2 rounded-lg font-semibold transition ${
          status === "saved"
            ? "bg-green-600 text-white"
            : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
        }`}
      >
        {status === "saving"
          ? "Enregistrement..."
          : status === "saved"
            ? "✓ Sauvegardé"
            : "💾 Sauvegarder"}
      </button>
      {msg && status === "error" && (
        <span className="text-xs text-red-600">{msg}</span>
      )}
    </div>
  );
}
