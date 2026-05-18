import { searchFlights } from "./flights";
import { searchHotels } from "./hotels";
import { skyscannerFlightLink, airbnbLink, bookingHotelLink } from "./links";
import type { Flight, Hotel } from "./types";

export interface DealRoute {
  slug: string;
  origin: string;
  destination: string;
  country: string;
  emoji: string;
  tagline: string;
  highlight: string;
}

export const POPULAR_ROUTES: DealRoute[] = [
  {
    slug: "paris-barcelone",
    origin: "Paris",
    destination: "Barcelone",
    country: "Espagne",
    emoji: "🇪🇸",
    tagline: "Week-end soleil & tapas",
    highlight: "Sagrada Família, plage de la Barceloneta, quartier Gothique",
  },
  {
    slug: "paris-rome",
    origin: "Paris",
    destination: "Rome",
    country: "Italie",
    emoji: "🇮🇹",
    tagline: "Histoire et dolce vita",
    highlight: "Colisée, Vatican, trastevere",
  },
  {
    slug: "paris-lisbonne",
    origin: "Paris",
    destination: "Lisbonne",
    country: "Portugal",
    emoji: "🇵🇹",
    tagline: "Tramways, fado et pastéis",
    highlight: "Alfama, Belém, Sintra",
  },
  {
    slug: "paris-marrakech",
    origin: "Paris",
    destination: "Marrakech",
    country: "Maroc",
    emoji: "🇲🇦",
    tagline: "Dépaysement à 3 heures de vol",
    highlight: "Jardin Majorelle, Jemaa el-Fnaa, Médina",
  },
  {
    slug: "paris-amsterdam",
    origin: "Paris",
    destination: "Amsterdam",
    country: "Pays-Bas",
    emoji: "🇳🇱",
    tagline: "Canaux, vélo et musées",
    highlight: "Rijksmuseum, Jordaan, croisière sur les canaux",
  },
  {
    slug: "paris-londres",
    origin: "Paris",
    destination: "Londres",
    country: "Royaume-Uni",
    emoji: "🇬🇧",
    tagline: "Eurostar et city break",
    highlight: "British Museum, Camden, Tower Bridge",
  },
  {
    slug: "paris-berlin",
    origin: "Paris",
    destination: "Berlin",
    country: "Allemagne",
    emoji: "🇩🇪",
    tagline: "Culture, nightlife, histoire",
    highlight: "Mur de Berlin, Kreuzberg, Museum Island",
  },
  {
    slug: "paris-athenes",
    origin: "Paris",
    destination: "Athènes",
    country: "Grèce",
    emoji: "🇬🇷",
    tagline: "Acropole et îles à portée",
    highlight: "Acropole, Plaka, escapade à Égine",
  },
  {
    slug: "paris-istanbul",
    origin: "Paris",
    destination: "Istanbul",
    country: "Turquie",
    emoji: "🇹🇷",
    tagline: "Deux continents, mille saveurs",
    highlight: "Sainte-Sophie, Grand Bazar, Bosphore",
  },
  {
    slug: "paris-prague",
    origin: "Paris",
    destination: "Prague",
    country: "Tchéquie",
    emoji: "🇨🇿",
    tagline: "Ville-musée à prix doux",
    highlight: "Pont Charles, Vieille Ville, château",
  },
];

export interface Deal {
  route: DealRoute;
  cheapest_flight: Flight | null;
  cheapest_hotel: Hotel | null;
  estimated_total_3d: number;
  airbnb_link: string;
  generated_at: string;
}

export function findRoute(slug: string): DealRoute | undefined {
  return POPULAR_ROUTES.find((r) => r.slug === slug);
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function buildDeal(route: DealRoute): Promise<Deal> {
  const depart = offsetDate(14);
  const ret = offsetDate(17);
  const [flights, hotels] = await Promise.all([
    searchFlights({
      origin: route.origin,
      destination: route.destination,
      departDate: depart,
      returnDate: ret,
      adults: 1,
      budgetHint: 400,
    }),
    searchHotels({
      city: route.destination,
      checkIn: depart,
      checkOut: ret,
      adults: 2,
      nights: 3,
      budgetHint: 400,
      tier: "cheap",
    }),
  ]);
  const cheapestFlight = [...flights.flights].sort((a, b) => a.price - b.price)[0] ?? null;
  const cheapestHotel = [...hotels.hotels].sort(
    (a, b) => a.price_per_night - b.price_per_night,
  )[0] ?? null;

  const flightRound = (cheapestFlight?.price ?? 150) * 2;
  const hotelTotal = (cheapestHotel?.price_per_night ?? 60) * 3;
  const estimated = flightRound + hotelTotal + 90;

  const ab = airbnbLink({
    city: route.destination,
    checkIn: depart,
    checkOut: ret,
    adults: 2,
  });

  return {
    route,
    cheapest_flight: cheapestFlight,
    cheapest_hotel: cheapestHotel,
    estimated_total_3d: Math.round(estimated),
    airbnb_link: ab.booking_link,
    generated_at: new Date().toISOString(),
  };
}

export async function buildAllDeals(): Promise<Deal[]> {
  const results = await Promise.all(POPULAR_ROUTES.map(buildDeal));
  return results.sort((a, b) => a.estimated_total_3d - b.estimated_total_3d);
}
