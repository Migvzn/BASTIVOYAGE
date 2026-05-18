"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = mode === "signin" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur");
      router.push(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md glass rounded-2xl p-8 shadow-xl">
      <Link href="/" className="flex items-center gap-2 mb-6 text-xl font-bold">
        <span className="text-2xl">✈️</span>
        BastiVoyage
      </Link>
      <h1 className="text-2xl font-bold mb-2">
        {mode === "signin" ? "Bon retour" : "Créer un compte"}
      </h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
        {mode === "signin"
          ? "Connectez-vous pour retrouver vos voyages."
          : "Sauvegardez vos plans IA et débloquez les exports premium."}
      </p>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
            Mot de passe
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 outline-none focus:border-brand-500"
          />
        </div>
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold transition disabled:opacity-50"
        >
          {loading ? "..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-stone-600 dark:text-stone-300">
        {mode === "signin" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-brand-600 font-semibold hover:underline"
        >
          {mode === "signin" ? "Inscrivez-vous" : "Connectez-vous"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-stone-50 to-blue-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 px-4">
      <Suspense fallback={<div className="text-stone-500">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
