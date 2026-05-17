export type BudgetMode = "cheap" | "balanced" | "luxury";

export interface TransportLeg {
  mode: string;
  from: string;
  to: string;
  duration: string;
  price: number;
  notes?: string;
}

export interface Hotel {
  name: string;
  city: string;
  nights: number;
  price_per_night: number;
  rating?: number;
  notes?: string;
}

export interface Activity {
  name: string;
  city?: string;
  price: number;
  duration?: string;
  description?: string;
}

export interface TripOption {
  type: BudgetMode;
  price: number;
  transport: TransportLeg[];
  hotels: Hotel[];
  activities: Activity[];
}

export interface DaySchedule {
  time?: string;
  title: string;
  description?: string;
  location?: string;
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
  origin?: string;
  duration_days?: number;
  budget_total: number;
  currency?: string;
  options: TripOption[];
  itinerary: ItineraryDay[];
  budget_breakdown: BudgetBreakdown;
  tips: string[];
  summary?: string;
}
