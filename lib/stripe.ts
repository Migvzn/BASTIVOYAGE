import crypto from "crypto";

const SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID;

export function stripeConfigured(): boolean {
  return Boolean(SECRET);
}

export interface CheckoutSessionRequest {
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  mode?: "payment" | "subscription";
}

interface StripeForm {
  [key: string]: string;
}

function flatten(obj: any, prefix = ""): StripeForm {
  const out: StripeForm = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v == null) continue;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        const sub = flatten(item, `${key}[${i}]`);
        Object.assign(out, sub);
      });
    } else if (typeof v === "object") {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

function form(obj: any): string {
  return Object.entries(flatten(obj))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

export async function createCheckoutSession(req: CheckoutSessionRequest): Promise<{
  id: string;
  url: string;
}> {
  if (!SECRET) throw new Error("Stripe not configured");
  if (!PRICE_ID) throw new Error("STRIPE_PREMIUM_PRICE_ID missing");

  const body = form({
    mode: req.mode ?? "payment",
    success_url: req.successUrl,
    cancel_url: req.cancelUrl,
    customer_email: req.customerEmail,
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    metadata: req.metadata ?? {},
    payment_method_types: ["card"],
    allow_promotion_codes: "true",
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json: any = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? "Stripe error");
  }
  return { id: json.id, url: json.url };
}

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: any };
}

export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string | null,
): StripeEvent | null {
  if (!WEBHOOK_SECRET || !signatureHeader) return null;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("=") as [string, string]),
  );
  const ts = parts.t;
  const v1 = parts.v1;
  if (!ts || !v1) return null;
  const signed = `${ts}.${payload}`;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(signed).digest("hex");
  const ea = Buffer.from(expected);
  const sa = Buffer.from(v1);
  if (ea.length !== sa.length) return null;
  if (!crypto.timingSafeEqual(ea, sa)) return null;
  try {
    return JSON.parse(payload) as StripeEvent;
  } catch {
    return null;
  }
}

export async function retrieveSession(sessionId: string): Promise<any | null> {
  if (!SECRET) return null;
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${SECRET}` },
  });
  if (!res.ok) return null;
  return res.json();
}
