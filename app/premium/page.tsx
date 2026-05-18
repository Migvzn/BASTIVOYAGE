"use client";

import { useState } from "react";
import Link from "next/link";

const FEATURES = [
  { icon: "📄", title: "Export PDF de l'itinéraire", desc: "Téléchargez votre voyage hors-ligne, prêt à imprimer." },
  { icon: "🧠", title: "Conseiller IA dédié", desc: "Chat de suivi pour affiner les options et alternatives." },
  { icon: "🎯", title: "10x plus de résultats vols & hôtels", desc: "Pagination étendue, plus de fournisseurs comparés." },
  { icon: "⚡", title: "Priorité de génération", desc: "Réponses IA accélérées avec budget de réflexion étendu." },
  { icon: "🔔", title: "Alertes de prix", desc: "Soyez notifié quand vos vols baissent (à venir)." },
  { icon: "✨", title: "Soutenir le projet", desc: "Aidez-nous à garder le service gratuit pour tous." },
];

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error ?? "Erreur");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-stone-50 to-blue-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-stone-950/70 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">✈️</span>
            BastiVoyage
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wide mb-3">
            Premium
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Voyagez{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              sans limites
            </span>
          </h1>
          <p className="mt-4 text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto">
            Pour les voyageurs qui veulent plus : un export PDF complet, un conseiller IA dédié, plus de résultats et une priorité de génération.
          </p>
        </div>

        <div className="glass rounded-3xl p-8 sm:p-12 max-w-2xl mx-auto text-center mb-10">
          <div className="text-stone-500 text-sm uppercase tracking-wide">Paiement unique</div>
          <div className="text-6xl font-bold mt-2">
            9,99<span className="text-2xl text-stone-500">€</span>
          </div>
          <p className="text-stone-500 mt-2">Accès à vie · Sans abonnement</p>
          <button
            onClick={checkout}
            disabled={loading}
            className="mt-6 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {loading ? "Redirection..." : "Passer Premium →"}
          </button>
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          <p className="text-xs text-stone-400 mt-3">
            Paiement sécurisé Stripe · Visa, Mastercard, Apple Pay
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-5">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-semibold">{f.title}</div>
              <div className="text-sm text-stone-600 dark:text-stone-300 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
