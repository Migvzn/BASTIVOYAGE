import type {
  Activity,
  Flight,
  Hotel,
  TransportLeg,
  TripPlan,
  TripOption,
  BudgetMode,
  ItineraryDay,
} from "./types";

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

function num(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function arr<T>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function strOrUndef(v: any): string | undefined {
  return typeof v === "string" && v.length ? v : undefined;
}

function normFlight(f: any): Flight {
  return {
    airline: String(f?.airline ?? "Compagnie aérienne"),
    flight_number: strOrUndef(f?.flight_number),
    from: String(f?.from ?? ""),
    to: String(f?.to ?? ""),
    departure: strOrUndef(f?.departure),
    arrival: strOrUndef(f?.arrival),
    duration: String(f?.duration ?? "Variable"),
    stops: num(f?.stops, 0),
    price: num(f?.price, 0),
    cabin: strOrUndef(f?.cabin),
    booking_link: String(f?.booking_link ?? ""),
    fallback_link: String(f?.fallback_link ?? ""),
    source: (f?.source ?? "fallback") as Flight["source"],
    affiliate_url: strOrUndef(f?.affiliate_url),
  };
}

function normHotel(h: any): Hotel {
  return {
    name: String(h?.name ?? "Hôtel"),
    city: String(h?.city ?? ""),
    nights: num(h?.nights, 1),
    price_per_night: num(h?.price_per_night, 0),
    rating: h?.rating != null ? num(h.rating) : undefined,
    reviews_count: h?.reviews_count != null ? num(h.reviews_count) : undefined,
    tags: arr<string>(h?.tags).map(String),
    image_url: strOrUndef(h?.image_url),
    notes: strOrUndef(h?.notes),
    lat: h?.lat != null ? num(h.lat) : undefined,
    lng: h?.lng != null ? num(h.lng) : undefined,
  };
}

function normActivity(a: any): Activity {
  return {
    name: String(a?.name ?? "Activité"),
    city: strOrUndef(a?.city),
    price: num(a?.price, 0),
    duration: strOrUndef(a?.duration),
    description: strOrUndef(a?.description),
    rating: a?.rating != null ? num(a.rating) : undefined,
    reviews_count: a?.reviews_count != null ? num(a.reviews_count) : undefined,
    tags: arr<string>(a?.tags).map(String),
    lat: a?.lat != null ? num(a.lat) : undefined,
    lng: a?.lng != null ? num(a.lng) : undefined,
  };
}

function normTransport(t: any): TransportLeg {
  return {
    mode: String(t?.mode ?? "flight"),
    from: String(t?.from ?? ""),
    to: String(t?.to ?? ""),
    duration: String(t?.duration ?? "Variable"),
    price: num(t?.price, 0),
    carrier: strOrUndef(t?.carrier),
    notes: strOrUndef(t?.notes),
  };
}

function normOption(o: any): TripOption {
  const type = (["cheap", "balanced", "luxury"] as BudgetMode[]).includes(o?.type)
    ? (o.type as BudgetMode)
    : "balanced";
  return {
    type,
    price: num(o?.price, 0),
    total_price: o?.total_price != null ? num(o.total_price) : undefined,
    transport: arr<any>(o?.transport).map(normTransport),
    hotels: arr<any>(o?.hotels).map(normHotel),
    activities: arr<any>(o?.activities).map(normActivity),
    flights: arr<any>(o?.flights).map(normFlight),
  };
}

function normDay(d: any): ItineraryDay {
  return {
    day: num(d?.day, 0),
    city: strOrUndef(d?.city),
    schedule: arr<any>(d?.schedule).map((s) => ({
      time: strOrUndef(s?.time),
      title: String(s?.title ?? ""),
      description: strOrUndef(s?.description),
      location: strOrUndef(s?.location),
      lat: s?.lat != null ? num(s.lat) : undefined,
      lng: s?.lng != null ? num(s.lng) : undefined,
    })),
  };
}

export function normalizeTripPlan(data: unknown): TripPlan {
  const d = (data ?? {}) as any;
  return {
    destination: String(d.destination ?? "Unknown"),
    destination_country: strOrUndef(d.destination_country),
    origin: strOrUndef(d.origin),
    duration_days: d.duration_days != null ? num(d.duration_days) : undefined,
    start_date: strOrUndef(d.start_date),
    end_date: strOrUndef(d.end_date),
    travelers: d.travelers != null ? num(d.travelers) : undefined,
    budget_total: num(d.budget_total, 0),
    currency: strOrUndef(d.currency) ?? "EUR",
    summary: strOrUndef(d.summary),
    flights: arr<any>(d.flights).map(normFlight),
    hotels: arr<any>(d.hotels).map(normHotel),
    activities: arr<any>(d.activities).map(normActivity),
    transport: arr<any>(d.transport).map(normTransport),
    options: arr<any>(d.options).map(normOption),
    itinerary: arr<any>(d.itinerary).map(normDay),
    budget_breakdown: {
      transport: num(d?.budget_breakdown?.transport),
      hotel: num(d?.budget_breakdown?.hotel ?? d?.budget_breakdown?.hotels),
      food: num(d?.budget_breakdown?.food),
      activities: num(d?.budget_breakdown?.activities),
    },
    tips: arr<any>(d.tips).map(String),
  };
}
