# 🌍 BastiVoyage

> Une super-app voyage propulsée par IA. L'utilisateur décrit son voyage en langage naturel — l'IA orchestre vols, hôtels, transports, avis et itinéraire, puis renvoie chaque résultat avec un lien de réservation direct.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Migvzn/BASTIVOYAGE)

---

## ✨ Ce que fait l'app

| | |
|---|---|
| **✈️ Vols** | Amadeus (live) avec fallback IA · liens Skyscanner / Google Flights · tracking affiliate ready |
| **🏠 Hébergements** | Booking.com via RapidAPI · fallback IA · lien Airbnb de recherche · avis Google Places intégrés |
| **🚆 Transport** | Comparateur multi-modal train / bus / vol / ferry · liens SNCF Connect, Omio, Rome2Rio |
| **⭐ Avis** | Google Places API (notes + 5 derniers avis) · fallback réaliste · lien TripAdvisor |
| **💰 Comparateur** | 3 budgets calculés (économique / équilibré / premium) avec total + breakdown |
| **📍 Carte** | OpenStreetMap embed · lien Google Maps |
| **🗓 Itinéraire** | Jour par jour cohérent (géographie, horaires) |
| **🔗 Booking** | Chaque résultat = `booking_link` + `affiliate_url` (si configuré) + `fallback_link` Google |
| **🔥 Deals SEO** | Pages statiques `/deals/[slug]` rafraîchies via Vercel Cron toutes les 6h |
| **👤 Comptes** | Auth Supabase email/mot de passe + sauvegarde des voyages |
| **💎 Premium** | Stripe Checkout one-shot pour débloquer export PDF + concierge IA |

**Philosophie** : l'app fonctionne **sans aucune clé API** grâce à des données mock réalistes générées par Claude. Chaque clé ajoutée enrichit progressivement les résultats avec du temps réel.

---

## 🚀 Quick Start

```bash
git clone https://github.com/Migvzn/BASTIVOYAGE.git
cd BASTIVOYAGE
cp .env.example .env.local
# (optionnel) ajoutez vos clés dans .env.local
npm install
npm run dev
# → http://localhost:3000
```

---

## 🔐 Variables d'environnement

Toutes optionnelles — l'app fait du graceful fallback. Voir `.env.example` pour la liste complète.

| Variable | Effet quand absente | Comment l'obtenir |
|---|---|---|
| `ANTHROPIC_API_KEY` | Plans démo génériques au lieu de plans IA personnalisés | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| `AMADEUS_CLIENT_ID` + `AMADEUS_CLIENT_SECRET` | Vols mock (réalistes mais non live) | [developers.amadeus.com](https://developers.amadeus.com/) — free tier dispo |
| `RAPIDAPI_KEY` | Hôtels mock | [rapidapi.com/apidojo/api/booking](https://rapidapi.com/apidojo/api/booking/) |
| `GOOGLE_PLACES_API_KEY` | Avis et coordonnées mock | [Google Cloud Console → Places API](https://developers.google.com/maps/documentation/places/web-service) |
| `SKYSCANNER_AFFILIATE_ID` | `affiliate_url` absent (booking_link reste fonctionnel) | Partner program Skyscanner |
| `BOOKING_AFFILIATE_ID` | Idem pour Booking.com | [Booking Partner Hub](https://partner.booking.com/) |

---

## 🏛 Architecture

```
/app
  page.tsx                  # Home : chat IA + résultats inline
  results/page.tsx          # Page résultats complète (filtres + carte)
  trip/page.tsx             # Itinéraire jour par jour
  layout.tsx
  globals.css
  api/
    ai/route.ts             # Orchestrateur principal (POST /api/ai)
    flights/route.ts        # Recherche vols (POST /api/flights)
    hotels/route.ts         # Recherche hôtels (POST /api/hotels)
    reviews/route.ts        # Avis Google Places (POST /api/reviews)
    transport/route.ts      # Multi-modal (POST /api/transport)

/components
  Chat.tsx                  # Input prompt + appel API
  TripView.tsx              # Vue résultats principale
  FlightList.tsx            # Liste vols avec boutons "Réserver"
  HotelList.tsx             # Cartes hôtels avec tags + avis
  Reviews.tsx               # Affichage des avis
  MapView.tsx               # Carte OSM embed
  PriceComparison.tsx       # Comparateur 3 budgets
  Budget.tsx                # Répartition budgétaire
  Itinerary.tsx             # Itinéraire jour par jour

/lib
  ai.ts                     # Orchestrateur Claude + fusion sources
  flights.ts                # Wrapper Amadeus + mock
  hotels.ts                 # Wrapper Booking RapidAPI + mock
  reviews.ts                # Wrapper Google Places + mock
  transport.ts              # Multi-modal mock + liens partenaires
  links.ts                  # Générateur de booking_links + affiliate
  parser.ts                 # Normalisation JSON IA
  types.ts                  # Types TypeScript

/prompts
  travel.md                 # System prompt expert IA
```

### Flux d'une requête

```
User prompt → POST /api/ai
   │
   ├─ Claude (claude-opus-4-7) génère TripPlan structuré
   │     (vols, hôtels, activités, itinéraire, budgets)
   │
   ├─ Enrichissement parallèle :
   │     • searchFlights() → Amadeus live ou mock
   │     • searchHotels() → Booking live ou mock
   │     • searchTransport() → liens multi-modal
   │     • getReviews() pour chaque hôtel top → Google Places
   │
   ├─ Merge + déduplication
   │
   └─ Réponse JSON { plan, airbnb_search_link, sources }
        │
        ├─ Home : affichage inline (TripView)
        └─ /results : page complète avec filtres + carte
```

---

## ☁️ Deploy sur Vercel

1. **Import** le repo dans Vercel
2. **Production Branch** = `main`
3. **Environment Variables** : ajoutez au minimum `ANTHROPIC_API_KEY`
4. Cliquez Deploy

Le framework est auto-détecté (Next.js 14, App Router, runtime nodejs).

`prompts/travel.md` est inclus dans le bundle serverless via `experimental.outputFileTracingIncludes` dans `next.config.js`.

Le `vercel.json` configure un **cron toutes les 6 heures** qui rafraîchit le cache ISR des pages deals (`/api/cron/deals`). Optionnel : définissez `CRON_SECRET` pour authentifier l'endpoint.

---

## 🗄 Supabase setup (auth + voyages sauvegardés)

1. Créez un projet sur [supabase.com](https://supabase.com/dashboard)
2. Dans **SQL Editor**, exécutez le contenu de [`supabase/schema.sql`](./supabase/schema.sql) (crée la table `trips` avec RLS par user)
3. Récupérez dans **Settings → API** :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (optionnel, server-only)
4. Dans **Authentication → Providers**, activez **Email** (et désactivez "Confirm email" pour les tests rapides)

Sans Supabase, l'app fonctionne mais `/login`, `/account` et le bouton "Sauvegarder" répondent 503.

---

## 💳 Stripe setup (premium)

1. [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) → mode Test
2. Créez un produit **"BastiVoyage Premium"** → prix one-time 9,99 €
3. Copiez :
   - `Secret key` → `STRIPE_SECRET_KEY`
   - `Price ID` du produit → `STRIPE_PREMIUM_PRICE_ID`
4. Webhook : créez un endpoint vers `https://votre-domaine.vercel.app/api/stripe/webhook` avec l'event `checkout.session.completed`. Copiez le **signing secret** → `STRIPE_WEBHOOK_SECRET`

Sans Stripe, la page `/premium` affiche le pricing mais le bouton renvoie 503.

---

## 💰 Monétisation

L'app est conçue pour être monétisée via affiliation :

- **Skyscanner** : `SKYSCANNER_AFFILIATE_ID` → ajoute `?associateid=...` aux liens vols
- **Booking** : `BOOKING_AFFILIATE_ID` → ajoute `?aid=...` aux liens hôtels
- **Airbnb** : programme partenaire requis (l'app utilise déjà des liens `airbnb.fr/s/...`)
- **GetYourGuide** : les activités pointent vers `getyourguide.fr/s/?q=...` (programme affiliate dispo)

Pour des conversions optimales :
- Tracking : ajoutez un script Plausible / PostHog dans `app/layout.tsx`
- SEO : les pages `/results` peuvent être rendues statiquement pour des deals populaires

---

## 🧠 Tech stack

- **Next.js 14** (App Router, Server Components, Edge-ready)
- **TypeScript** (strict)
- **TailwindCSS** (design system custom)
- **Anthropic SDK** (`claude-opus-4-7` avec thinking adaptatif)
- **Vercel** (deploy + analytics)

---

## 📝 Roadmap

- [x] Webhook Stripe pour upsell "voyage premium"
- [x] Cron job Vercel pour deals de dernière minute → pages SEO auto-générées
- [x] Auth Supabase + sauvegarde cloud des voyages
- [ ] Mode multi-destination (city-hopping intelligent)
- [ ] Export PDF de l'itinéraire (avec @react-pdf/renderer)
- [ ] Alertes prix par email
- [ ] Mode hors-ligne (PWA)

---

Made with Claude · Hébergé sur Vercel
