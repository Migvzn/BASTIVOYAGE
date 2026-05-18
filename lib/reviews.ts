import type { Review } from "./types";
import { tripadvisorLink } from "./links";

export interface PlaceLookup {
  name: string;
  city?: string;
}

interface PlaceInfo {
  rating?: number;
  reviews_count?: number;
  reviews: Review[];
  source: "google-places" | "mock";
  tripadvisor_link: string;
  lat?: number;
  lng?: number;
}

async function googlePlaces(p: PlaceLookup): Promise<PlaceInfo | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  try {
    const q = `${p.name}${p.city ? " " + p.city : ""}`;
    const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
    searchUrl.searchParams.set("input", q);
    searchUrl.searchParams.set("inputtype", "textquery");
    searchUrl.searchParams.set("fields", "place_id,geometry,name,rating,user_ratings_total");
    searchUrl.searchParams.set("key", key);
    const findRes = await fetch(searchUrl.toString());
    if (!findRes.ok) return null;
    const findJson: any = await findRes.json();
    const candidate = findJson?.candidates?.[0];
    if (!candidate?.place_id) return null;

    const detUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    detUrl.searchParams.set("place_id", candidate.place_id);
    detUrl.searchParams.set("fields", "name,rating,user_ratings_total,reviews,geometry");
    detUrl.searchParams.set("language", "fr");
    detUrl.searchParams.set("key", key);
    const detRes = await fetch(detUrl.toString());
    if (!detRes.ok) return null;
    const detJson: any = await detRes.json();
    const result = detJson?.result;
    if (!result) return null;

    const reviews: Review[] = (result.reviews ?? []).slice(0, 5).map((r: any) => ({
      author: r.author_name,
      rating: r.rating,
      text: r.text,
      date: r.relative_time_description,
      source: "google",
    }));

    return {
      rating: result.rating,
      reviews_count: result.user_ratings_total,
      reviews,
      source: "google-places",
      tripadvisor_link: tripadvisorLink(q).booking_link,
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
    };
  } catch {
    return null;
  }
}

const MOCK_TAGS = [
  "calme",
  "propre",
  "personnel accueillant",
  "bien situé",
  "vue",
  "petit-déjeuner copieux",
  "wifi rapide",
  "lit confortable",
];

const MOCK_AUTHORS = ["Marc", "Sophie", "Lucas", "Aïcha", "Yuki", "Dario", "Emma", "Karim"];

function mockReviews(p: PlaceLookup): PlaceInfo {
  const q = `${p.name}${p.city ? " " + p.city : ""}`;
  const seed = q.length;
  const rating = 3.8 + ((seed % 12) / 10);
  const count = 120 + (seed * 17) % 1800;
  const reviews: Review[] = Array.from({ length: 3 }, (_, i) => ({
    author: MOCK_AUTHORS[(seed + i) % MOCK_AUTHORS.length],
    rating: Math.max(3, Math.min(5, Math.round(rating + (i - 1) * 0.5))),
    text: [
      `Très bonne expérience à ${p.name}. ${MOCK_TAGS[(seed + i) % MOCK_TAGS.length]} et rapport qualité-prix correct.`,
      `Séjour agréable. Points forts: ${MOCK_TAGS[(seed + i + 2) % MOCK_TAGS.length]}, ${MOCK_TAGS[(seed + i + 4) % MOCK_TAGS.length]}.`,
      `Je recommande ${p.name}${p.city ? " à " + p.city : ""} pour un voyage ${i % 2 === 0 ? "en couple" : "en famille"}.`,
    ][i % 3],
    date: ["il y a 2 semaines", "le mois dernier", "il y a 3 mois"][i % 3],
    source: "mock",
  }));
  return {
    rating: Math.round(rating * 10) / 10,
    reviews_count: count,
    reviews,
    source: "mock",
    tripadvisor_link: tripadvisorLink(q).booking_link,
  };
}

export async function getReviews(p: PlaceLookup): Promise<PlaceInfo> {
  const real = await googlePlaces(p);
  return real ?? mockReviews(p);
}
