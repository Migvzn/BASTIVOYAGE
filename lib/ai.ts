import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { extractJSON, normalizeTripPlan } from "./parser";
import { searchFlights } from "./flights";
import { searchHotels } from "./hotels";
import { searchTransport } from "./transport";
import { getReviews } from "./reviews";
import {
  airbnbLink,
  bookingHotelLink,
  skyscannerFlightLink,
  activityLink,
  transportLink,
} from "./links";
import type {
  Activity,
  Flight,
  Hotel,
  TransportLeg,
  TripPlan,
} from "./types";

function loadSystemPrompt(): string {
  const candidates = [
    path.join(process.cwd(), "prompts", "travel.md"),
    path.join(__dirname, "..", "prompts", "travel.md"),
    path.join(__dirname, "..", "..", "prompts", "travel.md"),
  ];
  for (const p of candidates) {
    try {
      return fs.readFileSync(p, "utf-8");
    } catch {
      // try next
    }
  }
  return "You are a travel planning assistant. Always reply with a valid JSON TripPlan.";
}

function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

async function callClaude(userQuery: string): Promise<TripPlan | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system: [
        {
          type: "text",
          text: loadSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userQuery }],
    } as any);

    const textBlock = (response.content as any[]).find(
      (b: any) => b.type === "text",
    );
    if (!textBlock || textBlock.type !== "text") return null;
    const parsed = extractJSON(textBlock.text);
    return normalizeTripPlan(parsed);
  } catch (err) {
    console.error("Claude call failed:", err);
    return null;
  }
}

export async function generateTripPlan(userQuery: string): Promise<TripPlan> {
  const base = (await callClaude(userQuery)) ?? fallbackPlan(userQuery);
  return enrichPlan(base);
}

async function enrichPlan(plan: TripPlan): Promise<TripPlan> {
  const origin = plan.origin ?? "Paris";
  const destination = plan.destination;
  const duration = plan.duration_days ?? 5;
  const adults = plan.travelers ?? 2;
  const today = new Date();
  const departDate = plan.start_date ?? offsetDate(today, 30);
  const returnDate = plan.end_date ?? offsetDate(today, 30 + duration);

  const [flightRes, hotelRes, transportRes] = await Promise.all([
    searchFlights({
      origin,
      destination,
      departDate,
      returnDate,
      adults,
      budgetHint: plan.budget_total,
    }),
    searchHotels({
      city: destination,
      checkIn: departDate,
      checkOut: returnDate,
      adults,
      nights: Math.max(1, duration - 1),
      budgetHint: plan.budget_total,
      tier: "balanced",
    }),
    searchTransport({ from: origin, to: destination, date: departDate }),
  ]);

  const aiFlights = (plan.flights ?? []).map((f) =>
    attachFlightLink(f, origin, destination, departDate, returnDate, adults),
  );
  const mergedFlights = mergeFlights(aiFlights, flightRes.flights).slice(0, 8);

  const aiHotels = (plan.hotels ?? []).map((h) =>
    attachHotelLink(h, departDate, returnDate, adults),
  );
  const mergedHotels = mergeHotels(aiHotels, hotelRes.hotels).slice(0, 9);
  const enrichedHotels = await Promise.all(
    mergedHotels.slice(0, 6).map(async (h) => {
      try {
        const info = await getReviews({ name: h.name, city: h.city });
        return {
          ...h,
          rating: h.rating ?? info.rating,
          reviews_count: h.reviews_count ?? info.reviews_count,
          reviews: info.reviews,
          lat: h.lat ?? info.lat,
          lng: h.lng ?? info.lng,
        };
      } catch {
        return h;
      }
    }),
  );
  const finalHotels = [...enrichedHotels, ...mergedHotels.slice(6)];

  const activities = (plan.activities ?? []).map((a) => attachActivityLink(a));

  const transport: TransportLeg[] = mergeTransport(
    (plan.transport ?? []).map((t) => attachTransportLink(t, departDate)),
    transportRes.legs,
  );

  const enrichedOptions = (plan.options ?? []).map((opt) => ({
    ...opt,
    transport: opt.transport.map((t) => attachTransportLink(t, departDate)),
    hotels: opt.hotels.map((h) => attachHotelLink(h, departDate, returnDate, adults)),
    activities: opt.activities.map(attachActivityLink),
    flights:
      (opt.flights ?? []).map((f) =>
        attachFlightLink(f, origin, destination, departDate, returnDate, adults),
      ).length > 0
        ? (opt.flights ?? []).map((f) =>
            attachFlightLink(f, origin, destination, departDate, returnDate, adults),
          )
        : mergedFlights.slice(0, 3),
    total_price: opt.total_price ?? opt.price,
  }));

  return {
    ...plan,
    start_date: departDate,
    end_date: returnDate,
    travelers: adults,
    flights: mergedFlights,
    hotels: finalHotels,
    activities,
    transport,
    options: enrichedOptions.length ? enrichedOptions : plan.options,
    enrichment: {
      flights: flightRes.source,
      hotels: hotelRes.source,
      transport: transportRes.source,
      reviews: process.env.GOOGLE_PLACES_API_KEY ? "google-places" : "mock",
    },
    generated_at: new Date().toISOString(),
  };
}

function offsetDate(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function flightCabin(c?: string): "economy" | "premiumeconomy" | "business" | "first" {
  const s = (c ?? "").toLowerCase();
  if (s.includes("business")) return "business";
  if (s.includes("premium")) return "premiumeconomy";
  if (s.includes("first")) return "first";
  return "economy";
}

function attachFlightLink(
  f: Flight,
  origin: string,
  destination: string,
  depart?: string,
  ret?: string,
  adults?: number,
): Flight {
  if (f.booking_link) return f;
  const link = skyscannerFlightLink({
    origin: f.from || origin,
    destination: f.to || destination,
    departDate: depart,
    returnDate: ret,
    adults,
    cabin: flightCabin(f.cabin),
    maxStops: f.stops,
  });
  return { ...f, ...link };
}

function attachHotelLink(h: Hotel, checkIn?: string, checkOut?: string, adults?: number): Hotel {
  if (h.booking_link) return h;
  const link = bookingHotelLink({
    hotelName: h.name,
    city: h.city,
    checkIn,
    checkOut,
    adults,
    minStars: h.rating,
    priceMin: h.price_per_night ? Math.max(0, h.price_per_night - 25) : undefined,
    priceMax: h.price_per_night ? h.price_per_night + 60 : undefined,
  });
  return { ...h, ...link };
}

function attachActivityLink(a: Activity): Activity {
  if (a.booking_link) return a;
  const link = activityLink(a.name, a.city);
  return { ...a, ...link };
}

function attachTransportLink(t: TransportLeg, date?: string): TransportLeg {
  if (t.booking_link) return t;
  const link = transportLink(t.mode, t.from, t.to, date);
  return { ...t, ...link };
}

function mergeFlights(ai: Flight[], real: Flight[]): Flight[] {
  const seen = new Set<string>();
  const out: Flight[] = [];
  for (const list of [real, ai]) {
    for (const f of list) {
      const key = `${f.airline}-${f.from}-${f.to}-${Math.round(f.price / 10) * 10}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(f);
    }
  }
  return out.sort((a, b) => a.price - b.price);
}

function mergeHotels(ai: Hotel[], real: Hotel[]): Hotel[] {
  const seen = new Set<string>();
  const out: Hotel[] = [];
  for (const list of [real, ai]) {
    for (const h of list) {
      const key = h.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(h);
    }
  }
  return out;
}

function mergeTransport(ai: TransportLeg[], real: TransportLeg[]): TransportLeg[] {
  const seen = new Set<string>();
  const out: TransportLeg[] = [];
  for (const list of [ai, real]) {
    for (const t of list) {
      const key = `${t.mode}-${t.from}-${t.to}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
  }
  return out;
}

function fallbackPlan(query: string): TripPlan {
  const dest = guessDestination(query);
  const days = guessDays(query) ?? 7;
  const budget = guessBudget(query) ?? 1000;
  const origin = guessOrigin(query) ?? "Paris";

  return {
    destination: dest,
    origin,
    duration_days: days,
    travelers: 2,
    budget_total: budget,
    currency: "EUR",
    summary: `Voyage de ${days} jours à ${dest} avec un budget de ${budget}€ depuis ${origin}. (Mode démo — configurez ANTHROPIC_API_KEY pour des plans IA personnalisés.)`,
    options: [
      {
        type: "cheap",
        price: Math.round(budget * 0.75),
        transport: [
          {
            mode: "flight",
            from: origin,
            to: dest,
            duration: "Variable",
            price: Math.round(budget * 0.35),
            notes: "Low-cost",
          },
        ],
        hotels: [
          {
            name: `Auberge ${dest}`,
            city: dest,
            nights: Math.max(1, days - 1),
            price_per_night: 35,
            rating: 3,
            tags: ["économique"],
          },
        ],
        activities: [
          { name: "Visite libre du centre historique", price: 0, duration: "3h" },
          { name: "Marché local", price: 15, duration: "2h" },
        ],
      },
      {
        type: "balanced",
        price: budget,
        transport: [
          {
            mode: "flight",
            from: origin,
            to: dest,
            duration: "Variable",
            price: Math.round(budget * 0.4),
            notes: "Compagnie régulière",
          },
        ],
        hotels: [
          {
            name: `Hôtel central ${dest}`,
            city: dest,
            nights: Math.max(1, days - 1),
            price_per_night: 80,
            rating: 4,
            tags: ["confortable"],
          },
        ],
        activities: [
          { name: "Tour guidé de la ville", price: 35, duration: "3h" },
          { name: "Excursion d'une journée", price: 60, duration: "8h" },
          { name: "Dîner gastronomique", price: 50, duration: "2h" },
        ],
      },
      {
        type: "luxury",
        price: Math.round(budget * 1.6),
        transport: [
          {
            mode: "flight",
            from: origin,
            to: dest,
            duration: "Variable",
            price: Math.round(budget * 0.6),
            notes: "Business class",
          },
        ],
        hotels: [
          {
            name: `Resort 5★ ${dest}`,
            city: dest,
            nights: Math.max(1, days - 1),
            price_per_night: 220,
            rating: 5,
            tags: ["luxe", "spa"],
          },
        ],
        activities: [
          { name: "Visite privée avec guide", price: 200, duration: "4h" },
          { name: "Expérience gastronomique étoilée", price: 180, duration: "3h" },
        ],
      },
    ],
    itinerary: Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      city: dest,
      schedule: [
        {
          time: "09:00",
          title: i === 0 ? "Arrivée et installation" : "Petit-déjeuner local",
          location: dest,
        },
        { time: "11:00", title: i === 0 ? "Première promenade" : "Visite culturelle", location: dest },
        { time: "13:00", title: "Déjeuner", location: dest },
        { time: "15:00", title: "Activité de l'après-midi", location: dest },
        { time: "19:30", title: "Dîner et soirée", location: dest },
      ],
    })),
    budget_breakdown: {
      transport: Math.round(budget * 0.4),
      hotel: Math.round(budget * 0.3),
      food: Math.round(budget * 0.2),
      activities: Math.round(budget * 0.1),
    },
    tips: [
      "Réservez vols et hôtels 6-8 semaines à l'avance pour les meilleurs prix.",
      "Prévoyez une carte bancaire sans frais à l'étranger.",
      "Téléchargez les cartes hors-ligne avant de partir.",
      "Gardez 10% du budget en réserve pour les imprévus.",
    ],
  };
}

function guessDestination(q: string): string {
  const known = [
    "Japon", "Japan", "Tokyo", "Italie", "Italy", "Rome", "Espagne", "Spain",
    "Barcelone", "Thaïlande", "Thailand", "Bangkok", "Bali", "New York",
    "Lisbonne", "Lisbon", "Marrakech", "Maroc", "Grèce", "Greece", "Athènes",
    "Islande", "Iceland",
  ];
  for (const k of known) {
    if (new RegExp(k, "i").test(q)) return k;
  }
  return "Destination";
}

function guessOrigin(q: string): string | null {
  const m = q.match(/depuis\s+([A-ZÀ-Ÿ][a-zà-ÿ-]+)/i);
  return m ? m[1] : null;
}

function guessDays(q: string): number | null {
  const m = q.match(/(\d+)\s*(jours|days|j\b)/i);
  return m ? parseInt(m[1], 10) : null;
}

function guessBudget(q: string): number | null {
  const m = q.match(/(\d{3,6})\s*(€|euros?|EUR|usd|\$)/i);
  return m ? parseInt(m[1], 10) : null;
}
