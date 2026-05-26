# Math Drills Expansion — Design Spec
_Date: 2026-05-25_

## Goal
Replace the current 6-template drill bank and two-mode toggle with a single random-drill flow backed by ~35 templates across 10 topics, with topic filtering and difficulty filtering.

---

## Data Layer

### `DrillTemplate` type change
Add `difficulty: 'easy' | 'medium' | 'hard'` to both `DrillTemplate` and `GeneratedDrill` in `types/drill.ts`.

### Template bank (`data/drills/templates.json`)
Expand from 6 → ~35 templates. Every template has a `difficulty` field. Difficulty controls:
- **Easy**: round-number variable ranges, 1–2 step answers
- **Medium**: less round numbers, 2–3 steps
- **Hard**: messier arithmetic, 3+ steps, formula knowledge required

#### Topics and template counts
| Topic key | Count | Compute functions used |
|---|---|---|
| `percentages` | 3 | `pct-change` (×2), `markup-to-margin` |
| `margins` | 4 | `margin-calc` (×4) |
| `growth` | 4 | `pct-change`, `cagr-basic` (×2), `rev-price-volume` |
| `market-sizing` | 3 | `market-sizing` (×3) |
| `break-even` | 3 | `break-even-units`, `break-even-revenue`, `payback-basic` |
| `unit-economics` | 4 | `margin-calc`, `simple-ratio` (×2), `ltv-cac` |
| `valuation` | 3 | `roic-basic`, `simple-ratio` (×2) |
| `cost-structure` | 3 | `simple-ratio`, `pct-change`, `margin-calc` |
| `capacity` | 3 | `margin-calc`, `simple-ratio` (×2) |
| `revenue` | 3 | `simple-ratio`, `market-sizing`, `rev-price-volume` |

### New compute functions (`lib/drills.ts`)
Seven additions alongside the five existing ones:

| Key | Formula |
|---|---|
| `markup-to-margin` | `markup / (100 + markup)` (inputs in %) |
| `break-even-units` | `fixedCosts / (price - variableCost)` |
| `break-even-revenue` | `fixedCosts / (grossMarginPct / 100)` |
| `ltv-basic` | `arpu * (marginPct / 100) / (churnPct / 100)` |
| `ltv-cac` | `(arpu * (marginPct / 100) / (churnPct / 100)) / cac` |
| `simple-ratio` | `numerator / denominator` |
| `rev-price-volume` | `(1 + priceDeltaPct/100) * (1 + volumeDeltaPct/100) - 1` |

---

## API Layer

### `GET /api/drills`
Gains a second optional query param: `?difficulty=easy|medium|hard`

Both `topic` and `difficulty` are optional and combinable:
- No params → random from all 35 templates
- `?topic=margins` → random from margin templates (any difficulty)
- `?difficulty=hard` → random hard template from any topic
- `?topic=break-even&difficulty=medium` → random medium break-even template

### `POST /api/drills/attempts`
The `drillType` field is removed from the payload. The DB column stays (no migration needed) but is always written as `'randomized'`. The `GeneratedDrill` object gains `difficulty` which is forwarded in the attempt payload for future analytics grouping.

---

## UI Layer (`app/drills/page.tsx`)

### Removed
- The `mode` state and `Mode` type (`'real' | 'randomized'`)
- The mode toggle pill-bar

### Added
**Topic filter bar** (replaces mode toggle):
- Pills: `All` + one per topic (10 topics), displayed as human-readable labels
- Single-select, default: `All`
- Topic labels: Percentages, Margins, Growth & CAGR, Market Sizing, Break-Even, Unit Economics, Valuation, Cost Structure, Capacity, Revenue

**Difficulty filter row** (sits below topic bar):
- Pills: `All` · `Easy` · `Medium` · `Hard`
- Single-select, default: `All`

**Fetch behavior**: when either filter changes, immediately fetch a new drill with the updated params. The current drill is replaced.

### Unchanged
- Drill card display (dark card with title + question)
- "Got it ✓" / "Show answer" buttons
- Answer reveal with working steps
- "Next Drill →" button
- Attempt logging

---

## Out of Scope
- Spaced repetition / adaptive difficulty
- Tracking performance per difficulty level in the heatmap (analytics remain topic-level only)
- "Real Case Problems" mode (fully removed)
