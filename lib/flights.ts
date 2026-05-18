import type { Flight } from "./types";
import { skyscannerFlightLink, googleFlightsLink } from "./links";

export interface FlightQuery {
  origin: string;
  destination: string;
  departDate?: string;
  returnDate?: string;
  adults?: number;
  budgetHint?: number;
}

interface AmadeusToken {
  access_token: string;
  expires_at: number;
}

let amadeusToken: AmadeusToken | null = null;

async function getAmadeusToken(): Promise<string | null> {
  const id = process.env.AMADEUS_CLIENT_ID;
  const secret = process.env.AMADEUS_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (amadeusToken && amadeusToken.expires_at > Date.now()) return amadeusToken.access_token;

  try {
    const res = await fetch("https://api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(secret)}`,
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    amadeusToken = {
      access_token: json.access_token,
      expires_at: Date.now() + (json.expires_in ?? 1500) * 1000,
    };
    return amadeusToken.access_token;
  } catch {
    return null;
  }
}

async function iataCodeFor(city: string): Promise<string | null> {
  const token = await getAmadeusToken();
  if (!token) return null;
  try {
    const url = new URL("https://api.amadeus.com/v1/reference-data/locations");
    url.searchParams.set("subType", "CITY,AIRPORT");
    url.searchParams.set("keyword", city);
    url.searchParams.set("page[limit]", "1");
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    return json?.data?.[0]?.iataCode ?? null;
  } catch {
    return null;
  }
}

async function searchAmadeus(q: FlightQuery): Promise<Flight[] | null> {
  const token = await getAmadeusToken();
  if (!token) return null;
  const [originCode, destCode] = await Promise.all([
    iataCodeFor(q.origin),
    iataCodeFor(q.destination),
  ]);
  if (!originCode || !destCode) return null;

  try {
    const url = new URL("https://api.amadeus.com/v2/shopping/flight-offers");
    url.searchParams.set("originLocationCode", originCode);
    url.searchParams.set("destinationLocationCode", destCode);
    url.searchParams.set("departureDate", q.departDate ?? defaultDepart());
    if (q.returnDate) url.searchParams.set("returnDate", q.returnDate);
    url.searchParams.set("adults", String(q.adults ?? 1));
    url.searchParams.set("currencyCode", "EUR");
    url.searchParams.set("max", "8");
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const offers: any[] = json?.data ?? [];
    return offers.map((o: any) => parseAmadeusOffer(o, q)).filter(Boolean) as Flight[];
  } catch {
    return null;
  }
}

function parseAmadeusOffer(o: any, q: FlightQuery): Flight | null {
  try {
    const it = o.itineraries?.[0];
    if (!it) return null;
    const segs = it.segments ?? [];
    const first = segs[0];
    const last = segs[segs.length - 1];
    const carriers = new Set<string>(segs.map((s: any) => s.carrierCode));
    const airline = Array.from(carriers).join(", ");
    const price = Number(o.price?.grandTotal ?? o.price?.total ?? 0);
    const link = skyscannerFlightLink({
      origin: q.origin,
      destination: q.destination,
      departDate: q.departDate,
      returnDate: q.returnDate,
    });
    return {
      airline,
      flight_number: `${first.carrierCode}${first.number}`,
      from: first.departure?.iataCode ?? q.origin,
      to: last.arrival?.iataCode ?? q.destination,
      departure: first.departure?.at,
      arrival: last.arrival?.at,
      duration: humanDuration(it.duration ?? ""),
      stops: Math.max(segs.length - 1, 0),
      price: Math.round(price),
      cabin: o.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin,
      ...link,
    };
  } catch {
    return null;
  }
}

function humanDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  const h = m[1] ?? "0";
  const min = m[2] ?? "0";
  return `${h}h ${min}m`;
}

function defaultDepart(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function mockFlights(q: FlightQuery): Flight[] {
  const base = q.budgetHint ? Math.max(80, Math.round(q.budgetHint * 0.35)) : 280;
  const link = () =>
    skyscannerFlightLink({
      origin: q.origin,
      destination: q.destination,
      departDate: q.departDate,
      returnDate: q.returnDate,
    });
  const gflink = googleFlightsLink({
    origin: q.origin,
    destination: q.destination,
    departDate: q.departDate,
  });
  return [
    {
      airline: "Transavia",
      flight_number: "TO 3142",
      from: q.origin,
      to: q.destination,
      duration: "2h 35m",
      stops: 0,
      price: Math.round(base * 0.85),
      cabin: "Economy",
      ...link(),
    },
    {
      airline: "Air France",
      flight_number: "AF 1742",
      from: q.origin,
      to: q.destination,
      duration: "2h 50m",
      stops: 0,
      price: base + 40,
      cabin: "Economy",
      ...link(),
    },
    {
      airline: "Lufthansa",
      flight_number: "LH 1042",
      from: q.origin,
      to: q.destination,
      duration: "5h 10m",
      stops: 1,
      price: Math.round(base * 0.78),
      cabin: "Economy",
      ...gflink,
    },
    {
      airline: "British Airways",
      flight_number: "BA 318",
      from: q.origin,
      to: q.destination,
      duration: "3h 20m",
      stops: 0,
      price: base + 90,
      cabin: "Premium Economy",
      ...link(),
    },
  ];
}

export async function searchFlights(q: FlightQuery): Promise<{
  flights: Flight[];
  source: "amadeus" | "mock";
}> {
  if (!q.origin || !q.destination) {
    return { flights: [], source: "mock" };
  }
  const amadeus = await searchAmadeus(q);
  if (amadeus && amadeus.length > 0) {
    return { flights: amadeus, source: "amadeus" };
  }
  return { flights: mockFlights(q), source: "mock" };
}
