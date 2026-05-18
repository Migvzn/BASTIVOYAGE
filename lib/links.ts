import type { LinkSource } from "./types";

type LinkBundle = {
  booking_link: string;
  affiliate_url?: string;
  fallback_link: string;
  source: LinkSource;
};

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function googleSearch(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function googleMapsLink(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function appendIfSet(url: string, params: Record<string, string | undefined>): string {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    if (v) u.searchParams.set(k, v);
  }
  return u.toString();
}

function dateOnly(d?: string): string | undefined {
  if (!d) return undefined;
  const m = d.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : undefined;
}

export function skyscannerFlightLink(args: {
  origin?: string;
  destination: string;
  departDate?: string;
  returnDate?: string;
}): LinkBundle {
  const dest = encodeURIComponent(args.destination);
  const orig = encodeURIComponent(args.origin ?? "Paris");
  const url = `https://www.skyscanner.fr/transport/flights-from/${slug(args.origin ?? "paris")}/${slug(args.destination)}/`;
  const direct = `https://www.skyscanner.fr/transport/flights/${slug(args.origin ?? "paris")}/${slug(args.destination)}/`;
  const aff = process.env.SKYSCANNER_AFFILIATE_ID
    ? appendIfSet(url, { associateid: process.env.SKYSCANNER_AFFILIATE_ID })
    : undefined;
  return {
    booking_link: direct,
    affiliate_url: aff,
    fallback_link: googleSearch(`vols ${orig} ${dest} ${args.departDate ?? ""}`),
    source: "skyscanner",
  };
}

export function googleFlightsLink(args: {
  origin?: string;
  destination: string;
  departDate?: string;
}): LinkBundle {
  const q = encodeURIComponent(
    `flights from ${args.origin ?? "Paris"} to ${args.destination} ${args.departDate ?? ""}`,
  );
  return {
    booking_link: `https://www.google.com/travel/flights?q=${q}`,
    fallback_link: googleSearch(`flights ${args.origin ?? "Paris"} to ${args.destination}`),
    source: "google-flights",
  };
}

export function bookingHotelLink(args: {
  hotelName: string;
  city: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}): LinkBundle {
  const q = `${args.hotelName} ${args.city}`;
  const url = new URL("https://www.booking.com/searchresults.html");
  url.searchParams.set("ss", q);
  if (args.checkIn) url.searchParams.set("checkin", dateOnly(args.checkIn) ?? args.checkIn);
  if (args.checkOut) url.searchParams.set("checkout", dateOnly(args.checkOut) ?? args.checkOut);
  if (args.adults) url.searchParams.set("group_adults", String(args.adults));
  const aff = process.env.BOOKING_AFFILIATE_ID
    ? appendIfSet(url.toString(), { aid: process.env.BOOKING_AFFILIATE_ID })
    : undefined;
  return {
    booking_link: url.toString(),
    affiliate_url: aff,
    fallback_link: googleSearch(`${q} booking.com`),
    source: "booking",
  };
}

export function airbnbLink(args: {
  city: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}): LinkBundle {
  const path = `/s/${encodeURIComponent(args.city)}/homes`;
  const url = new URL(`https://www.airbnb.fr${path}`);
  if (args.checkIn) url.searchParams.set("checkin", dateOnly(args.checkIn) ?? args.checkIn);
  if (args.checkOut) url.searchParams.set("checkout", dateOnly(args.checkOut) ?? args.checkOut);
  if (args.adults) url.searchParams.set("adults", String(args.adults));
  return {
    booking_link: url.toString(),
    fallback_link: googleSearch(`airbnb ${args.city}`),
    source: "airbnb",
  };
}

export function tripadvisorLink(query: string): LinkBundle {
  const url = `https://www.tripadvisor.fr/Search?q=${encodeURIComponent(query)}`;
  return {
    booking_link: url,
    fallback_link: googleSearch(`${query} tripadvisor`),
    source: "tripadvisor",
  };
}

export function rome2rioLink(from: string, to: string): LinkBundle {
  const url = `https://www.rome2rio.com/map/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
  return {
    booking_link: url,
    fallback_link: googleSearch(`${from} to ${to} transport`),
    source: "rome2rio",
  };
}

export function omioLink(from: string, to: string, date?: string): LinkBundle {
  const url = new URL("https://www.omio.fr/");
  url.searchParams.set("departureCity", from);
  url.searchParams.set("arrivalCity", to);
  if (date) url.searchParams.set("outboundDate", dateOnly(date) ?? date);
  return {
    booking_link: url.toString(),
    fallback_link: googleSearch(`omio ${from} ${to}`),
    source: "omio",
  };
}

export function sncfConnectLink(from: string, to: string, date?: string): LinkBundle {
  const url = new URL("https://www.sncf-connect.com/app/home/search");
  url.searchParams.set("origin", from);
  url.searchParams.set("destination", to);
  if (date) url.searchParams.set("outboundDate", dateOnly(date) ?? date);
  return {
    booking_link: url.toString(),
    fallback_link: googleSearch(`SNCF ${from} ${to}`),
    source: "sncf",
  };
}

export function activityLink(name: string, city?: string): LinkBundle {
  const q = `${name}${city ? " " + city : ""}`;
  return {
    booking_link: `https://www.getyourguide.fr/s/?q=${encodeURIComponent(q)}`,
    fallback_link: googleSearch(`${q} billets`),
    source: "google-search",
  };
}

export function transportLink(mode: string, from: string, to: string, date?: string): LinkBundle {
  const m = mode.toLowerCase();
  if (m.includes("train")) return sncfConnectLink(from, to, date);
  if (m.includes("flight") || m.includes("vol") || m.includes("avion"))
    return skyscannerFlightLink({ origin: from, destination: to, departDate: date });
  if (m.includes("bus") || m.includes("ferry")) return omioLink(from, to, date);
  return rome2rioLink(from, to);
}
