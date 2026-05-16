# CaseInterviewer — Design Spec
**Date:** 2026-05-15
**Stack:** Next.js (App Router) + SQLite (better-sqlite3)
**Target user:** Solo MBB case interview candidate (single user, local app)

---

## 1. Goals

A self-contained web app for practicing MBB case interviews alone, without an AI interviewer or API costs. The app is a hub with a case bank, a structured practice system, mental math drills, weak-spot analytics, behavioral prep, and a framework reference. All data lives locally.

---

## 2. Architecture

```
Next.js App Router (single repo, run locally with `npm run dev`)
├── /app                        ← pages & layouts (App Router)
├── /app/api                    ← API routes for all data reads/writes
├── /data/cases                 ← case JSON files (one per case, pre-populated from PDF)
├── /data/drills                ← randomized drill templates
├── /data/frameworks            ← framework flashcard JSON
├── /data/fit-questions         ← behavioral question bank JSON
├── /lib/db.ts                  ← SQLite client (better-sqlite3 singleton)
└── /db/schema.sql              ← table definitions
```

**Data flow:**
- Case content, drills, frameworks, and fit questions are static JSON files — read-only, never written at runtime.
- All user-generated data (session results, ratings, checklist completions, drill scores) is written to SQLite via API routes.
- Analytics are computed server-side via SQLite queries and returned to the UI.
- No external network calls. No authentication. Single-user only.

---

## 3. Case Data Structure

Each case is stored as a JSON file in `/data/cases/`. Cases are pre-populated manually from the Wharton Casebook 2017 PDF (and any future casebooks added later).

```json
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
      "interviewer": "Your client is a leading Brazilian highway concessions company looking to expand internationally...",
      "question": "What clarifying questions would you ask?",
      "modelAnswer": "...",
      "checklistItems": [
        "Asked about target geographies",
        "Asked about current capabilities / language",
        "Asked about timeline and budget"
      ]
    },
    {
      "index": 1,
      "type": "framework",
      "interviewer": "Good questions. Here is what the client told us: [Q&A reveals]. Now, how would you structure your approach?",
      "question": "Walk me through your framework.",
      "modelAnswer": "...",
      "checklistItems": [
        "Identified culture and management complexity",
        "Identified pipeline and economic prospects",
        "Identified political environment",
        "Identified competitive environment"
      ]
    },
    {
      "index": 2,
      "type": "exhibit",
      "exhibitType": "chart",
      "exhibitRef": "wharton-2017-02-chart-1.png",
      "interviewer": "We've gathered data on South American markets. Here's a chart comparing pipeline against ease of doing business.",
      "question": "Which markets should the client prioritize? Which should they eliminate?",
      "modelAnswer": "...",
      "checklistItems": [
        "Correctly identified upper-right quadrant as targets",
        "Named Mexico, Colombia, Chile, Peru",
        "Eliminated lower-left countries",
        "Addressed Argentina edge case"
      ]
    },
    {
      "index": 3,
      "type": "math",
      "interviewer": "The client has decided to focus on South America. They are considering two entry routes: primary investment vs M&A.",
      "question": "Calculate the ROIC for each option.",
      "data": {
        "primary": { "km": 300, "dollarsPerKm": 5, "trafficPerMonth": 20000, "opex": 0.30, "investment": 150000000, "discountRate": 0.10 },
        "ma": { "annualRevenue": 120000000, "opex": 0.40, "investment": 750000000, "synergies": 0.15, "discountRate": 0.10 }
      },
      "modelAnswer": "Primary: ROIC = 40%. M&A: ROIC = 20%. Primary investment is superior on ROIC.",
      "checklistItems": [
        "Correctly computed primary annual revenue ($30M)",
        "Correctly computed primary annual profit ($21M)",
        "Correctly computed primary ROIC (40%)",
        "Correctly computed M&A annual profit ($90M)",
        "Correctly computed M&A ROIC (20%)",
        "Drew the correct conclusion (primary investment)"
      ]
    },
    {
      "index": 4,
      "type": "recommendation",
      "interviewer": "The CEO is about to walk in.",
      "question": "Give your recommendation.",
      "modelAnswer": "...",
      "checklistItems": [
        "Led with a clear recommendation",
        "Quantified the expected benefit",
        "Named 2+ key risks",
        "Proposed next steps"
      ]
    }
  ]
}
```

**Card types:** `prompt`, `framework`, `clarifying-qa`, `exhibit`, `qualitative`, `math`, `synthesis`, `recommendation`, `pushback`, `wrapup`

Each case will have approximately 10–15 cards to simulate the granularity of a real interviewer-led session.

**Exhibit images** (charts, data tables) are stored in `/public/exhibits/` and referenced by filename.

---

## 4. Database Schema

```sql
-- Tracks each time the user starts a case
CREATE TABLE practice_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  overall_rating INTEGER  -- 1-3, set at end of session
);

-- Tracks each individual card attempt within a session
CREATE TABLE card_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES practice_sessions(id),
  card_index INTEGER NOT NULL,
  card_type TEXT NOT NULL,
  self_rating INTEGER,       -- 1 (missed), 2 (partial), 3 (nailed it)
  checklist_json TEXT,       -- JSON array of booleans, one per checklistItem
  notes TEXT,
  revealed_at INTEGER        -- timestamp when model answer was revealed
);

-- Tracks math drill attempts (both real case-extracted and randomized)
CREATE TABLE drill_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  drill_id TEXT NOT NULL,
  drill_type TEXT NOT NULL,  -- 'real' | 'randomized'
  case_id TEXT,              -- nullable; set for real case-extracted drills
  topic TEXT NOT NULL,       -- e.g. 'roic', 'market-sizing', 'percentages'
  correct INTEGER NOT NULL,  -- 0 or 1
  duration_ms INTEGER,
  created_at INTEGER NOT NULL
);

-- Tracks which fit/behavioral questions have been seen
CREATE TABLE fit_seen (
  question_id TEXT PRIMARY KEY,
  first_seen_at INTEGER NOT NULL
);
```

---

## 5. Core Pages

### 5.1 Dashboard (`/`)
- Progress ring: X of N cases completed (at least one session with overall_rating set)
- "Your Weakest Spots" strip: top 2 red cells from analytics grid (case type × skill with lowest avg rating)
- "Suggested Next" card: lowest-rated case type not practiced in the last 3 sessions, with a specific case recommendation
- Recent sessions list: last 5 sessions with case name, date, overall rating

### 5.2 Case Bank (`/cases`)
- Grid of all cases, filterable by: case type, difficulty, firm, completion status
- Each card shows: title, number, difficulty badge, firm, topics, best overall rating (or "Not started")
- Click → goes to case detail page (`/cases/[id]`) showing full case overview and a "Start Practice" button
- If previously attempted, shows session history (dates + ratings)

### 5.3 Case Practice (`/cases/[id]/practice`)
- Card-flip interface, one card at a time
- Progress bar at top (card N of M)
- Each card:
  - **Front:** Interviewer prompt (dark navy card) + exhibit image if applicable + "Flip — See Model Answer" button + optional notes textarea
  - **Back:** Model answer (green card) + checklist (checkbox per item) + 1/2/3 self-rating buttons
- "Next Card" advances; "Previous" goes back (read-only, no re-rating)
- Final card triggers: overall session rating (1–3) + session summary (cards rated by level, checklist items missed)
- Session written to SQLite on completion

### 5.4 Math Drills (`/drills`)
Two sub-modes on one page, toggled by tab:
- **Real Problems:** Case-sourced cards with data tables; same flip mechanic as practice cards. Filterable by topic or case.
- **Quick Drills:** Randomized calculations generated from templates in `/data/drills/`. Each template defines a topic, a formula, named variable ranges (e.g. revenue: $100M–$2B), and the answer derivation. At runtime, the API route fills in random values within the ranges and computes the correct answer server-side. Timer shown. User types answer, submits, sees correct answer + step-by-step working. Accuracy and speed logged. Topics: market sizing, percentage change, payback period, ROIC, margin, CAGR.

### 5.5 Analytics (`/analytics`)
- **Heat-map grid:** Rows = case types (Profitability, Market Entry, M&A, Market Sizing, Industry Analysis, etc.), Columns = skills (Framework, Math, Graphical Interpretation, Recommendation, Clarifying Questions). Each cell = average self-rating across all card attempts of that type. Color: red < 1.8, yellow 1.8–2.4, green > 2.4. Empty cells (no data yet) shown in neutral gray.
- **Suggested Focus box:** Surfaces the 2 weakest cells and links to the most relevant case or drill.
- **Drill accuracy strip:** Overall math drill accuracy % and average response time, broken down by topic.
- All text must meet WCAG AA contrast requirements. No light text on light backgrounds.

### 5.6 Fit / Behavioral Prep (`/fit`)
- Bank of common MBB behavioral questions (pre-written, ~20–30 questions)
- Same card-flip format: question on front, STAR-structured model answer on back
- "Seen / Not seen" tracking only — no rating, no analytics
- Questions filterable by firm (McKinsey / BCG / Bain) and theme (leadership, failure, impact, etc.)

### 5.7 Framework Reference (`/frameworks`)
- Static flashcard deck of common consulting frameworks
- Front: framework name + "When to use" trigger sentence
- Back: framework structure laid out visually (tree, matrix, or list)
- Examples: Profitability tree, Porter's 5 Forces, 4Ps, 3Cs, M&A synergy framework, Market entry checklist
- No tracking needed — pure reference

---

## 6. Analytics Logic

Weak-spot score for a (case_type, skill) cell:

```sql
SELECT AVG(ca.self_rating) as avg_rating
FROM card_attempts ca
JOIN practice_sessions ps ON ca.session_id = ps.id
WHERE ps.case_id IN (SELECT id FROM cases WHERE type = ?)
  AND ca.card_type = ?
  AND ca.self_rating IS NOT NULL
```

Skill → card_type mapping:
- Framework → `framework`
- Math → `math`
- Graphical Interpretation → `exhibit`
- Recommendation → `recommendation`
- Clarifying Questions → `clarifying-qa`

---

## 7. Tech Stack Detail

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | SQLite via `better-sqlite3` |
| Styling | Tailwind CSS |
| Charts (analytics) | Plain CSS grid (heat-map) — no charting library needed |
| State management | None needed (server components + API routes) |
| Case data | Static JSON files in `/data/cases/` |
| Exhibit images | Static files in `/public/exhibits/` |
| Deployment | Local only (`npm run dev`); can deploy to Vercel free tier later |

---

## 8. Out of Scope

- AI-powered feedback or evaluation (no API costs)
- Multi-user / authentication
- Cloud sync
- Mobile-native app
- Spaced repetition scheduling (may add later)
- Audio/video recording of practice sessions

---

## 9. Case Data Population Plan

The Wharton 2017 casebook PDF (201 pages, ~15–20 cases) will be pre-populated as JSON before the app is built. Strategy:
1. Read each case from the PDF
2. Identify card boundaries (each distinct interviewer prompt = one card)
3. Write model answers and checklist items from the casebook's guidance text
4. Save exhibit images to `/public/exhibits/`
5. Validate JSON structure matches schema before committing
