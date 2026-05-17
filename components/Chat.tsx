"use client";

import { useState } from "react";
import type { TripPlan } from "@/lib/types";

const SUGGESTIONS = [
  "J'ai 1000€, je veux aller au Japon 10 jours depuis Paris",
  "Week-end romantique à Rome avec 600€ depuis Lyon",
  "Road trip en Islande 8 jours, budget 2000€",
  "Backpacking en Thaïlande 3 semaines, 1500€ depuis Marseille",
];

interface Props {
  onPlan: (plan: TripPlan, prompt: string) => void;
}

export default function Chat({ onPlan }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(text: string) {
    const q = text.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.plan) throw new Error("Réponse invalide");
      onPlan(data.plan as TripPlan, q);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de la génération",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(prompt);
        }}
        className="glass rounded-2xl p-2 shadow-xl shadow-stone-900/5"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Décrivez votre voyage idéal..."
            disabled={loading}
            className="flex-1 bg-transparent px-4 py-3 text-base sm:text-lg outline-none placeholder:text-stone-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold px-6 py-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création..." : "Planifier"}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setPrompt(s);
              submit(s);
            }}
            disabled={loading}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-white/60 hover:bg-white dark:bg-stone-800/60 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-8 space-y-3 animate-fade-in">
          <div className="skeleton h-6 w-2/3 mx-auto" />
          <div className="skeleton h-32" />
          <div className="grid grid-cols-3 gap-3">
            <div className="skeleton h-24" />
            <div className="skeleton h-24" />
            <div className="skeleton h-24" />
          </div>
          <p className="text-center text-sm text-stone-500 dark:text-stone-400">
            L'IA analyse votre budget et optimise votre itinéraire...
          </p>
        </div>
      )}
    </div>
  );
}
