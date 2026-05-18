export type BudgetMode = "cheap" | "balanced" | "luxury";

export type LinkSource =
  | "skyscanner"
  | "amadeus"
  | "kiwi"
  | "google-flights"
  | "booking"
  | "airbnb"
  | "expedia"
  | "tripadvisor"
  | "google-maps"
  | "google-search"
  | "rome2rio"
  | "omio"
  | "sncf"
  | "fallback";

export interface BookingRef {
  booking_link: string;
  affiliate_url?: string;
  fallback_link: string;
  source: LinkSource;
}

export interface Flight extends BookingRef {
  airline: string;
  flight_number?: string;
  from: string;
  to: string;
  departure?: string;
  arrival?: string;
  duration: string;
  stops: number;
  price: number;
  cabin?: string;
}

export interface TransportLeg extends Partial<BookingRef> {
  mode: string;
  from: string;
  to: string;
  duration: string;
  price: number;
  carrier?: string;
  notes?: string;
}

export interface Review {
  author?: string;
  rating: number;
  text: string;
  date?: string;
  source?: string;
}

export interface Hotel extends Partial<BookingRef> {
  name: string;
  city: string;
  nights: number;
  price_per_night: number;
  rating?: number;
  reviews_count?: number;
  tags?: string[];
  image_url?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  reviews?: Review[];
}

export interface Activity extends Partial<BookingRef> {
  name: string;
  city?: string;
  price: number;
  duration?: string;
  description?: string;
  rating?: number;
  reviews_count?: number;
  lat?: number;
  lng?: number;
  tags?: string[];
}

export interface TripOption {
  type: BudgetMode;
  price: number;
  total_price?: number;
  transport: TransportLeg[];
  hotels: Hotel[];
  activities: Activity[];
  flights?: Flight[];
}

export interface DaySchedule {
  time?: string;
  title: string;
  description?: string;
  location?: string;
  lat?: number;
  lng?: number;
}

export interface ItineraryDay {
  day: number;
  city?: string;
  schedule: DaySchedule[];
}

export interface BudgetBreakdown {
  transport: number;
  hotel: number;
  food: number;
  activities: number;
}

export interface TripPlan {
  destination: string;
  destination_country?: string;
  destination_lat?: number;
  destination_lng?: number;
  origin?: string;
  duration_days?: number;
  start_date?: string;
  end_date?: string;
  travelers?: number;
  budget_total: number;
  currency?: string;
  options: TripOption[];
  flights?: Flight[];
  hotels?: Hotel[];
  activities?: Activity[];
  transport?: TransportLeg[];
  itinerary: ItineraryDay[];
  budget_breakdown: BudgetBreakdown;
  tips: string[];
  summary?: string;
  generated_at?: string;
  enrichment?: {
    flights?: string;
    hotels?: string;
    reviews?: string;
    transport?: string;
  };
}
