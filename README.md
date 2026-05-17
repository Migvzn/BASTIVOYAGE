# BastiVoyage ✈️

AI-powered travel planner built with Next.js. Type your budget and destination — Claude generates 3 optimized scenarios (cheap / balanced / luxury), a day-by-day itinerary, transport comparisons, hotels, activities, and a full budget breakdown.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** with dark mode, responsive design, smooth animations
- **Claude API** (`claude-opus-4-7`) with adaptive thinking + prompt caching
- **Vercel-ready** — zero config deployment

## Features

- Natural-language trip planning ("J'ai 1000€, je veux aller au Japon 10 jours")
- 3 budget modes side-by-side: économique, équilibré, luxe
- Multi-modal transport comparison (vols, trains, bus)
- Day-by-day itinerary timeline
- Budget breakdown with visual bar chart
- LocalStorage persistence of your last plan
- Dark mode toggle
- Graceful fallback when no API key is configured

## Quick Start

```bash
npm install
cp .env.example .env.local
# edit .env.local and add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/migvzn/bastivoyage&env=ANTHROPIC_API_KEY&envDescription=Your%20Anthropic%20API%20key%20from%20console.anthropic.com)

1. Click the button (or import the repo manually on [vercel.com/new](https://vercel.com/new))
2. Add `ANTHROPIC_API_KEY` as an environment variable
3. Deploy

## Project Structure

```
app/
  page.tsx              # Home — chat-style trip planner
  trip/page.tsx         # Saved trip view
  api/ai/route.ts       # Claude API endpoint
  layout.tsx
  globals.css
components/
  Chat.tsx              # Input + suggestions + loading skeletons
  TripView.tsx          # Full trip display with mode selector
  Budget.tsx            # Visual budget breakdown
  Itinerary.tsx         # Day-by-day timeline
lib/
  ai.ts                 # Claude client + fallback generator
  parser.ts             # Robust JSON extraction
  types.ts              # TripPlan types
prompts/
  travel.md             # System prompt (cached)
```

## API Contract

`POST /api/ai`

```json
{ "prompt": "J'ai 1000€, je veux aller au Japon 10 jours depuis Paris" }
```

Returns a `TripPlan` JSON object — see `lib/types.ts` for the schema.

## Environment Variables

| Name                 | Required | Description                                                     |
| -------------------- | -------- | --------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`  | No*      | Anthropic API key. Without it, app runs in deterministic demo mode. |

\* Recommended for production — the fallback generator is template-based.

## License

MIT
