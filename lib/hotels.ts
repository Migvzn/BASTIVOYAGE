import type { Hotel } from "./types";
import { bookingHotelLink, airbnbLink } from "./links";

export interface HotelQuery {
  city: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  nights?: number;
  budgetHint?: number;
  tier?: "cheap" | "balanced" | "luxury";
}

async function searchRapidApiBooking(q: HotelQuery): Promise<Hotel[] | null> {
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_BOOKING_HOST ?? "booking-com.p.rapidapi.com";
  if (!key) return null;
  try {
    const destUrl = new URL(`https://${host}/v1/hotels/locations`);
    destUrl.searchParams.set("locale", "fr");
    destUrl.searchParams.set("name", q.city);
    const destRes = await fetch(destUrl.toString(), {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host },
    });
    if (!destRes.ok) return null;
    const destJson: any = await destRes.json();
    const dest = Array.isArray(destJson) ? destJson[0] : destJson?.data?.[0];
    if (!dest) return null;

    const url = new URL(`https://${host}/v1/hotels/search`);
    url.searchParams.set("dest_id", String(dest.dest_id ?? dest.id));
    url.searchParams.set("dest_type", String(dest.dest_type ?? "city"));
    url.searchParams.set("checkin_date", q.checkIn ?? defaultDate(30));
    url.searchParams.set("checkout_date", q.checkOut ?? defaultDate(30 + (q.nights ?? 3)));
    url.searchParams.set("adults_number", String(q.adults ?? 1));
    url.searchParams.set("order_by", "popularity");
    url.searchParams.set("locale", "fr");
    url.searchParams.set("filter_by_currency", "EUR");
    url.searchParams.set("units", "metric");
    url.searchParams.set("room_number", "1");
    url.searchParams.set("page_number", "0");

    const res = await fetch(url.toString(), {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const results: any[] = json?.result ?? json?.data ?? [];
    return results.slice(0, 8).map((r) => parseBookingHotel(r, q)).filter(Boolean) as Hotel[];
  } catch {
    return null;
  }
}

function parseBookingHotel(r: any, q: HotelQuery): Hotel | null {
  try {
    const name = r.hotel_name ?? r.name ?? "Hôtel";
    const price = Number(
      r.min_total_price ?? r.price_breakdown?.gross_price ?? r.composite_price_breakdown?.gross_amount?.value ?? 0,
    );
    const nights = q.nights ?? 3;
    const link = bookingHotelLink({
      hotelName: name,
      city: q.city,
      checkIn: q.checkIn,
      checkOut: q.checkOut,
      adults: q.adults,
    });
    return {
      name,
      city: q.city,
      nights,
      price_per_night: nights > 0 ? Math.round(price / nights) : Math.round(price),
      rating: r.review_score ? Math.round(Number(r.review_score) / 2) : undefined,
      reviews_count: r.review_nr ?? undefined,
      tags: r.accommodation_type_name ? [String(r.accommodation_type_name)] : [],
      image_url: r.max_photo_url ?? r.main_photo_url,
      lat: r.latitude,
      lng: r.longitude,
      ...link,
    };
  } catch {
    return null;
  }
}

function defaultDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function tierTags(tier?: HotelQuery["tier"]): string[] {
  if (tier === "luxury") return ["luxe", "spa", "vue", "service premium"];
  if (tier === "cheap") return ["économique", "bien situé", "wifi"];
  return ["confortable", "petit-déjeuner", "bien noté"];
}

function priceForTier(tier: HotelQuery["tier"], budgetHint?: number): number {
  if (tier === "luxury") return budgetHint ? Math.max(180, Math.round(budgetHint * 0.18)) : 220;
  if (tier === "cheap") return budgetHint ? Math.max(28, Math.round(budgetHint * 0.04)) : 45;
  return budgetHint ? Math.max(70, Math.round(budgetHint * 0.09)) : 95;
}

function mockHotels(q: HotelQuery): Hotel[] {
  const city = q.city;
  const nights = q.nights ?? 3;
  const adults = q.adults ?? 2;
  const tiers: HotelQuery["tier"][] = ["cheap", "balanced", "luxury"];
  const names: Record<string, string[]> = {
    cheap: [`Auberge Centrale ${city}`, `${city} Hostel & Bar`, `Smart Stay ${city}`],
    balanced: [`Hôtel des Voyageurs ${city}`, `Boutique ${city} Center`, `Le Petit ${city}`],
    luxury: [`Grand Hôtel ${city}`, `Palace ${city} Riverside`, `${city} Royal Suites`],
  };
  const ratings: Record<string, number> = { cheap: 3, balanced: 4, luxury: 5 };
  const out: Hotel[] = [];
  for (const t of tiers) {
    const list = names[t!] ?? [];
    for (let i = 0; i < list.length; i++) {
      const name = list[i];
      const price = Math.round(priceForTier(t, q.budgetHint) * (1 + (i - 1) * 0.08));
      const link = bookingHotelLink({
        hotelName: name,
        city,
        checkIn: q.checkIn,
        checkOut: q.checkOut,
        adults,
      });
      out.push({
        name,
        city,
        nights,
        price_per_night: price,
        rating: ratings[t!],
        reviews_count: 200 + Math.round(Math.random() * 1800),
        tags: tierTags(t),
        ...link,
      });
    }
  }
  return out;
}

export async function searchHotels(q: HotelQuery): Promise<{
  hotels: Hotel[];
  airbnb_search_link: string;
  source: "rapidapi-booking" | "mock";
}> {
  const real = await searchRapidApiBooking(q);
  const hotels = real && real.length > 0 ? real : mockHotels(q);
  const airbnb = airbnbLink({
    city: q.city,
    checkIn: q.checkIn,
    checkOut: q.checkOut,
    adults: q.adults,
  });
  return {
    hotels,
    airbnb_search_link: airbnb.booking_link,
    source: real && real.length > 0 ? "rapidapi-booking" : "mock",
  };
}
