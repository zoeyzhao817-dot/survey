# Scent Type (香型人格)

A 90-second mobile web quiz that turns scents you already love, a few sensory picks, your 16-type personality and star sign into a shareable scent-personality card plus 3 fragrance picks. No login, no database, bilingual (中文 / EN).

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # match + encode unit tests, property test, exhaustive filter test, golden personas
npm run build        # validates data/ first, then builds
```

## Put it in front of testers (Vercel, free tier)

1. Import this repo at vercel.com/new (framework preset: Next.js, no settings needed).
2. Optional env vars (see `.env.example`): set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SITE_HOST` to your domain, and `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` **or** `NEXT_PUBLIC_POSTHOG_KEY` so you can see completions, ratings and drop-off. Without analytics the quiz still works, but you won't see any tester data.
3. Share the URL. Every pull request gets its own preview deploy.

## How it fits together

| Path | What |
| --- | --- |
| `app/` | Routes: `/`, `/q/[step]`, `/r/[resultId]`, `/about`, `/api/og/[resultId]` (link-preview image), `/api/search` |
| `lib/match.ts` | Pure `match(answers, data)`: user vector (85% scent / 15% personality), filters + relaxation, scoring, 3 picks, scent type, "why this" lines |
| `lib/encode.ts` | Answers ⇄ `v1.<base64url>` resultId, so result links recompute with no database |
| `lib/card.ts` | Canvas share card, 1080×1920 and 1080×1440; the on-page card is the same render |
| `lib/analytics.ts` | The 11 spec events, cookieless (Plausible or PostHog) |
| `data/` | `questions.json`, `archetypes.json`, `copy.en.json`, `copy.zh.json`, `fragrances.json`, `anchors.json` |
| `data/seed/*.psv` | Curator source for the catalogue; `npm run catalogue` regenerates the JSON |
| `data/wear-styles.json` | Second half of the label from Q8 (Close-to-skin / Soft trail / Statement): 10 types × 3 = 30 labels, display only |
| `data/rarity.json` | Share of people per type for the card's brag line (estimate for now) |
| `tests/personas.json` | 12 golden personas (currently 11/12 pass; CI needs 10) |

## Not done yet (needs decisions or accounts)

- **Fragrance API sync.** The 131 recommendable scents and 30 search-only anchors are a hand-curated seed with estimated accords and **estimated Singapore prices**. Check prices before launch. The weekly sync job and accord map wait until a provider and licence are chosen; `/api/search` has the hook for it.
- **Affiliate links.** None yet. "Try a sample" and "Buy full size" open a Google search as a placeholder (`NEXT_PUBLIC_PLACEHOLDER_LINKS=0` hides them instead, as the spec intends at launch).
- **Photo tiles.** Drop-in ready, but no photos yet: tiles fall back to gradient + emoji. See `docs/photo-brief.md` for the 32-photo shot list, specs and how to add them (`npm run tiles`; the build refuses a photo without a licence entry in `data/photo-credits.json`).
- **Rarity.** "Only 4% of people are Smoke and Incense" uses estimates in `data/rarity.json`. Once analytics has 1,000+ results (30+ per type), export `result_view` counts per `scent_type` and run `npm run rarity -- counts.json`.
- **Copy review.** All 38 snippets exist in both languages and should get a pass from a native writer.
- **Domain and name** are still placeholders.
