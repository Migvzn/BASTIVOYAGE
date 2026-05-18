import Link from "next/link";
import { retrieveSession } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function PremiumSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const session = searchParams.session_id
    ? await retrieveSession(searchParams.session_id).catch(() => null)
    : null;
  const paid = session?.payment_status === "paid";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 px-4">
      <div className="max-w-md w-full glass rounded-3xl p-10 text-center">
        <div className="text-6xl mb-4">{paid ? "🎉" : "⏳"}</div>
        <h1 className="text-3xl font-bold mb-2">
          {paid ? "Bienvenue dans Premium !" : "Paiement en cours"}
        </h1>
        <p className="text-stone-600 dark:text-stone-300 mb-6">
          {paid
            ? "Merci pour votre soutien. Toutes les fonctionnalités premium sont maintenant débloquées."
            : "Votre paiement est en cours de validation. Vous recevrez un email de confirmation."}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition"
        >
          Retour à l'accueil
        </Link>
      </div>
    </main>
  );
}
