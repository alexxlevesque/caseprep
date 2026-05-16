# CaseInterviewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained Next.js + SQLite web app for solo MBB case interview practice with card-flip sessions, weak-spot analytics, math drills, fit prep, and framework reference.

**Architecture:** Next.js 15 App Router serves both UI and API routes. Static case/drill/framework data lives in `/data/` as JSON, read via `fs` at request time. All user data (sessions, ratings, drill scores) is written to local SQLite via `better-sqlite3`.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, better-sqlite3, Vitest, @testing-library/react

---

## File Map

```
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          ← Dashboard
│   ├── cases/page.tsx                    ← Case Bank
│   ├── cases/[id]/page.tsx               ← Case Detail
│   ├── cases/[id]/practice/page.tsx      ← Practice Session
│   ├── drills/page.tsx
│   ├── analytics/page.tsx
│   ├── fit/page.tsx
│   ├── frameworks/page.tsx
│   └── api/
│       ├── cases/route.ts
│       ├── cases/[id]/route.ts
│       ├── sessions/route.ts
│       ├── sessions/[id]/route.ts
│       ├── sessions/[id]/cards/route.ts
│       ├── drills/route.ts
│       ├── drills/attempts/route.ts
│       ├── analytics/route.ts
│       └── fit/seen/route.ts
├── components/
│   ├── NavBar.tsx
│   ├── CaseCard.tsx
│   ├── CardFlip.tsx
│   ├── ChecklistSection.tsx
│   ├── ProgressBar.tsx
│   └── HeatMap.tsx
├── lib/
│   ├── db.ts
│   ├── cases.ts
│   ├── drills.ts
│   └── analytics.ts
├── types/
│   ├── case.ts
│   ├── session.ts
│   ├── drill.ts
│   └── analytics.ts
├── data/
│   ├── cases/wharton-2017-01.json
│   ├── cases/wharton-2017-02.json
│   ├── drills/templates.json
│   ├── frameworks/frameworks.json
│   └── fit-questions/fit-questions.json
├── db/schema.sql
├── public/exhibits/
└── tests/
    ├── setup.ts
    ├── lib/db.test.ts
    ├── lib/cases.test.ts
    ├── lib/drills.test.ts
    ├── lib/analytics.test.ts
    └── components/CardFlip.test.tsx
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`, `tests/setup.ts`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd "/Users/alexlevesque/Desktop/Projects 2026/caseinterviewer"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --no-eslint --import-alias "@/*"
```

- [ ] **Step 2: Install dependencies**

```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3 vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Configure next.config.ts for native modules**

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals ?? []), { 'better-sqlite3': 'commonjs better-sqlite3' }]
    return config
  },
}

export default nextConfig
```

- [ ] **Step 4: Configure Vitest**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

```ts
// tests/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 6: Verify setup**

```bash
npm run dev
```
Expected: Next.js running at http://localhost:3000 with no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Vitest and better-sqlite3"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `types/case.ts`, `types/session.ts`, `types/drill.ts`, `types/analytics.ts`

- [ ] **Step 1: Create case types**

```ts
// types/case.ts
export type CardType =
  | 'prompt'
  | 'framework'
  | 'clarifying-qa'
  | 'exhibit'
  | 'qualitative'
  | 'math'
  | 'synthesis'
  | 'recommendation'
  | 'pushback'
  | 'wrapup'

export type Difficulty = 'easy' | 'medium' | 'medium-hard' | 'hard'

export interface CaseCard {
  index: number
  type: CardType
  interviewer: string
  question: string
  modelAnswer: string
  checklistItems: string[]
  exhibitRef?: string
  exhibitType?: 'chart' | 'table'
  data?: Record<string, unknown>
}

export interface Case {
  id: string
  title: string
  number: number
  casebook: string
  difficulty: Difficulty
  firm: string
  type: string
  topics: string[]
  cards: CaseCard[]
}

export interface CaseSummary {
  id: string
  title: string
  number: number
  casebook: string
  difficulty: Difficulty
  firm: string
  type: string
  topics: string[]
  cardCount: number
}
```

- [ ] **Step 2: Create session types**

```ts
// types/session.ts
export interface PracticeSession {
  id: number
  caseId: string
  startedAt: number
  completedAt: number | null
  overallRating: number | null
}

export interface CardAttempt {
  id: number
  sessionId: number
  cardIndex: number
  cardType: string
  selfRating: number | null
  checklistJson: string | null
  notes: string | null
  revealedAt: number | null
}

export interface SessionSummary {
  session: PracticeSession
  attempts: CardAttempt[]
}
```

- [ ] **Step 3: Create drill types**

```ts
// types/drill.ts
export interface DrillVariable {
  min: number
  max: number
  step: number
}

export interface DrillTemplate {
  id: string
  topic: string
  title: string
  template: string
  variables: Record<string, DrillVariable>
  computeFnKey: string
  answerFormat: 'percentage' | 'currency' | 'years' | 'number'
  workingStepsTemplate: string[]
}

export interface GeneratedDrill {
  drillId: string
  topic: string
  title: string
  question: string
  variables: Record<string, number>
  answer: number
  answerFormatted: string
  workingSteps: string[]
}
```

- [ ] **Step 4: Create analytics types**

```ts
// types/analytics.ts
export interface HeatMapCell {
  caseType: string
  skill: string
  avgRating: number | null
  attemptCount: number
}

export interface DrillAccuracy {
  topic: string
  accuracy: number
  avgDurationMs: number
  attemptCount: number
}

export interface AnalyticsData {
  heatMap: HeatMapCell[]
  caseTypes: string[]
  skills: string[]
  weakestCells: HeatMapCell[]
  drillAccuracy: DrillAccuracy[]
}
```

- [ ] **Step 5: Commit**

```bash
git add types/
git commit -m "feat: add TypeScript types for cases, sessions, drills, analytics"
```

---

## Task 3: Database Schema and Library

**Files:**
- Create: `db/schema.sql`, `lib/db.ts`, `tests/lib/db.test.ts`

- [ ] **Step 1: Write schema**

```sql
-- db/schema.sql
CREATE TABLE IF NOT EXISTS practice_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  overall_rating INTEGER
);

CREATE TABLE IF NOT EXISTS card_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES practice_sessions(id),
  card_index INTEGER NOT NULL,
  card_type TEXT NOT NULL,
  self_rating INTEGER,
  checklist_json TEXT,
  notes TEXT,
  revealed_at INTEGER
);

CREATE TABLE IF NOT EXISTS drill_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  drill_id TEXT NOT NULL,
  drill_type TEXT NOT NULL,
  case_id TEXT,
  topic TEXT NOT NULL,
  correct INTEGER NOT NULL,
  duration_ms INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS fit_seen (
  question_id TEXT PRIMARY KEY,
  first_seen_at INTEGER NOT NULL
);
```

- [ ] **Step 2: Write failing test**

```ts
// tests/lib/db.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

function createTestDb() {
  const db = new Database(':memory:')
  db.pragma('journal_mode = WAL')
  const schema = fs.readFileSync(path.join(process.cwd(), 'db/schema.sql'), 'utf-8')
  db.exec(schema)
  return db
}

describe('database schema', () => {
  it('creates all required tables', () => {
    const db = createTestDb()
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
    const names = tables.map(t => t.name)
    expect(names).toContain('practice_sessions')
    expect(names).toContain('card_attempts')
    expect(names).toContain('drill_attempts')
    expect(names).toContain('fit_seen')
    db.close()
  })

  it('inserts and retrieves a practice session', () => {
    const db = createTestDb()
    db.prepare('INSERT INTO practice_sessions (case_id, started_at) VALUES (?, ?)').run('test-case', 1000)
    const row = db.prepare('SELECT * FROM practice_sessions WHERE case_id = ?').get('test-case') as { case_id: string; overall_rating: null }
    expect(row.case_id).toBe('test-case')
    expect(row.overall_rating).toBeNull()
    db.close()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm run test:run -- tests/lib/db.test.ts
```
Expected: FAIL (db.ts doesn't exist yet, but schema.sql does — test may pass partially)

- [ ] **Step 4: Write db.ts singleton**

```ts
// lib/db.ts
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined
}

function initDb(): Database.Database {
  const dbPath = path.join(process.cwd(), 'caseinterviewer.db')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  const schema = fs.readFileSync(path.join(process.cwd(), 'db/schema.sql'), 'utf-8')
  db.exec(schema)
  return db
}

export function getDb(): Database.Database {
  if (!global.__db) {
    global.__db = initDb()
  }
  return global.__db
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm run test:run -- tests/lib/db.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add db/schema.sql lib/db.ts tests/lib/db.test.ts
git commit -m "feat: add SQLite schema and db singleton"
```

---

## Task 4: Case Data Files

**Files:**
- Create: `data/cases/wharton-2017-02.json`, `data/cases/wharton-2017-01.json`

- [ ] **Step 1: Create data directories**

```bash
mkdir -p data/cases data/drills data/frameworks data/fit-questions public/exhibits
```

- [ ] **Step 2: Create Case 2 JSON (Brazilian Highway Concessions)**

```json
// data/cases/wharton-2017-02.json
{
  "id": "wharton-2017-02",
  "title": "Brazilian Highway Concessions",
  "number": 2,
  "casebook": "Wharton 2017",
  "difficulty": "medium-hard",
  "firm": "McKinsey final round",
  "type": "market-entry",
  "topics": ["international-expansion", "graphical-interpretation", "market-entry", "math"],
  "cards": [
    {
      "index": 0,
      "type": "prompt",
      "interviewer": "A leading Brazilian highway concessions company is looking to expand internationally. Economic growth in Brazil has stalled, and in order to continue to grow both top-line revenues and bottom-line profitability, the client wants to diversify its portfolio and decrease its exposure to the Brazilian economy. What factors should the client consider as it thinks through its international expansion options?",
      "question": "What clarifying questions would you ask before structuring your approach?",
      "modelAnswer": "Key clarifying questions: (1) Where else does the client currently operate? (Only Brazil; staff speaks primarily Portuguese.) (2) Does the client operate in industries besides road concessions? (No — exclusively road concessions.) (3) Who are the client's typical customers and how do they win business? (Municipal, state, or national governments through competitive RFPs.) (4) Does the company want to focus on a specific region? (Open to all geographies, bias toward South America.)",
      "checklistItems": [
        "Asked about current geographies of operation",
        "Asked about adjacent industries or diversification",
        "Asked about customer type and how they win business",
        "Asked about preferred expansion region or constraints"
      ]
    },
    {
      "index": 1,
      "type": "framework",
      "interviewer": "Good questions. The client operates only in Brazil, staff speaks primarily Portuguese, they focus exclusively on road concessions, and their customers are always governments through competitive RFPs. They are open to all geographies with a bias toward South America. How would you structure your evaluation of international expansion options?",
      "question": "Walk me through your framework.",
      "modelAnswer": "A strong framework covers four buckets: (1) Culture & management complexity — language barriers, cultural fit with current leadership, geographic distance to manage assets. (2) Pipeline & economic prospects — size of the 5-year infrastructure pipeline, likelihood of privatizations, country GDP growth. (3) Political environment — regulation around privatization, political stability, receptiveness to private sector participation. (4) Competitive environment — existing players, industry concentration, competitiveness of public bids.",
      "checklistItems": [
        "Identified culture and management complexity (incl. language)",
        "Identified pipeline and economic prospects",
        "Identified political environment and regulation",
        "Identified competitive environment"
      ]
    },
    {
      "index": 2,
      "type": "exhibit",
      "exhibitType": "chart",
      "exhibitRef": "wharton-2017-02-chart-1.png",
      "interviewer": "Our team gathered data comparing each South American country's 5-year infrastructure pipeline against its World Bank ease of doing business ranking. The x-axis is the World Bank ranking (inverted — higher values mean worse). The y-axis is the 5-year pipeline in $B. I'll give you the chart now.",
      "question": "Based on this data, which markets should the client prioritize? Which should they eliminate?",
      "modelAnswer": "Prioritize (upper-right quadrant — high pipeline, favorable business environment): Mexico, Colombia, Chile, Peru. Arguable: Argentina has a strong pipeline ($4.5B) but a difficult business environment (~rank 120) — could argue either way. Eliminate (low pipeline and/or poor business environment): Venezuela, Bolivia, Honduras. Lower-right with small pipeline (Costa Rica, Panama) are too small to be priorities.",
      "checklistItems": [
        "Correctly read the scatter plot axes (noted inverted x-axis)",
        "Identified upper-right quadrant as the target zone",
        "Named Mexico, Colombia, Chile, Peru as priorities",
        "Correctly eliminated lower-left countries",
        "Addressed Argentina as an edge case"
      ]
    },
    {
      "index": 3,
      "type": "qualitative",
      "interviewer": "The team has determined that JV opportunities are not viable. The client must choose between two entry routes: primary investment (building new road concessions from scratch) or M&A (acquiring an existing player in one of the target markets).",
      "question": "What inputs would you need to compare these two options side by side?",
      "modelAnswer": "For primary investment: km of road × $/km toll rate × expected monthly traffic = annual revenue; subtract opex %; annual profit = revenue × (1 - opex); payback = investment / annual profit; value = annual profit / discount rate (perpetual concession); ROIC = value / investment - 1. For M&A: acquisition price, target annual revenue, opex %, synergies as % of revenue → annual profit = revenue × (1 - opex) + revenue × synergies; same DCF and ROIC logic.",
      "checklistItems": [
        "Identified km × $/km × traffic as primary revenue driver",
        "Mentioned opex as the key cost driver",
        "Mentioned payback period or DCF valuation",
        "Identified synergies as M&A-specific input",
        "Mentioned discount rate"
      ]
    },
    {
      "index": 4,
      "type": "math",
      "interviewer": "Here is the data for each option.",
      "question": "Calculate the ROIC for primary investment and M&A. Which should the client pursue?",
      "data": {
        "primary": {
          "km": 300,
          "dollarsPerKm": 5,
          "trafficPerMonth": 20000,
          "opex": 0.30,
          "investment": 150000000,
          "discountRate": 0.10,
          "contractTerm": "perpetual"
        },
        "ma": {
          "annualRevenue": 120000000,
          "opex": 0.40,
          "synergies": 0.15,
          "investment": 750000000,
          "discountRate": 0.10
        }
      },
      "modelAnswer": "Primary investment: Annual revenue = 300 × $5 × 20,000 = $30M. Annual opex = $30M × 30% = $9M. Annual profit = $21M. Value = $21M / 10% = $210M. ROIC = $210M / $150M - 1 = 40%.\n\nM&A: Annual revenue = $120M. Annual profit = $120M × (1 - 40%) + $120M × 15% = $72M + $18M = $90M. Value = $90M / 10% = $900M. ROIC = $900M / $750M - 1 = 20%.\n\nConclusion: Primary investment is superior — 40% ROIC vs 20% for M&A.",
      "checklistItems": [
        "Correctly computed primary annual revenue ($30M)",
        "Correctly computed primary annual profit ($21M)",
        "Correctly computed primary value ($210M)",
        "Correctly computed primary ROIC (40%)",
        "Correctly computed M&A annual profit ($90M including synergies)",
        "Correctly computed M&A ROIC (20%)",
        "Concluded that primary investment is superior"
      ]
    },
    {
      "index": 5,
      "type": "recommendation",
      "interviewer": "The CEO is about to walk in.",
      "question": "Give your recommendation.",
      "modelAnswer": "We recommend pursuing primary investment over M&A to expand internationally, prioritizing Mexico and Colombia based on their strong infrastructure pipeline and favorable business environments. The primary investment approach delivers a 40% ROIC versus 20% for M&A. Key risks: (1) political environment in target markets could shift; (2) the Portuguese-speaking team will need local Spanish-language support; (3) government RFP bidding is competitive. Next steps: commission market studies in Mexico and Colombia, engage local advisors for RFP navigation, and assess Spanish-language hiring needs.",
      "checklistItems": [
        "Led with a clear recommendation (primary investment)",
        "Specified priority markets (Mexico and/or Colombia)",
        "Quantified the ROIC advantage (40% vs 20%)",
        "Named at least 2 risks",
        "Proposed concrete next steps"
      ]
    }
  ]
}
```

- [ ] **Step 3: Create Case 1 JSON scaffold**

Read pages 8–14 of `6.-Wharton-Casebook-2017.pdf` to get the full Case 1 prompt and opening cards. Based on pages 15–17 (which show the middle of the case), the case involves a clothing retailer with $125M revenue and $138M costs (a $13M deficit). Fill in the cards below once you have the full prompt:

```json
// data/cases/wharton-2017-01.json
{
  "id": "wharton-2017-01",
  "title": "Improving Profitability",
  "number": 1,
  "casebook": "Wharton 2017",
  "difficulty": "medium",
  "firm": "General profitability",
  "type": "profitability",
  "topics": ["profitability", "cost-reduction", "revenue-growth"],
  "cards": [
    {
      "index": 0,
      "type": "prompt",
      "interviewer": "[READ FROM PDF PAGES 8-14 — opening prompt about clothing retailer expanding to the US]",
      "question": "What clarifying questions would you ask?",
      "modelAnswer": "[READ FROM PDF]",
      "checklistItems": ["[READ FROM PDF]"]
    },
    {
      "index": 1,
      "type": "framework",
      "interviewer": "[READ FROM PDF]",
      "question": "How would you structure your approach to diagnosing the profitability issue?",
      "modelAnswer": "Profitability = Revenue - Costs. Revenue drivers: price × volume. Cost drivers: COGS (manufacturing, shipping), operating costs (labor, rent). Investigate both sides.",
      "checklistItems": [
        "Used profit = revenue - costs structure",
        "Broke revenue into price and volume",
        "Broke costs into COGS and operating expenses",
        "Prioritized which branch to investigate first"
      ]
    },
    {
      "index": 2,
      "type": "math",
      "interviewer": "The client has revenue of $125M and costs of $138M, giving a deficit of $13M. Here are the cost details: Manufacturing $X, Shipping $90M (air), Labor $Y, Rent $Z (flagship + mall stores).",
      "question": "If the client switches shipping from air to boat, saving 5% of $90M COGS, what are the annual savings?",
      "modelAnswer": "Savings = $90M × 5% = $4.5M annually.",
      "checklistItems": [
        "Correctly computed 5% of $90M = $4.5M"
      ]
    },
    {
      "index": 3,
      "type": "qualitative",
      "interviewer": "The client is also considering sharing rent at their flagship store by bringing in a coffee shop, which would cut 25% of the flagship rent burden.",
      "question": "Brainstorm other options to reduce the rent burden. What are the pros and cons of the coffee shop idea?",
      "modelAnswer": "Other rent options: move flagship location (rejected — needed for marketing), close mall stores (rejected — planning suburban expansion), sublease space. Coffee shop pros: immediate revenue sharing, drives customer traffic. Cons: brand fit risk, operational complexity, unreliable partner risk. If flagship rent is $7M, savings = $7M × 25% = $1.75M annually.",
      "checklistItems": [
        "Generated at least 2 rent reduction ideas",
        "Evaluated pros and cons of coffee shop concept",
        "Calculated $1.75M savings (25% of flagship rent burden)"
      ]
    },
    {
      "index": 4,
      "type": "math",
      "interviewer": "Adjusting designs and sizes for the American market will cost $12M annually but generate $23M in additional revenue.",
      "question": "What is the net incremental income? Does it close the $13M deficit when combined with cost savings?",
      "modelAnswer": "Incremental revenue = $23M - $12M cost = $11M net. Total improvement: $4.5M (shipping) + $1.75M (rent) + $11M (revenue) = $17.25M. This exceeds the $13M deficit, returning the client to profitability with $4.25M in profit.",
      "checklistItems": [
        "Computed net revenue gain ($11M)",
        "Summed all three improvements ($17.25M total)",
        "Confirmed this exceeds the $13M deficit"
      ]
    },
    {
      "index": 5,
      "type": "recommendation",
      "interviewer": "The CEO (she) is about to walk in.",
      "question": "Give your recommendation.",
      "modelAnswer": "We recommend three actions: (1) Switch shipping from air to boat — $4.5M annual savings; (2) Partner with a coffee shop at the flagship to share rent — $1.75M savings; (3) Redesign inventory for the American market (sizes and styles) — $11M net annual benefit. Together these generate $17.25M in improvement, turning a $13M deficit into a $4.25M profit. Key risks: unreliable retail partner at flagship, product-market fit risk with redesigned inventory, shipping delays from sea freight. Recommend: vet coffee shop partner carefully, conduct US market research before full inventory redesign, adjust warehouse lead times for sea shipping.",
      "checklistItems": [
        "Led with a clear recommendation (all three actions)",
        "Quantified total improvement ($17.25M)",
        "Stated resulting profit ($4.25M)",
        "Named at least 2 risks",
        "Did not refer to the CEO as 'he'"
      ]
    }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add data/
git commit -m "feat: add seed case JSON data for cases 1 and 2"
```

---

## Task 5: Case Library

**Files:**
- Create: `lib/cases.ts`, `tests/lib/cases.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/lib/cases.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { getAllCaseSummaries, getCaseById } from '@/lib/cases'

describe('cases library', () => {
  it('returns all case summaries', () => {
    const cases = getAllCaseSummaries()
    expect(cases.length).toBeGreaterThan(0)
    expect(cases[0]).toHaveProperty('id')
    expect(cases[0]).toHaveProperty('title')
    expect(cases[0]).toHaveProperty('cardCount')
    expect(cases[0]).not.toHaveProperty('cards')
  })

  it('returns a full case by id', () => {
    const c = getCaseById('wharton-2017-02')
    expect(c).not.toBeNull()
    expect(c!.id).toBe('wharton-2017-02')
    expect(c!.cards.length).toBeGreaterThan(0)
    expect(c!.cards[0]).toHaveProperty('interviewer')
    expect(c!.cards[0]).toHaveProperty('checklistItems')
  })

  it('returns null for unknown case id', () => {
    const c = getCaseById('does-not-exist')
    expect(c).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/lib/cases.test.ts
```
Expected: FAIL — `getAllCaseSummaries` not found.

- [ ] **Step 3: Implement lib/cases.ts**

```ts
// lib/cases.ts
import fs from 'fs'
import path from 'path'
import type { Case, CaseSummary } from '@/types/case'

const CASES_DIR = path.join(process.cwd(), 'data', 'cases')

function readCaseFile(filename: string): Case {
  const raw = fs.readFileSync(path.join(CASES_DIR, filename), 'utf-8')
  return JSON.parse(raw) as Case
}

export function getAllCaseSummaries(): CaseSummary[] {
  const files = fs.readdirSync(CASES_DIR).filter(f => f.endsWith('.json'))
  return files
    .map(f => readCaseFile(f))
    .sort((a, b) => a.number - b.number)
    .map(({ cards, ...rest }) => ({ ...rest, cardCount: cards.length }))
}

export function getCaseById(id: string): Case | null {
  const files = fs.readdirSync(CASES_DIR).filter(f => f.endsWith('.json'))
  for (const f of files) {
    const c = readCaseFile(f)
    if (c.id === id) return c
  }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- tests/lib/cases.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/cases.ts tests/lib/cases.test.ts
git commit -m "feat: add case library with summary and detail readers"
```

---

## Task 6: Analytics Library

**Files:**
- Create: `lib/analytics.ts`, `tests/lib/analytics.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/lib/analytics.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { computeHeatMap, getWeakestCells } from '@/lib/analytics'

function createTestDb() {
  const db = new Database(':memory:')
  const schema = fs.readFileSync(path.join(process.cwd(), 'db/schema.sql'), 'utf-8')
  db.exec(schema)
  return db
}

describe('analytics library', () => {
  let db: Database.Database

  beforeEach(() => {
    db = createTestDb()
    // Seed: two sessions on market-entry case, one math card rated 1, one framework rated 3
    db.prepare('INSERT INTO practice_sessions (id, case_id, started_at) VALUES (1, ?, ?)').run('wharton-2017-02', 1000)
    db.prepare('INSERT INTO card_attempts (session_id, card_index, card_type, self_rating) VALUES (1, 4, ?, 1)').run('math')
    db.prepare('INSERT INTO card_attempts (session_id, card_index, card_type, self_rating) VALUES (1, 1, ?, 3)').run('framework')
  })

  it('computes heat map cells with correct avg rating', () => {
    const cells = computeHeatMap(db, [{ id: 'wharton-2017-02', type: 'market-entry' }])
    const mathCell = cells.find(c => c.caseType === 'market-entry' && c.skill === 'Math')
    expect(mathCell?.avgRating).toBe(1)
    const frameworkCell = cells.find(c => c.caseType === 'market-entry' && c.skill === 'Framework')
    expect(frameworkCell?.avgRating).toBe(3)
  })

  it('returns weakest cells sorted by avg rating ascending', () => {
    const cells = computeHeatMap(db, [{ id: 'wharton-2017-02', type: 'market-entry' }])
    const weak = getWeakestCells(cells, 2)
    expect(weak[0].avgRating).toBeLessThanOrEqual(weak[1]?.avgRating ?? Infinity)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/lib/analytics.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement lib/analytics.ts**

```ts
// lib/analytics.ts
import type Database from 'better-sqlite3'
import type { HeatMapCell } from '@/types/analytics'

const SKILL_TO_CARD_TYPES: Record<string, string[]> = {
  'Framework': ['framework'],
  'Math': ['math'],
  'Graphical Interpretation': ['exhibit'],
  'Recommendation': ['recommendation'],
  'Clarifying Questions': ['prompt', 'clarifying-qa'],
}

const SKILLS = Object.keys(SKILL_TO_CARD_TYPES)

export function computeHeatMap(
  db: Database.Database,
  cases: { id: string; type: string }[]
): HeatMapCell[] {
  const caseTypeMap: Record<string, string[]> = {}
  for (const c of cases) {
    if (!caseTypeMap[c.type]) caseTypeMap[c.type] = []
    caseTypeMap[c.type].push(c.id)
  }

  const cells: HeatMapCell[] = []

  for (const [caseType, caseIds] of Object.entries(caseTypeMap)) {
    const placeholders = caseIds.map(() => '?').join(',')
    for (const [skill, cardTypes] of Object.entries(SKILL_TO_CARD_TYPES)) {
      const cardTypePlaceholders = cardTypes.map(() => '?').join(',')
      const row = db.prepare(`
        SELECT AVG(ca.self_rating) as avg_rating, COUNT(*) as attempt_count
        FROM card_attempts ca
        JOIN practice_sessions ps ON ca.session_id = ps.id
        WHERE ps.case_id IN (${placeholders})
          AND ca.card_type IN (${cardTypePlaceholders})
          AND ca.self_rating IS NOT NULL
      `).get([...caseIds, ...cardTypes]) as { avg_rating: number | null; attempt_count: number }

      cells.push({
        caseType,
        skill,
        avgRating: row.avg_rating,
        attemptCount: row.attempt_count,
      })
    }
  }

  return cells
}

export function getWeakestCells(cells: HeatMapCell[], n: number): HeatMapCell[] {
  return cells
    .filter(c => c.avgRating !== null)
    .sort((a, b) => (a.avgRating ?? 99) - (b.avgRating ?? 99))
    .slice(0, n)
}

export { SKILLS }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- tests/lib/analytics.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/analytics.ts tests/lib/analytics.test.ts
git commit -m "feat: add analytics library with heat-map computation"
```

---

## Task 7: App Shell and Navigation

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`
- Create: `components/NavBar.tsx`

- [ ] **Step 1: Create NavBar component**

```tsx
// components/NavBar.tsx
import Link from 'next/link'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/cases', label: 'Case Bank' },
  { href: '/drills', label: 'Math Drills' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/fit', label: 'Fit Prep' },
  { href: '/frameworks', label: 'Frameworks' },
]

export default function NavBar() {
  return (
    <nav className="bg-slate-800 text-slate-100 px-6 py-3 flex items-center gap-8">
      <span className="text-blue-400 font-bold text-lg tracking-tight">CasePrep</span>
      <div className="flex gap-6 text-sm">
        {links.map(l => (
          <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Update root layout**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CasePrep',
  description: 'MBB case interview practice hub',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen`}>
        <NavBar />
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```
Open http://localhost:3000. Confirm dark nav bar with all 6 links is visible. All links are white text on slate-800 background — verify contrast is clear.

- [ ] **Step 4: Commit**

```bash
git add components/NavBar.tsx app/layout.tsx app/globals.css
git commit -m "feat: add app shell with navigation"
```

---

## Task 8: Case Bank Page

**Files:**
- Create: `components/CaseCard.tsx`, `app/cases/page.tsx`

- [ ] **Step 1: Create CaseCard component**

```tsx
// components/CaseCard.tsx
import Link from 'next/link'
import type { CaseSummary } from '@/types/case'

const difficultyColors: Record<string, string> = {
  'easy': 'bg-green-100 text-green-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'medium-hard': 'bg-orange-100 text-orange-800',
  'hard': 'bg-red-100 text-red-800',
}

interface Props {
  case: CaseSummary
  bestRating?: number | null
  attemptCount?: number
}

export default function CaseCard({ case: c, bestRating, attemptCount }: Props) {
  return (
    <Link href={`/cases/${c.id}`} className="block border border-slate-200 rounded-xl p-5 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">Case {c.number} · {c.casebook}</p>
          <h3 className="font-semibold text-slate-900 text-base">{c.title}</h3>
          <p className="text-xs text-slate-500 mt-1">{c.firm}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${difficultyColors[c.difficulty] ?? 'bg-slate-100 text-slate-700'}`}>
          {c.difficulty}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mt-3">
        {c.topics.map(t => (
          <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span>{c.cardCount} cards</span>
        {attemptCount ? (
          <span className="text-green-700 font-medium">Best: {bestRating}/3 ({attemptCount} attempts)</span>
        ) : (
          <span className="italic">Not started</span>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create API route for cases list**

```ts
// app/api/cases/route.ts
import { NextResponse } from 'next/server'
import { getAllCaseSummaries } from '@/lib/cases'
import { getDb } from '@/lib/db'

export async function GET() {
  const summaries = getAllCaseSummaries()
  const db = getDb()

  const enriched = summaries.map(c => {
    const row = db.prepare(`
      SELECT MAX(overall_rating) as best_rating, COUNT(*) as attempt_count
      FROM practice_sessions
      WHERE case_id = ? AND overall_rating IS NOT NULL
    `).get(c.id) as { best_rating: number | null; attempt_count: number }

    return { ...c, bestRating: row.best_rating, attemptCount: row.attempt_count }
  })

  return NextResponse.json(enriched)
}
```

- [ ] **Step 3: Create Case Bank page**

```tsx
// app/cases/page.tsx
import { getAllCaseSummaries } from '@/lib/cases'
import { getDb } from '@/lib/db'
import CaseCard from '@/components/CaseCard'

export default function CasesPage() {
  const summaries = getAllCaseSummaries()
  const db = getDb()

  const enriched = summaries.map(c => {
    const row = db.prepare(`
      SELECT MAX(overall_rating) as best_rating, COUNT(*) as attempt_count
      FROM practice_sessions WHERE case_id = ? AND overall_rating IS NOT NULL
    `).get(c.id) as { best_rating: number | null; attempt_count: number }
    return { ...c, bestRating: row.best_rating, attemptCount: row.attempt_count }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Case Bank</h1>
      <p className="text-slate-500 mb-6">Wharton Consulting Club Casebook 2017 · {enriched.length} cases</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {enriched.map(c => (
          <CaseCard key={c.id} case={c} bestRating={c.bestRating} attemptCount={c.attemptCount} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:3000/cases. Confirm both cases appear as cards with correct metadata, difficulty badges, and topic pills.

- [ ] **Step 5: Commit**

```bash
git add components/CaseCard.tsx app/cases/page.tsx app/api/cases/route.ts
git commit -m "feat: add case bank page with enriched case cards"
```

---

## Task 9: Case Detail Page

**Files:**
- Create: `app/cases/[id]/page.tsx`, `app/api/cases/[id]/route.ts`

- [ ] **Step 1: Create API route for single case**

```ts
// app/api/cases/[id]/route.ts
import { NextResponse } from 'next/server'
import { getCaseById } from '@/lib/cases'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = getCaseById(id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(c)
}
```

- [ ] **Step 2: Create case detail page**

```tsx
// app/cases/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCaseById } from '@/lib/cases'
import { getDb } from '@/lib/db'

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = getCaseById(id)
  if (!c) notFound()

  const db = getDb()
  const sessions = db.prepare(`
    SELECT id, started_at, completed_at, overall_rating FROM practice_sessions
    WHERE case_id = ? ORDER BY started_at DESC LIMIT 5
  `).all(id) as { id: number; started_at: number; completed_at: number | null; overall_rating: number | null }[]

  return (
    <div className="max-w-2xl">
      <Link href="/cases" className="text-sm text-blue-600 hover:underline mb-4 block">← Case Bank</Link>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <p className="text-xs text-slate-400 mb-1">Case {c.number} · {c.casebook}</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{c.title}</h1>
        <p className="text-sm text-slate-500 mb-4">{c.firm}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {c.topics.map(t => (
            <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
        <p className="text-sm text-slate-600">{c.cards.length} cards · {c.difficulty} difficulty</p>
      </div>

      <Link
        href={`/cases/${id}/practice`}
        className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl mb-6 transition-colors"
      >
        Start Practice Session →
      </Link>

      {sessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Previous Sessions</h2>
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="flex justify-between text-sm bg-white border border-slate-200 rounded-lg px-4 py-2">
                <span className="text-slate-500">{new Date(s.started_at).toLocaleDateString()}</span>
                <span className="text-slate-700">
                  {s.overall_rating ? `Overall: ${s.overall_rating}/3` : 'Incomplete'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:3000/cases/wharton-2017-02. Confirm case detail with title, difficulty, topics, card count, and "Start Practice Session" button.

- [ ] **Step 4: Commit**

```bash
git add app/cases/[id]/page.tsx app/api/cases/[id]/route.ts
git commit -m "feat: add case detail page with session history"
```

---

## Task 10: Practice Session API Routes

**Files:**
- Create: `app/api/sessions/route.ts`, `app/api/sessions/[id]/route.ts`, `app/api/sessions/[id]/cards/route.ts`

- [ ] **Step 1: Create sessions API (create + complete)**

```ts
// app/api/sessions/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: Request) {
  const { caseId } = await req.json() as { caseId: string }
  const db = getDb()
  const result = db.prepare(
    'INSERT INTO practice_sessions (case_id, started_at) VALUES (?, ?)'
  ).run(caseId, Date.now())
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
}
```

```ts
// app/api/sessions/[id]/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { overallRating } = await req.json() as { overallRating: number }
  const db = getDb()
  db.prepare(
    'UPDATE practice_sessions SET overall_rating = ?, completed_at = ? WHERE id = ?'
  ).run(overallRating, Date.now(), id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create card attempts API**

```ts
// app/api/sessions/[id]/cards/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

interface CardAttemptPayload {
  cardIndex: number
  cardType: string
  selfRating: number
  checklist: boolean[]
  notes?: string
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as CardAttemptPayload
  const db = getDb()

  const existing = db.prepare(
    'SELECT id FROM card_attempts WHERE session_id = ? AND card_index = ?'
  ).get(id, body.cardIndex)

  if (existing) {
    db.prepare(`
      UPDATE card_attempts SET self_rating = ?, checklist_json = ?, notes = ?, revealed_at = ?
      WHERE session_id = ? AND card_index = ?
    `).run(body.selfRating, JSON.stringify(body.checklist), body.notes ?? null, Date.now(), id, body.cardIndex)
  } else {
    db.prepare(`
      INSERT INTO card_attempts (session_id, card_index, card_type, self_rating, checklist_json, notes, revealed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, body.cardIndex, body.cardType, body.selfRating, JSON.stringify(body.checklist), body.notes ?? null, Date.now())
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/sessions/
git commit -m "feat: add session and card attempt API routes"
```

---

## Task 11: CardFlip and Checklist Components

**Files:**
- Create: `components/CardFlip.tsx`, `components/ChecklistSection.tsx`, `components/ProgressBar.tsx`, `tests/components/CardFlip.test.tsx`

- [ ] **Step 1: Write failing test for CardFlip**

```tsx
// tests/components/CardFlip.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CardFlip from '@/components/CardFlip'
import type { CaseCard } from '@/types/case'

const mockCard: CaseCard = {
  index: 0,
  type: 'framework',
  interviewer: 'Walk me through your framework.',
  question: 'How would you structure this?',
  modelAnswer: 'Use the profitability tree.',
  checklistItems: ['Identified revenue', 'Identified costs'],
}

describe('CardFlip', () => {
  it('shows interviewer prompt initially', () => {
    render(<CardFlip card={mockCard} onComplete={vi.fn()} />)
    expect(screen.getByText('Walk me through your framework.')).toBeInTheDocument()
    expect(screen.queryByText('Use the profitability tree.')).not.toBeInTheDocument()
  })

  it('reveals model answer after clicking flip button', () => {
    render(<CardFlip card={mockCard} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /flip/i }))
    expect(screen.getByText('Use the profitability tree.')).toBeInTheDocument()
  })

  it('calls onComplete with rating and checklist when submitted', () => {
    const onComplete = vi.fn()
    render(<CardFlip card={mockCard} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: /flip/i }))
    fireEvent.click(screen.getByRole('button', { name: /nailed it/i }))
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ selfRating: 3 }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/components/CardFlip.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create ProgressBar component**

```tsx
// components/ProgressBar.tsx
interface Props {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: Props) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="mb-1">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Card {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full">
        <div className="h-1.5 bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create ChecklistSection component**

```tsx
// components/ChecklistSection.tsx
interface Props {
  items: string[]
  checked: boolean[]
  onChange: (index: number, value: boolean) => void
}

export default function ChecklistSection({ items, checked, onChange }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-green-800 mb-2">Did you hit these?</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <label key={i} className="flex items-start gap-2 cursor-pointer text-sm text-green-900">
            <input
              type="checkbox"
              checked={checked[i] ?? false}
              onChange={e => onChange(i, e.target.checked)}
              className="mt-0.5 accent-green-700"
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create CardFlip component**

```tsx
// components/CardFlip.tsx
'use client'
import { useState } from 'react'
import type { CaseCard } from '@/types/case'
import ChecklistSection from './ChecklistSection'

interface CompletePayload {
  selfRating: number
  checklist: boolean[]
  notes: string
}

interface Props {
  card: CaseCard
  onComplete: (payload: CompletePayload) => void
}

const RATINGS = [
  { value: 1, label: 'Missed it', className: 'bg-red-100 text-red-800 hover:bg-red-200' },
  { value: 2, label: 'Partial', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
  { value: 3, label: 'Nailed it', className: 'bg-green-100 text-green-800 hover:bg-green-200' },
]

export default function CardFlip({ card, onComplete }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [checklist, setChecklist] = useState<boolean[]>(card.checklistItems.map(() => false))
  const [notes, setNotes] = useState('')

  function handleCheck(index: number, value: boolean) {
    setChecklist(prev => prev.map((v, i) => (i === index ? value : v)))
  }

  return (
    <div className="space-y-4">
      {/* Interviewer prompt */}
      <div className="bg-slate-800 text-slate-100 rounded-2xl p-6">
        <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Interviewer</p>
        <p className="text-base leading-relaxed mb-3">{card.interviewer}</p>
        <p className="text-blue-300 font-medium">{card.question}</p>
      </div>

      {/* Notes */}
      {!revealed && (
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Jot your thinking here (optional)..."
          className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      )}

      {/* Flip button */}
      {!revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          ↩ Flip — See Model Answer
        </button>
      )}

      {/* Model answer */}
      {revealed && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
          <p className="text-xs uppercase tracking-widest text-green-800 mb-1">Model Answer</p>
          <p className="text-sm text-green-900 leading-relaxed whitespace-pre-wrap">{card.modelAnswer}</p>

          <div className="border-t border-green-200 pt-4">
            <ChecklistSection items={card.checklistItems} checked={checklist} onChange={handleCheck} />
          </div>

          <div className="border-t border-green-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-800 mb-2">Rate this card</p>
            <div className="flex gap-2">
              {RATINGS.map(r => (
                <button
                  key={r.value}
                  onClick={() => onComplete({ selfRating: r.value, checklist, notes })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${r.className}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm run test:run -- tests/components/CardFlip.test.tsx
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add components/CardFlip.tsx components/ChecklistSection.tsx components/ProgressBar.tsx tests/components/CardFlip.test.tsx
git commit -m "feat: add CardFlip, ChecklistSection, ProgressBar components"
```

---

## Task 12: Practice Session Page

**Files:**
- Create: `app/cases/[id]/practice/page.tsx`

- [ ] **Step 1: Create practice session page**

```tsx
// app/cases/[id]/practice/page.tsx
'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import type { Case } from '@/types/case'
import CardFlip from '@/components/CardFlip'
import ProgressBar from '@/components/ProgressBar'

interface CompletePayload {
  selfRating: number
  checklist: boolean[]
  notes: string
}

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [overallRating, setOverallRating] = useState<number | null>(null)
  const [cardResults, setCardResults] = useState<CompletePayload[]>([])

  useEffect(() => {
    fetch(`/api/cases/${id}`).then(r => r.json()).then(setCaseData)
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: id }),
    }).then(r => r.json()).then(d => setSessionId(d.id))
  }, [id])

  async function handleCardComplete(payload: CompletePayload) {
    if (!sessionId || !caseData) return
    await fetch(`/api/sessions/${sessionId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardIndex,
        cardType: caseData.cards[cardIndex].type,
        selfRating: payload.selfRating,
        checklist: payload.checklist,
        notes: payload.notes,
      }),
    })
    setCardResults(prev => [...prev, payload])
    if (cardIndex + 1 >= caseData.cards.length) {
      setDone(true)
    } else {
      setCardIndex(i => i + 1)
    }
  }

  async function handleOverallRating(rating: number) {
    if (!sessionId) return
    setOverallRating(rating)
    await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overallRating: rating }),
    })
  }

  if (!caseData) return <div className="text-slate-400 text-sm">Loading...</div>

  if (done) {
    const avg = cardResults.length
      ? (cardResults.reduce((s, r) => s + r.selfRating, 0) / cardResults.length).toFixed(1)
      : '—'
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Session Complete</h1>
        <p className="text-slate-500 mb-6">{caseData.title} · Average card rating: {avg}/3</p>
        {!overallRating ? (
          <div>
            <p className="font-semibold text-slate-700 mb-3">Overall session rating:</p>
            <div className="flex gap-3">
              {[1, 2, 3].map(r => (
                <button
                  key={r}
                  onClick={() => handleOverallRating(r)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm ${
                    r === 1 ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                    r === 2 ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                    'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {r === 1 ? 'Poor' : r === 2 ? 'Good' : 'Excellent'}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-green-700 font-medium">Rating saved.</p>
            <button onClick={() => router.push(`/cases/${id}`)} className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors">
              Back to Case
            </button>
            <button onClick={() => router.push('/analytics')} className="w-full border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
              View Analytics →
            </button>
          </div>
        )}
      </div>
    )
  }

  const card = caseData.cards[cardIndex]

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <p className="text-sm text-slate-500 mb-2">{caseData.title}</p>
        <ProgressBar current={cardIndex + 1} total={caseData.cards.length} />
      </div>
      <CardFlip key={cardIndex} card={card} onComplete={handleCardComplete} />
    </div>
  )
}
```

- [ ] **Step 2: Verify end-to-end in browser**

1. Go to http://localhost:3000/cases/wharton-2017-02
2. Click "Start Practice Session"
3. Flip cards, rate each one
4. Complete all cards, give overall rating
5. Confirm session appears in case detail history

- [ ] **Step 3: Commit**

```bash
git add app/cases/[id]/practice/page.tsx
git commit -m "feat: add card-flip practice session with session persistence"
```

---

## Task 13: Drill Templates and Library

**Files:**
- Create: `data/drills/templates.json`, `lib/drills.ts`, `tests/lib/drills.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/lib/drills.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { generateDrill, getAllTemplates } from '@/lib/drills'

describe('drills library', () => {
  it('loads all templates', () => {
    const templates = getAllTemplates()
    expect(templates.length).toBeGreaterThan(0)
    expect(templates[0]).toHaveProperty('id')
    expect(templates[0]).toHaveProperty('topic')
  })

  it('generates a drill with correct answer for roic-basic', () => {
    const drill = generateDrill('roic-basic', { investment: 200, annualProfit: 30, discountRate: 0.10 })
    expect(drill.answer).toBeCloseTo(0.5, 2) // (30/0.10)/200 - 1 = 150/200 - 1 = -0.25... wait
    // ROIC = (annualProfit / discountRate) / investment - 1
    // = (30 / 0.10) / 200 - 1 = 300/200 - 1 = 0.5
    expect(drill.answer).toBeCloseTo(0.5, 5)
  })

  it('generates a drill with random variables when none provided', () => {
    const drill = generateDrill('payback-basic')
    expect(drill.answer).toBeGreaterThan(0)
    expect(drill.question).toBeTruthy()
  })

  it('formats percentage answers correctly', () => {
    const drill = generateDrill('roic-basic', { investment: 100, annualProfit: 10, discountRate: 0.10 })
    expect(drill.answerFormatted).toMatch(/%/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/lib/drills.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create drill templates JSON**

```json
// data/drills/templates.json
[
  {
    "id": "roic-basic",
    "topic": "roic",
    "title": "Calculate ROIC",
    "template": "A company invested ${{investment}}M. The investment generates ${{annualProfit}}M in annual profit. The discount rate is {{discountRatePct}}%. What is the ROIC?",
    "variables": {
      "investment": { "min": 100, "max": 800, "step": 50 },
      "annualProfit": { "min": 10, "max": 120, "step": 5 },
      "discountRatePct": { "min": 8, "max": 15, "step": 1 }
    },
    "computeFnKey": "roic-basic",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Value = Annual Profit / Discount Rate = ${{annualProfit}}M / {{discountRatePct}}% = ${{value}}M",
      "ROIC = Value / Investment - 1 = ${{value}}M / ${{investment}}M - 1 = {{answerFormatted}}"
    ]
  },
  {
    "id": "payback-basic",
    "topic": "payback",
    "title": "Calculate Payback Period",
    "template": "A company invests ${{investment}}M in a project generating ${{annualProfit}}M in annual profit. How many years until payback?",
    "variables": {
      "investment": { "min": 50, "max": 500, "step": 25 },
      "annualProfit": { "min": 10, "max": 100, "step": 5 }
    },
    "computeFnKey": "payback-basic",
    "answerFormat": "years",
    "workingStepsTemplate": [
      "Payback = Investment / Annual Profit = ${{investment}}M / ${{annualProfit}}M = {{answerFormatted}}"
    ]
  },
  {
    "id": "pct-change",
    "topic": "percentages",
    "title": "Percentage Change",
    "template": "A metric changed from ${{oldValue}}M to ${{newValue}}M. What is the percentage change?",
    "variables": {
      "oldValue": { "min": 50, "max": 500, "step": 10 },
      "newValue": { "min": 30, "max": 600, "step": 10 }
    },
    "computeFnKey": "pct-change",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "% Change = (New - Old) / Old = (${{newValue}}M - ${{oldValue}}M) / ${{oldValue}}M = {{answerFormatted}}"
    ]
  },
  {
    "id": "market-sizing",
    "topic": "market-sizing",
    "title": "Market Size Estimation",
    "template": "A market has {{population}}M potential customers. {{penetrationPct}}% are expected to adopt the product. The average annual spend is ${{price}}. What is the total market size?",
    "variables": {
      "population": { "min": 10, "max": 300, "step": 10 },
      "penetrationPct": { "min": 5, "max": 40, "step": 5 },
      "price": { "min": 50, "max": 2000, "step": 50 }
    },
    "computeFnKey": "market-sizing",
    "answerFormat": "currency",
    "workingStepsTemplate": [
      "Customers = Population × Penetration = {{population}}M × {{penetrationPct}}% = {{customers}}M",
      "Market Size = Customers × Price = {{customers}}M × ${{price}} = {{answerFormatted}}"
    ]
  },
  {
    "id": "margin-calc",
    "topic": "margins",
    "title": "Profit Margin",
    "template": "A company has ${{revenue}}M in revenue and ${{costs}}M in total costs. What is the profit margin?",
    "variables": {
      "revenue": { "min": 100, "max": 2000, "step": 50 },
      "costs": { "min": 50, "max": 1800, "step": 50 }
    },
    "computeFnKey": "margin-calc",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Profit = Revenue - Costs = ${{revenue}}M - ${{costs}}M = ${{profit}}M",
      "Margin = Profit / Revenue = ${{profit}}M / ${{revenue}}M = {{answerFormatted}}"
    ]
  },
  {
    "id": "cagr-basic",
    "topic": "cagr",
    "title": "Calculate CAGR",
    "template": "A market grew from ${{startValue}}B to ${{endValue}}B over {{years}} years. What was the CAGR?",
    "variables": {
      "startValue": { "min": 1, "max": 50, "step": 1 },
      "endValue": { "min": 2, "max": 100, "step": 2 },
      "years": { "min": 3, "max": 10, "step": 1 }
    },
    "computeFnKey": "cagr-basic",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "CAGR = (End / Start)^(1/Years) - 1 = (${{endValue}}B / ${{startValue}}B)^(1/{{years}}) - 1 = {{answerFormatted}}"
    ]
  }
]
```

- [ ] **Step 4: Implement lib/drills.ts**

```ts
// lib/drills.ts
import fs from 'fs'
import path from 'path'
import type { DrillTemplate, GeneratedDrill } from '@/types/drill'

type ComputeFn = (vars: Record<string, number>) => number

const computeFunctions: Record<string, ComputeFn> = {
  'roic-basic': ({ investment, annualProfit, discountRatePct }) => {
    const value = annualProfit / (discountRatePct / 100)
    return value / investment - 1
  },
  'payback-basic': ({ investment, annualProfit }) => investment / annualProfit,
  'pct-change': ({ oldValue, newValue }) => (newValue - oldValue) / oldValue,
  'market-sizing': ({ population, penetrationPct, price }) =>
    population * 1_000_000 * (penetrationPct / 100) * price,
  'margin-calc': ({ revenue, costs }) => (revenue - costs) / revenue,
  'cagr-basic': ({ startValue, endValue, years }) =>
    Math.pow(endValue / startValue, 1 / years) - 1,
}

function formatAnswer(value: number, format: DrillTemplate['answerFormat']): string {
  switch (format) {
    case 'percentage': return `${(value * 100).toFixed(1)}%`
    case 'currency': return `$${(value / 1_000_000).toFixed(0)}M`
    case 'years': return `${value.toFixed(1)} years`
    case 'number': return value.toFixed(2)
  }
}

function randomVar(variable: { min: number; max: number; step: number }): number {
  const steps = Math.floor((variable.max - variable.min) / variable.step)
  return variable.min + Math.floor(Math.random() * (steps + 1)) * variable.step
}

function fillTemplate(template: string, vars: Record<string, number>, extras: Record<string, string> = {}): string {
  let result = template
  for (const [k, v] of Object.entries(vars)) {
    result = result.replaceAll(`{{${k}}}`, String(v))
  }
  for (const [k, v] of Object.entries(extras)) {
    result = result.replaceAll(`{{${k}}}`, v)
  }
  return result
}

let _templates: DrillTemplate[] | null = null

export function getAllTemplates(): DrillTemplate[] {
  if (_templates) return _templates
  const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'drills', 'templates.json'), 'utf-8')
  _templates = JSON.parse(raw) as DrillTemplate[]
  return _templates
}

export function generateDrill(templateId: string, overrideVars?: Record<string, number>): GeneratedDrill {
  const templates = getAllTemplates()
  const template = templates.find(t => t.id === templateId)
  if (!template) throw new Error(`Unknown drill template: ${templateId}`)

  const computeFn = computeFunctions[template.computeFnKey]
  if (!computeFn) throw new Error(`Unknown compute function: ${template.computeFnKey}`)

  const vars: Record<string, number> = {}
  for (const [key, def] of Object.entries(template.variables)) {
    vars[key] = overrideVars?.[key] ?? randomVar(def)
  }

  const answer = computeFn(vars)
  const answerFormatted = formatAnswer(answer, template.answerFormat)

  const extras: Record<string, string> = { answerFormatted }
  if (template.computeFnKey === 'roic-basic') {
    extras['value'] = (vars['annualProfit'] / (vars['discountRatePct'] / 100)).toFixed(0)
  }
  if (template.computeFnKey === 'margin-calc') {
    extras['profit'] = (vars['revenue'] - vars['costs']).toFixed(0)
  }
  if (template.computeFnKey === 'market-sizing') {
    extras['customers'] = ((vars['population'] * (vars['penetrationPct'] / 100))).toFixed(1)
  }

  return {
    drillId: `${templateId}-${Date.now()}`,
    topic: template.topic,
    title: template.title,
    question: fillTemplate(template.template, vars),
    variables: vars,
    answer,
    answerFormatted,
    workingSteps: template.workingStepsTemplate.map(s => fillTemplate(s, vars, extras)),
  }
}

export function getRandomDrill(topic?: string): GeneratedDrill {
  const templates = getAllTemplates()
  const pool = topic ? templates.filter(t => t.topic === topic) : templates
  const template = pool[Math.floor(Math.random() * pool.length)]
  return generateDrill(template.id)
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run -- tests/lib/drills.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add data/drills/templates.json lib/drills.ts tests/lib/drills.test.ts
git commit -m "feat: add drill template engine with 6 case-style math topics"
```

---

## Task 14: Drill API Routes and Page

**Files:**
- Create: `app/api/drills/route.ts`, `app/api/drills/attempts/route.ts`, `app/drills/page.tsx`

- [ ] **Step 1: Create drill API routes**

```ts
// app/api/drills/route.ts
import { NextResponse } from 'next/server'
import { getRandomDrill } from '@/lib/drills'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const topic = searchParams.get('topic') ?? undefined
  const drill = getRandomDrill(topic)
  return NextResponse.json(drill)
}
```

```ts
// app/api/drills/attempts/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

interface AttemptPayload {
  drillId: string
  drillType: 'real' | 'randomized'
  caseId?: string
  topic: string
  correct: boolean
  durationMs: number
}

export async function POST(req: Request) {
  const body = await req.json() as AttemptPayload
  const db = getDb()
  db.prepare(`
    INSERT INTO drill_attempts (drill_id, drill_type, case_id, topic, correct, duration_ms, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(body.drillId, body.drillType, body.caseId ?? null, body.topic, body.correct ? 1 : 0, body.durationMs, Date.now())
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create Math Drills page**

```tsx
// app/drills/page.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import type { GeneratedDrill } from '@/types/drill'

type Mode = 'real' | 'randomized'

export default function DrillsPage() {
  const [mode, setMode] = useState<Mode>('randomized')
  const [drill, setDrill] = useState<GeneratedDrill | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  async function fetchDrill() {
    setLoading(true)
    setRevealed(false)
    const r = await fetch('/api/drills')
    const d = await r.json() as GeneratedDrill
    setDrill(d)
    setStartTime(Date.now())
    setLoading(false)
  }

  useEffect(() => { fetchDrill() }, [])

  async function handleReveal(correct: boolean) {
    if (!drill) return
    const durationMs = Date.now() - startTime
    setRevealed(true)
    await fetch('/api/drills/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drillId: drill.drillId,
        drillType: mode,
        topic: drill.topic,
        correct,
        durationMs,
      }),
    })
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Math Drills</h1>

      <div className="flex gap-2 mb-6">
        {(['randomized', 'real'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {m === 'randomized' ? 'Quick Drills' : 'Real Case Problems'}
          </button>
        ))}
      </div>

      {loading || !drill ? (
        <div className="text-slate-400 text-sm">Loading drill...</div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-800 text-slate-100 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">{drill.title}</p>
            <p className="text-base leading-relaxed">{drill.question}</p>
          </div>

          {!revealed ? (
            <div className="flex gap-3">
              <button
                onClick={() => handleReveal(true)}
                className="flex-1 bg-green-100 text-green-800 hover:bg-green-200 font-semibold py-3 rounded-xl transition-colors"
              >
                Got it ✓
              </button>
              <button
                onClick={() => handleReveal(false)}
                className="flex-1 bg-red-100 text-red-800 hover:bg-red-200 font-semibold py-3 rounded-xl transition-colors"
              >
                Show answer
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
              <p className="text-xs uppercase tracking-widest text-green-800">Answer: <span className="text-lg font-bold">{drill.answerFormatted}</span></p>
              <div className="space-y-1">
                {drill.workingSteps.map((step, i) => (
                  <p key={i} className="text-sm text-green-900">{step}</p>
                ))}
              </div>
              <button
                onClick={fetchDrill}
                className="w-full bg-slate-800 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors mt-2"
              >
                Next Drill →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:3000/drills. Confirm a drill question appears, "Got it / Show answer" works, working steps are shown, and "Next Drill" loads a new one.

- [ ] **Step 4: Commit**

```bash
git add app/api/drills/ app/drills/page.tsx
git commit -m "feat: add math drills page with randomized drill engine"
```

---

## Task 15: Analytics API and Page

**Files:**
- Create: `app/api/analytics/route.ts`, `components/HeatMap.tsx`, `app/analytics/page.tsx`

- [ ] **Step 1: Create analytics API route**

```ts
// app/api/analytics/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAllCaseSummaries } from '@/lib/cases'
import { computeHeatMap, getWeakestCells, SKILLS } from '@/lib/analytics'

export async function GET() {
  const db = getDb()
  const cases = getAllCaseSummaries().map(c => ({ id: c.id, type: c.type }))
  const heatMap = computeHeatMap(db, cases)
  const weakestCells = getWeakestCells(heatMap, 2)
  const caseTypes = [...new Set(cases.map(c => c.type))]

  const drillRows = db.prepare(`
    SELECT topic,
      ROUND(AVG(correct) * 100) as accuracy,
      AVG(duration_ms) as avg_duration_ms,
      COUNT(*) as attempt_count
    FROM drill_attempts GROUP BY topic
  `).all() as { topic: string; accuracy: number; avg_duration_ms: number; attempt_count: number }[]

  return NextResponse.json({
    heatMap,
    caseTypes,
    skills: SKILLS,
    weakestCells,
    drillAccuracy: drillRows.map(r => ({
      topic: r.topic,
      accuracy: r.accuracy,
      avgDurationMs: r.avg_duration_ms,
      attemptCount: r.attempt_count,
    })),
  })
}
```

- [ ] **Step 2: Create HeatMap component**

```tsx
// components/HeatMap.tsx
import type { HeatMapCell } from '@/types/analytics'

interface Props {
  cells: HeatMapCell[]
  caseTypes: string[]
  skills: string[]
}

function cellColor(avg: number | null): string {
  if (avg === null) return 'bg-slate-100 text-slate-400'
  if (avg < 1.8) return 'bg-red-100 text-red-800'
  if (avg < 2.4) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

export default function HeatMap({ cells, caseTypes, skills }: Props) {
  function getCell(caseType: string, skill: string): HeatMapCell | undefined {
    return cells.find(c => c.caseType === caseType && c.skill === skill)
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm w-full">
        <thead>
          <tr>
            <th className="p-2 text-left text-slate-500 font-medium text-xs" />
            {skills.map(s => (
              <th key={s} className="p-2 text-center text-slate-600 font-medium text-xs whitespace-nowrap">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {caseTypes.map(ct => (
            <tr key={ct}>
              <td className="p-2 text-xs font-semibold text-slate-700 whitespace-nowrap pr-4 capitalize">{ct.replace('-', ' ')}</td>
              {skills.map(skill => {
                const cell = getCell(ct, skill)
                return (
                  <td key={skill} className="p-1 text-center">
                    <div className={`rounded-lg py-2 px-3 text-xs font-semibold ${cellColor(cell?.avgRating ?? null)}`}>
                      {cell?.avgRating != null ? cell.avgRating.toFixed(1) : '—'}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Below 1.8 — needs work</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 inline-block" /> 1.8–2.4 — developing</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Above 2.4 — strong</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create analytics page**

```tsx
// app/analytics/page.tsx
import { getDb } from '@/lib/db'
import { getAllCaseSummaries } from '@/lib/cases'
import { computeHeatMap, getWeakestCells, SKILLS } from '@/lib/analytics'
import HeatMap from '@/components/HeatMap'
import Link from 'next/link'

export default function AnalyticsPage() {
  const db = getDb()
  const cases = getAllCaseSummaries().map(c => ({ id: c.id, type: c.type }))
  const heatMap = computeHeatMap(db, cases)
  const weakestCells = getWeakestCells(heatMap, 2)
  const caseTypes = [...new Set(cases.map(c => c.type))]

  const drillRows = db.prepare(`
    SELECT topic, ROUND(AVG(correct) * 100) as accuracy, COUNT(*) as attempt_count
    FROM drill_attempts GROUP BY topic
  `).all() as { topic: string; accuracy: number; attempt_count: number }[]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Analytics</h1>

      {weakestCells.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-800 mb-2">Focus Areas</p>
          {weakestCells.map(c => (
            <p key={`${c.caseType}-${c.skill}`} className="text-sm text-red-700">
              · <strong>{c.skill}</strong> in <strong>{c.caseType.replace('-', ' ')}</strong> — avg {c.avgRating?.toFixed(1)}/3
            </p>
          ))}
          <Link href="/cases" className="text-xs text-red-600 underline mt-2 block">Browse cases to practice →</Link>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Performance by Case Type × Skill</h2>
        <HeatMap cells={heatMap} caseTypes={caseTypes} skills={SKILLS} />
      </div>

      {drillRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Math Drill Accuracy</h2>
          <div className="space-y-2">
            {drillRows.map(r => (
              <div key={r.topic} className="flex justify-between text-sm">
                <span className="text-slate-600 capitalize">{r.topic.replace('-', ' ')}</span>
                <span className={`font-semibold ${r.accuracy >= 70 ? 'text-green-700' : r.accuracy >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>
                  {r.accuracy}% ({r.attempt_count} attempts)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify in browser**

Complete a practice session first, then open http://localhost:3000/analytics. Confirm heat-map grid renders with color-coded cells. Verify all text is legible (dark text on light backgrounds throughout).

- [ ] **Step 5: Commit**

```bash
git add app/api/analytics/route.ts components/HeatMap.tsx app/analytics/page.tsx
git commit -m "feat: add analytics page with heat-map grid and drill accuracy"
```

---

## Task 16: Fit Prep and Framework Reference

**Files:**
- Create: `data/fit-questions/fit-questions.json`, `data/frameworks/frameworks.json`, `app/api/fit/seen/route.ts`, `app/fit/page.tsx`, `app/frameworks/page.tsx`

- [ ] **Step 1: Create fit questions data**

```json
// data/fit-questions/fit-questions.json
[
  { "id": "fit-01", "firm": "general", "theme": "leadership", "question": "Tell me about a time you led a team through an ambiguous situation.", "starGuide": "**Situation:** Set up a project or team context with genuine uncertainty.\n**Task:** Clarify what you were responsible for.\n**Action:** Describe how you created structure — broke the problem down, aligned the team, made decisions with incomplete information.\n**Result:** Quantify the outcome and what you learned about leading through ambiguity." },
  { "id": "fit-02", "firm": "general", "theme": "failure", "question": "Tell me about a time you failed. What did you learn?", "starGuide": "**Situation:** Choose a real failure — not a fake weakness.\n**Task:** What were you trying to achieve?\n**Action:** What went wrong and what was your role in it?\n**Result:** Be honest about the outcome. Focus on the concrete lesson and how you've applied it since." },
  { "id": "fit-03", "firm": "general", "theme": "impact", "question": "What is your greatest professional achievement?", "starGuide": "**Situation:** Set context for the challenge.\n**Task:** What specifically were you responsible for?\n**Action:** What did you do that was distinctive — not just your team?\n**Result:** Quantify impact (revenue, cost, time saved, scale). Explain why this achievement matters to you." },
  { "id": "fit-04", "firm": "mckinsey", "theme": "leadership", "question": "Tell me about a time you influenced someone senior to change their mind.", "starGuide": "**Situation:** Stakes should be meaningful.\n**Task:** What was the decision or belief you needed to change?\n**Action:** Describe your approach — did you use data, build a coalition, reframe the issue?\n**Result:** Did they change their mind? What was the outcome?" },
  { "id": "fit-05", "firm": "general", "theme": "teamwork", "question": "Describe a time you had a conflict with a team member. How did you resolve it?", "starGuide": "**Situation:** Be specific about the nature of the conflict.\n**Task:** What was at stake for the project or team?\n**Action:** How did you approach the conversation? Show emotional intelligence.\n**Result:** How was the conflict resolved? What was preserved or improved?" },
  { "id": "fit-06", "firm": "mckinsey", "theme": "why-firm", "question": "Why McKinsey?", "starGuide": "Cover three things: (1) Why consulting over alternatives — structured problem-solving, breadth of exposure. (2) Why McKinsey specifically — specific practice area, alumni network, problem-solving culture, One Firm model. (3) Why now — what you want to build in the next 2-3 years and why McKinsey is the best place to do it. Be specific. Avoid clichés like 'best firm in the world.'" },
  { "id": "fit-07", "firm": "bcg", "theme": "why-firm", "question": "Why BCG?", "starGuide": "Cover: (1) Why consulting. (2) BCG's differentiation — innovation focus, digital/tech practice strength, collaborative culture vs competitive. (3) Specific BCG work or initiatives that resonate with your interests. Name a BCG publication, practice area, or office that you have a genuine reason to mention." },
  { "id": "fit-08", "firm": "bain", "theme": "why-firm", "question": "Why Bain?", "starGuide": "Cover: (1) Why consulting. (2) Bain's differentiation — results orientation, single-industry staffing, strong PE practice, 'Bainie never lets a Bainie fail' culture. (3) Why Bain fits your specific career goals. Be concrete about what kind of work excites you." },
  { "id": "fit-09", "firm": "general", "theme": "analytical", "question": "Tell me about a time you used data to drive a decision.", "starGuide": "**Situation:** Set up the decision that needed to be made.\n**Task:** What data problem did you face?\n**Action:** What data did you gather, how did you analyze it, what insights emerged?\n**Result:** What decision was made based on your analysis? What was the outcome?" },
  { "id": "fit-10", "firm": "general", "theme": "leadership", "question": "Tell me about a time you had to make a decision with incomplete information.", "starGuide": "**Situation:** Frame the stakes and the time pressure.\n**Task:** What decision needed to be made?\n**Action:** How did you structure your thinking with limited data? Did you identify the key unknown, make a hypothesis, or gather a minimum viable set of data?\n**Result:** What did you decide, and what happened?" }
]
```

- [ ] **Step 2: Create frameworks data**

```json
// data/frameworks/frameworks.json
[
  {
    "id": "profitability-tree",
    "name": "Profitability Tree",
    "trigger": "Use when: client has declining profits, margin compression, or cost issues.",
    "structure": "Profit = Revenue − Costs\n\nRevenue\n  └── Price × Volume\n        └── Volume = # customers × purchase frequency × avg order size\n\nCosts\n  ├── Fixed costs (rent, salaries, depreciation)\n  └── Variable costs (COGS, shipping, commissions)\n\nAlways clarify: is this a revenue problem, a cost problem, or both? Benchmark against competitors and prior periods."
  },
  {
    "id": "market-entry",
    "name": "Market Entry Framework",
    "trigger": "Use when: client is considering entering a new market, geography, or segment.",
    "structure": "1. Market Attractiveness\n   · Size and growth rate\n   · Profitability of incumbents\n   · Customer needs (unmet?)\n\n2. Competitive Landscape\n   · Who are the players? Concentrated or fragmented?\n   · Barriers to entry (capital, regulation, brand, network effects)\n   · How will incumbents respond?\n\n3. Client Capabilities\n   · Does the client have relevant capabilities?\n   · What would need to be built or acquired?\n\n4. Entry Mode\n   · Greenfield (build), Acquisition (M&A), Joint Venture\n   · Timeline and investment required\n\n5. Financial Attractiveness\n   · Expected ROI / ROIC\n   · Payback period"
  },
  {
    "id": "ma-framework",
    "name": "M&A / Acquisition Framework",
    "trigger": "Use when: client is considering acquiring a company or being acquired.",
    "structure": "1. Strategic Rationale\n   · Why this target? Market share, capabilities, technology, geography?\n   · Alternatives (build vs buy vs partner)?\n\n2. Target Assessment\n   · Financial health (revenue, margins, growth, cash flow)\n   · Competitive position\n   · Key risks (customer concentration, key-person dependency, IP)\n\n3. Synergies\n   · Revenue synergies (cross-sell, new markets)\n   · Cost synergies (shared ops, procurement, headcount)\n   · Be specific and quantify\n\n4. Valuation\n   · DCF, EBITDA multiples, precedent transactions\n   · Is the price fair given synergies?\n\n5. Integration\n   · Culture fit\n   · Day-1 plan, 100-day plan\n   · Key retention risks"
  },
  {
    "id": "porters-five-forces",
    "name": "Porter's Five Forces",
    "trigger": "Use when: assessing industry attractiveness or competitive dynamics.",
    "structure": "1. Threat of New Entrants\n   · Capital requirements, economies of scale, brand loyalty, regulation\n\n2. Bargaining Power of Suppliers\n   · Concentration of suppliers, switching costs, uniqueness of inputs\n\n3. Bargaining Power of Buyers\n   · Buyer concentration, price sensitivity, switching costs\n\n4. Threat of Substitutes\n   · Availability of alternative products, customer propensity to switch\n\n5. Competitive Rivalry\n   · Number and size of competitors, industry growth rate, exit barriers\n\nHigh forces = less attractive industry for incumbents."
  },
  {
    "id": "3cs",
    "name": "3Cs Framework",
    "trigger": "Use when: need a quick market overview — company, customers, competitors.",
    "structure": "Company\n  · Strengths, capabilities, products, financials\n  · What can we do better than anyone else?\n\nCustomers\n  · Who are they? Segment by behavior, need, or value\n  · What do they value? What are their pain points?\n  · How are their needs changing?\n\nCompetitors\n  · Who are the main rivals?\n  · How do we compare on price, quality, service, distribution?\n  · What are their strategic moves?"
  },
  {
    "id": "4ps",
    "name": "4Ps Marketing Framework",
    "trigger": "Use when: client has a marketing, pricing, or go-to-market question.",
    "structure": "Product\n  · What is the product/service? Features, quality, differentiation\n  · Product lifecycle stage?\n\nPrice\n  · Pricing strategy (cost-plus, value-based, competitive)\n  · Price elasticity, discounting, bundling\n\nPlace (Distribution)\n  · Channels: direct, retail, online, wholesale\n  · Geographic coverage\n\nPromotion\n  · Advertising, PR, digital, sales force\n  · Budget allocation, target audience"
  }
]
```

- [ ] **Step 3: Create fit seen API**

```ts
// app/api/fit/seen/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const rows = db.prepare('SELECT question_id FROM fit_seen').all() as { question_id: string }[]
  return NextResponse.json(rows.map(r => r.question_id))
}

export async function POST(req: Request) {
  const { questionId } = await req.json() as { questionId: string }
  const db = getDb()
  db.prepare('INSERT OR IGNORE INTO fit_seen (question_id, first_seen_at) VALUES (?, ?)').run(questionId, Date.now())
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Create Fit Prep page**

```tsx
// app/fit/page.tsx
'use client'
import { useState, useEffect } from 'react'

interface FitQuestion {
  id: string
  firm: string
  theme: string
  question: string
  starGuide: string
}

export default function FitPage() {
  const [questions, setQuestions] = useState<FitQuestion[]>([])
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/fit-questions.json').then(r => r.json()).then(setQuestions)
    fetch('/api/fit/seen').then(r => r.json()).then((ids: string[]) => setSeen(new Set(ids)))
  }, [])

  async function markSeen(id: string) {
    if (seen.has(id)) return
    setSeen(prev => new Set([...prev, id]))
    await fetch('/api/fit/seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: id }),
    })
  }

  function toggleReveal(id: string) {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    markSeen(id)
  }

  const themes = [...new Set(questions.map(q => q.theme))]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Fit / Behavioral Prep</h1>
      <p className="text-slate-500 mb-6">{seen.size} of {questions.length} questions seen</p>
      <div className="space-y-3">
        {questions.map(q => (
          <div key={q.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => { setActiveId(activeId === q.id ? null : q.id); markSeen(q.id) }}
              className="w-full text-left px-5 py-4 flex justify-between items-center"
            >
              <div>
                <p className="text-xs text-slate-400 mb-1 capitalize">{q.firm} · {q.theme}</p>
                <p className="text-sm font-medium text-slate-800">{q.question}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {seen.has(q.id) && <span className="text-xs text-green-600">Seen</span>}
                <span className="text-slate-400">{activeId === q.id ? '▲' : '▼'}</span>
              </div>
            </button>
            {activeId === q.id && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                <button
                  onClick={() => toggleReveal(q.id)}
                  className="text-xs text-blue-600 hover:underline mb-3 block"
                >
                  {revealed.has(q.id) ? 'Hide STAR guide' : 'Show STAR guide'}
                </button>
                {revealed.has(q.id) && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <pre className="text-sm text-green-900 whitespace-pre-wrap font-sans leading-relaxed">{q.starGuide}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Move fit-questions.json to public for client-side fetch**

```bash
cp data/fit-questions/fit-questions.json public/fit-questions.json
cp data/frameworks/frameworks.json public/frameworks.json
```

- [ ] **Step 6: Create Framework Reference page**

```tsx
// app/frameworks/page.tsx
'use client'
import { useState, useEffect } from 'react'

interface Framework {
  id: string
  name: string
  trigger: string
  structure: string
}

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/frameworks.json').then(r => r.json()).then(setFrameworks)
  }, [])

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Framework Reference</h1>
      <p className="text-slate-500 mb-6">Click any framework to see its structure.</p>
      <div className="space-y-3">
        {frameworks.map(f => (
          <div key={f.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setActiveId(activeId === f.id ? null : f.id)}
              className="w-full text-left px-5 py-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-slate-800 text-sm">{f.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.trigger}</p>
              </div>
              <span className="text-slate-400 ml-4">{activeId === f.id ? '▲' : '▼'}</span>
            </button>
            {activeId === f.id && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4 bg-slate-50">
                <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">{f.structure}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Verify in browser**

Check http://localhost:3000/fit and http://localhost:3000/frameworks. Confirm all text is legible (dark text on light backgrounds). Confirm "Seen" badge appears after opening a question.

- [ ] **Step 8: Commit**

```bash
git add data/fit-questions/ data/frameworks/ public/fit-questions.json public/frameworks.json app/api/fit/ app/fit/page.tsx app/frameworks/page.tsx
git commit -m "feat: add fit prep and framework reference pages"
```

---

## Task 17: Dashboard

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Build dashboard page**

```tsx
// app/page.tsx
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { getAllCaseSummaries } from '@/lib/cases'
import { computeHeatMap, getWeakestCells, SKILLS } from '@/lib/analytics'

export default function DashboardPage() {
  const db = getDb()
  const allCases = getAllCaseSummaries()

  const completedCount = (db.prepare(`
    SELECT COUNT(DISTINCT case_id) as n FROM practice_sessions WHERE overall_rating IS NOT NULL
  `).get() as { n: number }).n

  const recentSessions = db.prepare(`
    SELECT ps.id, ps.case_id, ps.started_at, ps.overall_rating
    FROM practice_sessions ps WHERE ps.overall_rating IS NOT NULL
    ORDER BY ps.started_at DESC LIMIT 5
  `).all() as { id: number; case_id: string; started_at: number; overall_rating: number }[]

  const heatMap = computeHeatMap(db, allCases.map(c => ({ id: c.id, type: c.type })))
  const weakest = getWeakestCells(heatMap, 2)

  const pct = allCases.length > 0 ? Math.round((completedCount / allCases.length) * 100) : 0

  const caseMap = Object.fromEntries(allCases.map(c => [c.id, c.title]))

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Progress ring (CSS-only) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#3b82f6" strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">{pct}%</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Cases Done</p>
            <p className="text-xs text-slate-500">{completedCount} of {allCases.length}</p>
          </div>
        </div>

        {/* Weakest spots */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Focus Areas</p>
          {weakest.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Complete a case to see your weak spots.</p>
          ) : weakest.map(c => (
            <p key={`${c.caseType}-${c.skill}`} className="text-sm text-red-700">
              · <strong>{c.skill}</strong> in <strong>{c.caseType.replace('-', ' ')}</strong> — avg {c.avgRating?.toFixed(1)}/3
            </p>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link href="/cases" className="block bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 transition-colors">
          <p className="font-semibold mb-1">Start a Case</p>
          <p className="text-sm text-blue-100">Browse the Wharton 2017 casebook →</p>
        </Link>
        <Link href="/drills" className="block bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-5 transition-colors">
          <p className="font-semibold mb-1">Quick Math Drill</p>
          <p className="text-sm text-slate-300">Randomized case-style calculations →</p>
        </Link>
      </div>

      {recentSessions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Recent Sessions</p>
          <div className="space-y-2">
            {recentSessions.map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <Link href={`/cases/${s.case_id}`} className="text-slate-700 hover:underline">
                  {caseMap[s.case_id] ?? s.case_id}
                </Link>
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${s.overall_rating === 3 ? 'text-green-700' : s.overall_rating === 2 ? 'text-yellow-700' : 'text-red-700'}`}>
                    {s.overall_rating}/3
                  </span>
                  <span className="text-slate-400">{new Date(s.started_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3000. Confirm progress ring, focus areas, quick-action cards, and recent sessions all render. With no sessions, confirm graceful empty states.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add dashboard with progress ring, weak spots, and recent sessions"
```

---

## Task 18: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm run test:run
```
Expected: All tests PASS.

- [ ] **Step 2: End-to-end smoke test**

Walk through this sequence in the browser:
1. http://localhost:3000 — dashboard loads, no errors
2. http://localhost:3000/cases — both cases appear
3. Click Case 2 → Start Practice Session → complete all 6 cards → give overall rating
4. Return to dashboard — progress ring updates, case appears in recent sessions
5. http://localhost:3000/analytics — heat-map shows data from the session
6. http://localhost:3000/drills — generate and complete 3 drills
7. http://localhost:3000/analytics — drill accuracy strip appears
8. http://localhost:3000/fit — open 3 questions, confirm "Seen" badge appears
9. http://localhost:3000/frameworks — expand all 6 frameworks, confirm text is readable

- [ ] **Step 3: Accessibility check**

Manually verify in the browser: no light-text-on-light-background combinations appear anywhere. Check: interviewer card (white on slate-800 ✓), model answer (green-900 on green-50 ✓), rating buttons (red-800 on red-100 ✓, yellow-800 on yellow-100 ✓, green-800 on green-100 ✓), heat-map cells (same color pairs ✓).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete CaseInterviewer v1 — all modules working"
```
