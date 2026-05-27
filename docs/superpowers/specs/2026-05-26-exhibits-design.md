# Exhibits Feature — Design Spec
_Date: 2026-05-26_

## Goal
Build 40 case interview exhibits (bar charts, line graphs, scatter plots, waterfalls, pie charts, tables, 2×2 matrices, decision trees, process flows, value chain maps, market sizing, customer segmentation, geographic breakdowns) with a flashcard flip mechanic. Available as a new "Exhibits" tab in the nav.

---

## Data Layer

### `data/exhibits/exhibits.json`
Single JSON array of 40 exhibit objects.

**Exhibit schema:**
```typescript
interface Exhibit {
  id: string               // "bar-revenue-segments"
  type: ExhibitType        // one of 13 types
  topic: string            // "profitability" | "market-sizing" | "growth" | "operations" | "strategy"
  difficulty: 'easy' | 'medium' | 'hard'
  title: string            // "Revenue by Segment"
  context: string          // 1-sentence case setup
  question: string         // "Which segment leads? What is APAC's share?"
  chartData: object        // type-specific shape (see Chart Rendering section)
  answer: {
    insights: string[]     // 2–3 "so what" bullet points
    calculation: string[]  // step-by-step worked math
  }
}
```

**40 exhibits by type:**
| Type | Count | Examples |
|---|---|---|
| `bar-chart` | 4 | Revenue by segment, cost breakdown, market share, headcount by region |
| `line-graph` | 3 | Revenue trend, margin vs. industry, volume growth |
| `scatter-plot` | 2 | BU revenue vs. margin, market size vs. growth rate |
| `waterfall` | 3 | Revenue bridge, EBITDA bridge, cost walk |
| `pie-chart` | 3 | Revenue mix, cost mix, market share |
| `table` | 4 | Competitive benchmarking, P&L summary, unit economics, segment financials |
| `two-by-two` | 3 | BCG growth-share, competitive positioning, risk-impact |
| `decision-tree` | 2 | Go/no-go investment, pricing strategy |
| `process-flow` | 3 | Order-to-cash, manufacturing yield, customer acquisition funnel |
| `value-chain` | 2 | Retail margin stack, manufacturing value chain |
| `market-sizing` | 4 | TAM/SAM/SOM funnel, bottom-up, top-down, addressable market |
| `customer-segmentation` | 4 | LTV by segment, churn by cohort, NPS distribution, RFM |
| `geographic` | 3 | Revenue by region, market penetration by country, store density |

### `lib/exhibits.ts`
```typescript
export function getRandomExhibit(type?: string, difficulty?: string): Exhibit
// Filters exhibits.json by type and/or difficulty, returns a random match.
// Throws if no exhibits match the filter combo.
```

---

## API Layer

### `GET /api/exhibits`
- Optional query params: `?type=bar-chart`, `?difficulty=medium` (combinable)
- Calls `getRandomExhibit(type, difficulty)`
- Returns full exhibit object (including `chartData` and `answer`)
- 400 if no exhibits match the filter combo

### `POST /api/exhibits/attempts`
Request body:
```typescript
{ exhibitId: string, exhibitType: string, result: 'correct' | 'incorrect' }
```
Writes to `exhibit_attempts` table. Returns `{ id }`.

### DB schema addition (`lib/db.ts` → `initSchema`)
```sql
CREATE TABLE IF NOT EXISTS exhibit_attempts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  exhibit_id  TEXT    NOT NULL,
  exhibit_type TEXT   NOT NULL,
  result      TEXT    NOT NULL,
  attempted_at INTEGER NOT NULL
)
```

---

## Chart Rendering

### `components/exhibits/ChartRenderer.tsx`
Single entry point; switches on `exhibit.type` to render the correct chart component. All chart components live in `components/exhibits/charts/`.

All charts render pure SVG (or styled divs for tables/matrices) — no npm charting library.

**`chartData` shapes per type:**

| Component | `chartData` shape |
|---|---|
| `BarChart` | `{ labels: string[], values: number[], unit: string }` |
| `LineChart` | `{ series: { label: string, points: number[] }[], xLabels: string[], unit: string }` |
| `ScatterPlot` | `{ points: { label: string, x: number, y: number }[], xLabel: string, yLabel: string }` |
| `WaterfallChart` | `{ bars: { label: string, value: number, type: 'start'\|'up'\|'down'\|'total' }[], unit: string }` |
| `PieChart` | `{ slices: { label: string, value: number }[], unit: string }` |
| `TableExhibit` | `{ headers: string[], rows: (string\|number)[][] }` |
| `TwoByTwo` | `{ xLabel: string, yLabel: string, items: { label: string, x: 'low'\|'high', y: 'low'\|'high' }[] }` |
| `DecisionTree` | `{ nodes: { id: string, label: string, children?: string[], value?: string }[] }` |
| `ProcessFlow` | `{ steps: { label: string, detail?: string }[] }` |
| `ValueChain` | `{ stages: { label: string, margin: number }[] }` |
| `MarketSizing` | `{ levels: { label: string, value: number, unit: string }[] }` |
| `CustomerSegmentation` | `{ segments: { label: string, metrics: { key: string, value: string }[] }[] }` |
| `GeographicBreakdown` | `{ regions: { label: string, value: number, unit: string }[] }` |

---

## UI Layer

### `app/exhibits/page.tsx`
Client component (needs state for flip + fetch).

**Filter bars** (same pill pattern as drills page):
- Type filter: `All` + 13 type pills
- Difficulty filter: `All · Easy · Medium · Hard`
- Filter change fetches new exhibit and resets card to front

**Flashcard front:**
- Exhibit title + type badge
- SVG chart (via `ChartRenderer`)
- Question prompt
- "Flip to reveal answer" button

**Flashcard back (CSS rotateY flip):**
- 2–3 insight bullets
- Calculation steps
- "✓ Got it" / "✗ Missed it" buttons → logs attempt → fetches next exhibit
- "Next Exhibit →" button (skip without logging)

**State machine:** `'front' | 'back'`

### `components/NavBar.tsx`
Add `Exhibits` link between `Math Drills` and `Analytics`.

### Analytics page addition (`app/analytics/page.tsx`)
New "Exhibit Performance" section below the heatmap. Table showing attempt count + correct % per exhibit type. Reads from a new `GET /api/analytics/exhibits` route that queries `exhibit_attempts`.

---

## Out of Scope
- Spaced repetition / adaptive difficulty
- Bookmarking specific exhibits
- User-uploaded exhibits
- Exhibit performance in the dashboard progress ring
