import type { LinkSource } from "./types";

type LinkBundle = {
  booking_link: string;
  affiliate_url?: string;
  fallback_link: string;
  source: LinkSource;
};

const CITY_TO_IATA: Record<string, string> = {
  paris: "PAR",
  lyon: "LYS",
  marseille: "MRS",
  toulouse: "TLS",
  nice: "NCE",
  bordeaux: "BOD",
  nantes: "NTE",
  strasbourg: "SXB",
  london: "LON",
  londres: "LON",
  amsterdam: "AMS",
  bruxelles: "BRU",
  brussels: "BRU",
  berlin: "BER",
  munich: "MUC",
  rome: "ROM",
  milan: "MIL",
  venise: "VCE",
  venice: "VCE",
  naples: "NAP",
  barcelone: "BCN",
  barcelona: "BCN",
  madrid: "MAD",
  seville: "SVQ",
  lisbonne: "LIS",
  lisbon: "LIS",
  porto: "OPO",
  athenes: "ATH",
  athens: "ATH",
  istanbul: "IST",
  marrakech: "RAK",
  casablanca: "CMN",
  tunis: "TUN",
  geneva: "GVA",
  geneve: "GVA",
  zurich: "ZRH",
  vienne: "VIE",
  vienna: "VIE",
  prague: "PRG",
  budapest: "BUD",
  copenhague: "CPH",
  copenhagen: "CPH",
  stockholm: "STO",
  oslo: "OSL",
  helsinki: "HEL",
  dublin: "DUB",
  reykjavik: "REK",
  "new york": "NYC",
  "los angeles": "LAX",
  "san francisco": "SFO",
  miami: "MIA",
  chicago: "CHI",
  toronto: "YTO",
  montreal: "YMQ",
  mexico: "MEX",
  tokyo: "TYO",
  osaka: "OSA",
  kyoto: "UKY",
  bangkok: "BKK",
  singapour: "SIN",
  singapore: "SIN",
  bali: "DPS",
  denpasar: "DPS",
  dubai: "DXB",
  "kuala lumpur": "KUL",
  hong: "HKG",
  hongkong: "HKG",
  sydney: "SYD",
  melbourne: "MEL",
  auckland: "AKL",
  "cape town": "CPT",
  "le cap": "CPT",
  capetown: "CPT",
  caire: "CAI",
  cairo: "CAI",
};

function normalizeCity(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, "")
    .trim()
    .toLowerCase();
}

function iata(city: string): string | null {
  const c = normalizeCity(city);
  if (/^[a-z]{3}$/.test(c)) return c.toUpperCase();
  if (CITY_TO_IATA[c]) return CITY_TO_IATA[c];
  for (const key of Object.keys(CITY_TO_IATA)) {
    if (c.includes(key) || key.includes(c)) return CITY_TO_IATA[key];
  }
  return null;
}

function slug(s: string): string {
  return normalizeCity(s).replace(/\s+/g, "-");
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
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
}

function dateYYMMDD(d?: string): string | undefined {
  if (!d) return undefined;
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  return `${m[1].slice(2)}${m[2]}${m[3]}`;
}

// ============================================================
//  FLIGHTS
// ============================================================

export interface FlightLinkArgs {
  origin?: string;
  destination: string;
  departDate?: string;
  returnDate?: string;
  adults?: number;
  cabin?: "economy" | "premiumeconomy" | "business" | "first";
  maxStops?: number;
}

export function skyscannerFlightLink(args: FlightLinkArgs): LinkBundle {
  const origIata = (args.origin ? iata(args.origin) : null) ?? "PAR";
  const destIata = iata(args.destination) ?? slug(args.destination).slice(0, 3).toUpperCase();
  const dep = dateYYMMDD(args.departDate);
  const ret = dateYYMMDD(args.returnDate);
  let url = `https://www.skyscanner.fr/transport/flights/${origIata.toLowerCase()}/${destIata.toLowerCase()}/`;
  if (dep) {
    url += `${dep}/`;
    if (ret) url += `${ret}/`;
  }
  const u = new URL(url);
  u.searchParams.set("adults", String(args.adults ?? 1));
  u.searchParams.set("cabinclass", args.cabin ?? "economy");
  if (args.maxStops != null) u.searchParams.set("stops", String(args.maxStops));
  u.searchParams.set("preferdirects", "false");

  const aff = process.env.SKYSCANNER_AFFILIATE_ID
    ? appendIfSet(u.toString(), { associateid: process.env.SKYSCANNER_AFFILIATE_ID })
    : undefined;

  return {
    booking_link: u.toString(),
    affiliate_url: aff,
    fallback_link: googleSearch(`vols ${args.origin ?? "Paris"} ${args.destination} ${args.departDate ?? ""}`),
    source: "skyscanner",
  };
}

export function googleFlightsLink(args: FlightLinkArgs): LinkBundle {
  const q = `flights from ${args.origin ?? "Paris"} to ${args.destination} ${args.departDate ?? ""} ${args.returnDate ?? ""}`.trim();
  return {
    booking_link: `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`,
    fallback_link: googleSearch(`flights ${args.origin ?? "Paris"} to ${args.destination}`),
    source: "google-flights",
  };
}

export function kayakFlightLink(args: FlightLinkArgs): LinkBundle {
  const origIata = (args.origin ? iata(args.origin) : null) ?? "PAR";
  const destIata = iata(args.destination) ?? "";
  const dep = dateOnly(args.departDate);
  const ret = dateOnly(args.returnDate);
  let path = `${origIata}-${destIata}`;
  if (dep) path += `/${dep}`;
  if (ret) path += `/${ret}`;
  const url = `https://www.kayak.fr/flights/${path}?sort=price_a`;
  return {
    booking_link: url,
    fallback_link: googleSearch(`kayak vols ${args.destination}`),
    source: "fallback",
  };
}

// ============================================================
//  HOTELS
// ============================================================

export interface HotelLinkArgs {
  hotelName?: string;
  city: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  rooms?: number;
  minStars?: number;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
}

export function bookingHotelLink(args: HotelLinkArgs): LinkBundle {
  const q = args.hotelName ? `${args.hotelName} ${args.city}` : args.city;
  const url = new URL("https://www.booking.com/searchresults.html");
  url.searchParams.set("ss", q);
  if (args.checkIn) url.searchParams.set("checkin", dateOnly(args.checkIn) ?? args.checkIn);
  if (args.checkOut) url.searchParams.set("checkout", dateOnly(args.checkOut) ?? args.checkOut);
  url.searchParams.set("group_adults", String(args.adults ?? 2));
  url.searchParams.set("group_children", "0");
  url.searchParams.set("no_rooms", String(args.rooms ?? 1));
  url.searchParams.set("order", "popularity");
  url.searchParams.set("selected_currency", args.currency ?? "EUR");

  const filters: string[] = [];
  if (args.minStars) filters.push(`class=${args.minStars}`);
  if (args.priceMin != null && args.priceMax != null) {
    filters.push(`price=EUR-${args.priceMin}-${args.priceMax}-1`);
  } else if (args.priceMax != null) {
    filters.push(`price=EUR-min-${args.priceMax}-1`);
  }
  if (filters.length) url.searchParams.set("nflt", filters.join(";"));

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

export function airbnbLink(args: HotelLinkArgs): LinkBundle {
  const path = `/s/${encodeURIComponent(args.city)}/homes`;
  const url = new URL(`https://www.airbnb.fr${path}`);
  if (args.checkIn) url.searchParams.set("checkin", dateOnly(args.checkIn) ?? args.checkIn);
  if (args.checkOut) url.searchParams.set("checkout", dateOnly(args.checkOut) ?? args.checkOut);
  url.searchParams.set("adults", String(args.adults ?? 2));
  if (args.priceMin != null) url.searchParams.set("price_min", String(args.priceMin));
  if (args.priceMax != null) url.searchParams.set("price_max", String(args.priceMax));
  url.searchParams.set("display_currency", args.currency ?? "EUR");
  return {
    booking_link: url.toString(),
    fallback_link: googleSearch(`airbnb ${args.city}`),
    source: "airbnb",
  };
}

export function expediaHotelLink(args: HotelLinkArgs): LinkBundle {
  const url = new URL("https://www.expedia.fr/Hotel-Search");
  url.searchParams.set("destination", args.city);
  if (args.checkIn) url.searchParams.set("startDate", dateOnly(args.checkIn) ?? args.checkIn);
  if (args.checkOut) url.searchParams.set("endDate", dateOnly(args.checkOut) ?? args.checkOut);
  url.searchParams.set("adults", String(args.adults ?? 2));
  if (args.priceMin != null) url.searchParams.set("priceMin", String(args.priceMin));
  if (args.priceMax != null) url.searchParams.set("priceMax", String(args.priceMax));
  if (args.minStars) url.searchParams.set("starRating", String(args.minStars));
  return {
    booking_link: url.toString(),
    fallback_link: googleSearch(`expedia ${args.city} hotels`),
    source: "expedia",
  };
}

export function hotelsComLink(args: HotelLinkArgs): LinkBundle {
  const url = new URL("https://fr.hotels.com/Hotel-Search");
  url.searchParams.set("destination", args.city);
  if (args.checkIn) url.searchParams.set("startDate", dateOnly(args.checkIn) ?? args.checkIn);
  if (args.checkOut) url.searchParams.set("endDate", dateOnly(args.checkOut) ?? args.checkOut);
  url.searchParams.set("adults", String(args.adults ?? 2));
  return {
    booking_link: url.toString(),
    fallback_link: googleSearch(`hotels.com ${args.city}`),
    source: "fallback",
  };
}

// ============================================================
//  REVIEWS
// ============================================================

export function tripadvisorLink(query: string): LinkBundle {
  const url = `https://www.tripadvisor.fr/Search?q=${encodeURIComponent(query)}`;
  return {
    booking_link: url,
    fallback_link: googleSearch(`${query} tripadvisor`),
    source: "tripadvisor",
  };
}

// ============================================================
//  TRANSPORT
// ============================================================

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

export function flixbusLink(from: string, to: string, date?: string): LinkBundle {
  const url = new URL("https://global.flixbus.com/");
  url.searchParams.set("departureCity", from);
  url.searchParams.set("arrivalCity", to);
  if (date) url.searchParams.set("rideDate", dateOnly(date) ?? date);
  return {
    booking_link: url.toString(),
    fallback_link: googleSearch(`flixbus ${from} ${to}`),
    source: "fallback",
  };
}

// ============================================================
//  ACTIVITIES
// ============================================================

export function activityLink(name: string, city?: string): LinkBundle {
  const q = `${name}${city ? " " + city : ""}`;
  const url = new URL("https://www.getyourguide.fr/s/");
  url.searchParams.set("q", q);
  return {
    booking_link: url.toString(),
    fallback_link: googleSearch(`${q} billets`),
    source: "fallback",
  };
}

export function viatorLink(name: string, city?: string): LinkBundle {
  const q = `${name}${city ? " " + city : ""}`;
  return {
    booking_link: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(q)}`,
    fallback_link: googleSearch(`viator ${q}`),
    source: "fallback",
  };
}

export function transportLink(mode: string, from: string, to: string, date?: string): LinkBundle {
  const m = mode.toLowerCase();
  if (m.includes("train")) return sncfConnectLink(from, to, date);
  if (m.includes("bus")) return flixbusLink(from, to, date);
  if (m.includes("flight") || m.includes("vol") || m.includes("avion"))
    return skyscannerFlightLink({ origin: from, destination: to, departDate: date });
  if (m.includes("ferry")) return omioLink(from, to, date);
  return rome2rioLink(from, to);
}

// ============================================================
//  COMPARISON BUNDLES — open the same search on N partner sites
// ============================================================

export interface PartnerLink {
  label: string;
  url: string;
  emoji: string;
}

export function flightComparison(args: FlightLinkArgs): PartnerLink[] {
  return [
    { label: "Skyscanner", emoji: "🛫", url: skyscannerFlightLink(args).affiliate_url ?? skyscannerFlightLink(args).booking_link },
    { label: "Google Flights", emoji: "🔎", url: googleFlightsLink(args).booking_link },
    { label: "Kayak", emoji: "🌐", url: kayakFlightLink(args).booking_link },
  ];
}

export function hotelComparison(args: HotelLinkArgs): PartnerLink[] {
  return [
    { label: "Booking", emoji: "🏨", url: bookingHotelLink(args).affiliate_url ?? bookingHotelLink(args).booking_link },
    { label: "Airbnb", emoji: "🏡", url: airbnbLink(args).booking_link },
    { label: "Expedia", emoji: "🌍", url: expediaHotelLink(args).booking_link },
    { label: "Hotels.com", emoji: "🛎", url: hotelsComLink(args).booking_link },
  ];
}

export function transportComparison(from: string, to: string, date?: string): PartnerLink[] {
  return [
    { label: "SNCF Connect", emoji: "🚆", url: sncfConnectLink(from, to, date).booking_link },
    { label: "Omio", emoji: "🚌", url: omioLink(from, to, date).booking_link },
    { label: "FlixBus", emoji: "🚍", url: flixbusLink(from, to, date).booking_link },
    { label: "Rome2Rio", emoji: "🗺", url: rome2rioLink(from, to).booking_link },
  ];
}
