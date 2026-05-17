import type { TripPlan } from "./types";

export function extractJSON(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in response");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

export function normalizeTripPlan(data: unknown): TripPlan {
  const d = (data ?? {}) as Partial<TripPlan>;
  return {
    destination: d.destination ?? "Unknown",
    origin: d.origin,
    duration_days: d.duration_days,
    budget_total: Number(d.budget_total ?? 0),
    currency: d.currency ?? "EUR",
    options: Array.isArray(d.options) ? d.options : [],
    itinerary: Array.isArray(d.itinerary) ? d.itinerary : [],
    budget_breakdown: d.budget_breakdown ?? {
      transport: 0,
      hotel: 0,
      food: 0,
      activities: 0,
    },
    tips: Array.isArray(d.tips) ? d.tips : [],
    summary: d.summary,
  };
}
