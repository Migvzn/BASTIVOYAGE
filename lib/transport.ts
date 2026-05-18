import type { TransportLeg } from "./types";
import { rome2rioLink, sncfConnectLink, omioLink, skyscannerFlightLink } from "./links";

export interface TransportQuery {
  from: string;
  to: string;
  date?: string;
}

function isLikelyEuropeanRail(from: string, to: string): boolean {
  const cities = (from + " " + to).toLowerCase();
  const eu = ["paris", "lyon", "marseille", "bordeaux", "london", "bruxelles", "amsterdam", "berlin", "munich", "milan", "rome", "barcelone", "madrid", "geneve", "zurich", "vienne"];
  let hits = 0;
  for (const c of eu) if (cities.includes(c)) hits++;
  return hits >= 2;
}

function mockMultimodal(q: TransportQuery): TransportLeg[] {
  const train = sncfConnectLink(q.from, q.to, q.date);
  const flight = skyscannerFlightLink({ origin: q.from, destination: q.to, departDate: q.date });
  const bus = omioLink(q.from, q.to, q.date);
  const r2r = rome2rioLink(q.from, q.to);
  const legs: TransportLeg[] = [];
  if (isLikelyEuropeanRail(q.from, q.to)) {
    legs.push({
      mode: "train",
      from: q.from,
      to: q.to,
      duration: "4h 30m",
      price: 89,
      carrier: "SNCF / Eurostar",
      notes: "Direct, gare centre-ville",
      ...train,
    });
  }
  legs.push({
    mode: "flight",
    from: q.from,
    to: q.to,
    duration: "2h 35m",
    price: 145,
    carrier: "Compagnies low-cost et régulières",
    notes: "Aéroport hors centre",
    ...flight,
  });
  legs.push({
    mode: "bus",
    from: q.from,
    to: q.to,
    duration: "12h",
    price: 35,
    carrier: "FlixBus / BlaBlaCar Bus",
    notes: "Économique, nuit possible",
    ...bus,
  });
  legs.push({
    mode: "multi-modal",
    from: q.from,
    to: q.to,
    duration: "Variable",
    price: 0,
    carrier: "Voir Rome2Rio",
    notes: "Comparateur complet",
    ...r2r,
  });
  return legs;
}

export async function searchTransport(q: TransportQuery): Promise<{
  legs: TransportLeg[];
  source: "mock" | "rome2rio";
}> {
  return { legs: mockMultimodal(q), source: "mock" };
}
