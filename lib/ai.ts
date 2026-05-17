import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { extractJSON, normalizeTripPlan } from "./parser";
import type { TripPlan } from "./types";

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

export async function generateTripPlan(userQuery: string): Promise<TripPlan> {
  const client = getClient();
  if (!client) {
    return fallbackPlan(userQuery);
  }

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

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text block in response");
    }

    const parsed = extractJSON(textBlock.text);
    return normalizeTripPlan(parsed);
  } catch (err) {
    console.error("AI generation failed:", err);
    return fallbackPlan(userQuery);
  }
}

function fallbackPlan(query: string): TripPlan {
  const dest = guessDestination(query);
  const days = guessDays(query) ?? 7;
  const budget = guessBudget(query) ?? 1000;

  return {
    destination: dest,
    origin: "Paris",
    duration_days: days,
    budget_total: budget,
    currency: "EUR",
    summary: `Voyage de ${days} jours à ${dest} avec un budget de ${budget}€. (Mode démo — configurez ANTHROPIC_API_KEY pour des plans générés par IA.)`,
    options: [
      {
        type: "cheap",
        price: Math.round(budget * 0.75),
        transport: [
          {
            mode: "flight",
            from: "Paris",
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
            nights: days - 1,
            price_per_night: 35,
            rating: 3,
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
            from: "Paris",
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
            nights: days - 1,
            price_per_night: 80,
            rating: 4,
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
            from: "Paris",
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
            nights: days - 1,
            price_per_night: 220,
            rating: 5,
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
        {
          time: "11:00",
          title: i === 0 ? "Première promenade" : "Visite culturelle",
          location: dest,
        },
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
    "Japon",
    "Japan",
    "Tokyo",
    "Italie",
    "Italy",
    "Rome",
    "Espagne",
    "Spain",
    "Barcelone",
    "Thaïlande",
    "Thailand",
    "Bangkok",
    "Bali",
    "New York",
    "Lisbonne",
    "Lisbon",
    "Marrakech",
    "Maroc",
    "Grèce",
    "Greece",
    "Athènes",
    "Islande",
    "Iceland",
  ];
  for (const k of known) {
    if (new RegExp(k, "i").test(q)) return k;
  }
  return "Destination";
}

function guessDays(q: string): number | null {
  const m = q.match(/(\d+)\s*(jours|days|j\b)/i);
  return m ? parseInt(m[1], 10) : null;
}

function guessBudget(q: string): number | null {
  const m = q.match(/(\d{3,6})\s*(€|euros?|EUR|usd|\$)/i);
  return m ? parseInt(m[1], 10) : null;
}
