# Math Drills Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the drill bank from 6 → ~35 templates across 10 topics, add difficulty levels, replace the mode toggle with topic + difficulty filter pills.

**Architecture:** Types gain a `difficulty` field; 7 new compute functions are added to `lib/drills.ts`; `data/drills/templates.json` is replaced with the full bank; the API route accepts a `?difficulty=` param; the drills page replaces the mode toggle with two filter bars.

**Tech Stack:** TypeScript, Next.js 16 App Router, `@libsql/client`, Vitest

---

## File Map

| File | Change |
|---|---|
| `types/drill.ts` | Add `difficulty` to both interfaces |
| `lib/drills.ts` | 7 new compute functions; `getRandomDrill` accepts `difficulty`; `generateDrill` passes `difficulty` through |
| `data/drills/templates.json` | Replace entirely — 35 templates |
| `app/api/drills/route.ts` | Read `?difficulty=` query param |
| `app/drills/page.tsx` | Remove mode toggle; add topic + difficulty filter bars |
| `tests/lib/drills.test.ts` | Tests for new compute functions and difficulty filtering |

---

### Task 1: Add `difficulty` to types

**Files:**
- Modify: `types/drill.ts`

- [ ] **Update both interfaces**

Replace the contents of `types/drill.ts` with:

```typescript
export interface DrillVariable {
  min: number
  max: number
  step: number
}

export interface DrillTemplate {
  id: string
  topic: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  template: string
  variables: Record<string, DrillVariable>
  computeFnKey: string
  answerFormat: 'percentage' | 'currency' | 'years' | 'number' | 'multiplier'
  workingStepsTemplate: string[]
}

export interface GeneratedDrill {
  drillId: string
  topic: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  variables: Record<string, number>
  answer: number
  answerFormatted: string
  workingSteps: string[]
}
```

Note: `'multiplier'` is added to `answerFormat` for EV/EBITDA and P/E multiples.

- [ ] **Commit**

```bash
git add types/drill.ts
git commit -m "feat(drills): add difficulty field and multiplier format to types"
```

---

### Task 2: Add compute functions and update lib/drills.ts

**Files:**
- Modify: `lib/drills.ts`

- [ ] **Write failing tests first**

Replace `tests/lib/drills.test.ts` with:

```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { generateDrill, getAllTemplates, getRandomDrill } from '@/lib/drills'

describe('existing compute functions', () => {
  it('roic-basic computes correctly', () => {
    const drill = generateDrill('roic-basic', { investment: 200, annualProfit: 30, discountRatePct: 10 })
    expect(drill.answer).toBeCloseTo(0.5, 5)
    expect(drill.difficulty).toBeDefined()
  })

  it('payback-basic generates with random variables', () => {
    const drill = generateDrill('payback-basic')
    expect(drill.answer).toBeGreaterThan(0)
    expect(drill.question).toBeTruthy()
  })

  it('formats percentage answers correctly', () => {
    const drill = generateDrill('roic-basic', { investment: 100, annualProfit: 10, discountRatePct: 10 })
    expect(drill.answerFormatted).toMatch(/%/)
  })
})

describe('new compute functions', () => {
  it('markup-to-margin: 25% markup → 20% margin', () => {
    const drill = generateDrill('markup-to-margin-easy', { markupPct: 25 })
    expect(drill.answer).toBeCloseTo(0.2, 5)
  })

  it('break-even-units: 1000 fixed / (50-30) = 50 units', () => {
    const drill = generateDrill('break-even-units-easy', { fixedCosts: 1000, price: 50, variableCost: 30 })
    expect(drill.answer).toBeCloseTo(50, 5)
  })

  it('break-even-revenue: 500 fixed / 50% margin = $1000', () => {
    const drill = generateDrill('break-even-revenue-easy', { fixedCosts: 500, grossMarginPct: 50 })
    expect(drill.answer).toBeCloseTo(1000, 5)
  })

  it('ltv-basic: arpu=100, margin=80%, churn=10% → LTV=800', () => {
    const drill = generateDrill('ltv-basic-easy', { arpu: 100, marginPct: 80, churnPct: 10 })
    expect(drill.answer).toBeCloseTo(800, 5)
  })

  it('ltv-cac: LTV=800, CAC=200 → ratio=4', () => {
    const drill = generateDrill('ltv-cac-easy', { arpu: 100, marginPct: 80, churnPct: 10, cac: 200 })
    expect(drill.answer).toBeCloseTo(4, 5)
  })

  it('simple-ratio: 12 / 2 = 6', () => {
    const drill = generateDrill('ev-ebitda-easy', { ev: 120, ebitda: 20 })
    expect(drill.answer).toBeCloseTo(6, 5)
  })

  it('rev-price-volume: price +10%, volume +5% → revenue +15.5%', () => {
    const drill = generateDrill('rev-price-volume-medium', { priceDeltaPct: 10, volumeDeltaPct: 5 })
    expect(drill.answer).toBeCloseTo(0.155, 5)
  })
})

describe('getAllTemplates', () => {
  it('loads more than 30 templates', () => {
    expect(getAllTemplates().length).toBeGreaterThan(30)
  })

  it('every template has a difficulty field', () => {
    getAllTemplates().forEach(t => {
      expect(['easy', 'medium', 'hard']).toContain(t.difficulty)
    })
  })
})

describe('getRandomDrill filtering', () => {
  it('filters by topic', () => {
    const drill = getRandomDrill('margins')
    expect(drill.topic).toBe('margins')
  })

  it('filters by difficulty', () => {
    const drill = getRandomDrill(undefined, 'easy')
    expect(drill.difficulty).toBe('easy')
  })

  it('filters by both topic and difficulty', () => {
    const drill = getRandomDrill('margins', 'hard')
    expect(drill.topic).toBe('margins')
    expect(drill.difficulty).toBe('hard')
  })
})
```

- [ ] **Run tests — confirm they all fail**

```bash
npx vitest run tests/lib/drills.test.ts
```

Expected: multiple failures (new template IDs don't exist yet, `difficulty` not on `GeneratedDrill`, `getRandomDrill` doesn't accept second arg).

- [ ] **Update `lib/drills.ts`**

Replace the file with:

```typescript
import fs from 'fs'
import path from 'path'
import type { DrillTemplate, GeneratedDrill } from '@/types/drill'

type ComputeFn = (vars: Record<string, number>) => number

const computeFunctions: Record<string, ComputeFn> = {
  // --- existing ---
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

  // --- new ---
  'markup-to-margin': ({ markupPct }) => markupPct / (100 + markupPct),
  'break-even-units': ({ fixedCosts, price, variableCost }) => fixedCosts / (price - variableCost),
  'break-even-revenue': ({ fixedCosts, grossMarginPct }) => fixedCosts / (grossMarginPct / 100),
  'ltv-basic': ({ arpu, marginPct, churnPct }) => arpu * (marginPct / 100) / (churnPct / 100),
  'ltv-cac': ({ arpu, marginPct, churnPct, cac }) =>
    (arpu * (marginPct / 100) / (churnPct / 100)) / cac,
  'simple-ratio': ({ numerator, denominator }) => numerator / denominator,
  'rev-price-volume': ({ priceDeltaPct, volumeDeltaPct }) =>
    (1 + priceDeltaPct / 100) * (1 + volumeDeltaPct / 100) - 1,
}

function formatAnswer(value: number, format: DrillTemplate['answerFormat']): string {
  switch (format) {
    case 'percentage': return `${(value * 100).toFixed(1)}%`
    case 'currency': return `$${(value / 1_000_000).toFixed(0)}M`
    case 'years': return `${value.toFixed(1)} years`
    case 'number': return value.toFixed(0)
    case 'multiplier': return `${value.toFixed(1)}x`
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

  // extras for workingStepsTemplate interpolation
  const extras: Record<string, string> = { answerFormatted }
  if (template.computeFnKey === 'roic-basic') {
    extras['value'] = (vars['annualProfit'] / (vars['discountRatePct'] / 100)).toFixed(0)
  }
  if (template.computeFnKey === 'margin-calc') {
    extras['profit'] = (vars['revenue'] - vars['costs']).toFixed(0)
  }
  if (template.computeFnKey === 'market-sizing') {
    extras['customers'] = (vars['population'] * (vars['penetrationPct'] / 100)).toFixed(1)
  }
  if (template.computeFnKey === 'break-even-units') {
    extras['contribution'] = (vars['price'] - vars['variableCost']).toFixed(0)
  }
  if (template.computeFnKey === 'break-even-revenue') {
    extras['marginDecimal'] = (vars['grossMarginPct'] / 100).toFixed(2)
  }
  if (template.computeFnKey === 'ltv-basic' || template.computeFnKey === 'ltv-cac') {
    extras['ltv'] = ((vars['arpu'] * (vars['marginPct'] / 100)) / (vars['churnPct'] / 100)).toFixed(0)
  }
  if (template.computeFnKey === 'rev-price-volume') {
    extras['totalPct'] = ((answer) * 100).toFixed(1)
  }

  return {
    drillId: `${templateId}-${Date.now()}`,
    topic: template.topic,
    title: template.title,
    difficulty: template.difficulty,
    question: fillTemplate(template.template, vars),
    variables: vars,
    answer,
    answerFormatted,
    workingSteps: template.workingStepsTemplate.map(s => fillTemplate(s, vars, extras)),
  }
}

export function getRandomDrill(topic?: string, difficulty?: string): GeneratedDrill {
  const templates = getAllTemplates()
  let pool = templates
  if (topic) pool = pool.filter(t => t.topic === topic)
  if (difficulty) pool = pool.filter(t => t.difficulty === difficulty)
  if (pool.length === 0) pool = templates // fallback: ignore filters if combo yields nothing
  const template = pool[Math.floor(Math.random() * pool.length)]
  return generateDrill(template.id)
}
```

- [ ] **Run tests — most should still fail (templates don't exist yet)**

```bash
npx vitest run tests/lib/drills.test.ts
```

Expected: existing tests pass; new template ID tests still fail with "Unknown drill template".

- [ ] **Commit**

```bash
git add lib/drills.ts tests/lib/drills.test.ts
git commit -m "feat(drills): add 7 compute functions, difficulty support, topic+difficulty filtering"
```

---

### Task 3: Write the full template bank

**Files:**
- Replace: `data/drills/templates.json`

- [ ] **Replace `data/drills/templates.json` with the full 35-template bank**

```json
[
  {
    "id": "pct-change-easy",
    "topic": "percentages",
    "title": "Percentage Change",
    "difficulty": "easy",
    "template": "Revenue grew from ${{oldValue}}M to ${{newValue}}M. What is the percentage change?",
    "variables": {
      "oldValue": { "min": 100, "max": 400, "step": 100 },
      "newValue": { "min": 150, "max": 600, "step": 50 }
    },
    "computeFnKey": "pct-change",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "% Change = (New − Old) / Old = (${{newValue}}M − ${{oldValue}}M) / ${{oldValue}}M = {{answerFormatted}}"
    ]
  },
  {
    "id": "pct-change-medium",
    "topic": "percentages",
    "title": "Percentage Change",
    "difficulty": "medium",
    "template": "A product's price dropped from ${{oldValue}} to ${{newValue}}. What is the percentage change?",
    "variables": {
      "oldValue": { "min": 40, "max": 250, "step": 10 },
      "newValue": { "min": 20, "max": 230, "step": 5 }
    },
    "computeFnKey": "pct-change",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "% Change = (New − Old) / Old = (${{newValue}} − ${{oldValue}}) / ${{oldValue}} = {{answerFormatted}}"
    ]
  },
  {
    "id": "markup-to-margin-easy",
    "topic": "percentages",
    "title": "Markup to Margin",
    "difficulty": "easy",
    "template": "A retailer marks up products by {{markupPct}}%. What is the gross margin percentage?",
    "variables": {
      "markupPct": { "min": 25, "max": 100, "step": 25 }
    },
    "computeFnKey": "markup-to-margin",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Margin = Markup / (100 + Markup) = {{markupPct}} / (100 + {{markupPct}}) = {{answerFormatted}}"
    ]
  },
  {
    "id": "margin-easy",
    "topic": "margins",
    "title": "Gross Margin",
    "difficulty": "easy",
    "template": "A company has ${{revenue}}M in revenue and ${{costs}}M in COGS. What is the gross margin?",
    "variables": {
      "revenue": { "min": 100, "max": 500, "step": 100 },
      "costs": { "min": 50, "max": 400, "step": 50 }
    },
    "computeFnKey": "margin-calc",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Gross Profit = Revenue − COGS = ${{revenue}}M − ${{costs}}M = ${{profit}}M",
      "Gross Margin = Gross Profit / Revenue = ${{profit}}M / ${{revenue}}M = {{answerFormatted}}"
    ]
  },
  {
    "id": "margin-medium",
    "topic": "margins",
    "title": "Operating Margin",
    "difficulty": "medium",
    "template": "A firm earns ${{revenue}}M in revenue with ${{costs}}M in operating costs (COGS + SG&A + R&D). What is the operating margin?",
    "variables": {
      "revenue": { "min": 200, "max": 1000, "step": 50 },
      "costs": { "min": 100, "max": 900, "step": 25 }
    },
    "computeFnKey": "margin-calc",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Operating Income = Revenue − Costs = ${{revenue}}M − ${{costs}}M = ${{profit}}M",
      "Operating Margin = Operating Income / Revenue = ${{profit}}M / ${{revenue}}M = {{answerFormatted}}"
    ]
  },
  {
    "id": "ebitda-margin-medium",
    "topic": "margins",
    "title": "EBITDA Margin",
    "difficulty": "medium",
    "template": "A company reports ${{revenue}}M revenue and ${{costs}}M in total cash operating costs. What is the EBITDA margin?",
    "variables": {
      "revenue": { "min": 300, "max": 2000, "step": 100 },
      "costs": { "min": 150, "max": 1800, "step": 50 }
    },
    "computeFnKey": "margin-calc",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "EBITDA = Revenue − Cash Costs = ${{revenue}}M − ${{costs}}M = ${{profit}}M",
      "EBITDA Margin = EBITDA / Revenue = ${{profit}}M / ${{revenue}}M = {{answerFormatted}}"
    ]
  },
  {
    "id": "contribution-margin-hard",
    "topic": "margins",
    "title": "Contribution Margin",
    "difficulty": "hard",
    "template": "A product sells for ${{revenue}} per unit with ${{costs}} in variable costs per unit. What is the contribution margin percentage?",
    "variables": {
      "revenue": { "min": 50, "max": 500, "step": 10 },
      "costs": { "min": 20, "max": 450, "step": 10 }
    },
    "computeFnKey": "margin-calc",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Contribution = Price − Variable Cost = ${{revenue}} − ${{costs}} = ${{profit}}",
      "Contribution Margin % = Contribution / Price = ${{profit}} / ${{revenue}} = {{answerFormatted}}"
    ]
  },
  {
    "id": "cagr-easy",
    "topic": "growth",
    "title": "Calculate CAGR",
    "difficulty": "easy",
    "template": "A market grew from ${{startValue}}B to ${{endValue}}B over {{years}} years. What was the CAGR?",
    "variables": {
      "startValue": { "min": 2, "max": 10, "step": 2 },
      "endValue": { "min": 4, "max": 20, "step": 2 },
      "years": { "min": 3, "max": 5, "step": 1 }
    },
    "computeFnKey": "cagr-basic",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "CAGR = (End / Start)^(1/Years) − 1 = (${{endValue}}B / ${{startValue}}B)^(1/{{years}}) − 1 = {{answerFormatted}}"
    ]
  },
  {
    "id": "cagr-medium",
    "topic": "growth",
    "title": "Calculate CAGR",
    "difficulty": "medium",
    "template": "Revenue grew from ${{startValue}}M to ${{endValue}}M over {{years}} years. What was the CAGR?",
    "variables": {
      "startValue": { "min": 50, "max": 300, "step": 25 },
      "endValue": { "min": 100, "max": 800, "step": 25 },
      "years": { "min": 4, "max": 8, "step": 1 }
    },
    "computeFnKey": "cagr-basic",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "CAGR = (End / Start)^(1/Years) − 1 = (${{endValue}}M / ${{startValue}}M)^(1/{{years}}) − 1 = {{answerFormatted}}"
    ]
  },
  {
    "id": "yoy-growth-medium",
    "topic": "growth",
    "title": "Year-over-Year Growth",
    "difficulty": "medium",
    "template": "A division had ${{oldValue}}M revenue last year and ${{newValue}}M this year. What is the YoY growth rate?",
    "variables": {
      "oldValue": { "min": 80, "max": 600, "step": 20 },
      "newValue": { "min": 90, "max": 750, "step": 15 }
    },
    "computeFnKey": "pct-change",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "YoY Growth = (This Year − Last Year) / Last Year = (${{newValue}}M − ${{oldValue}}M) / ${{oldValue}}M = {{answerFormatted}}"
    ]
  },
  {
    "id": "rev-price-volume-medium",
    "topic": "growth",
    "title": "Revenue Impact: Price × Volume",
    "difficulty": "medium",
    "template": "A company raises prices by {{priceDeltaPct}}% and volume grows by {{volumeDeltaPct}}%. What is the total revenue change?",
    "variables": {
      "priceDeltaPct": { "min": 3, "max": 15, "step": 1 },
      "volumeDeltaPct": { "min": 2, "max": 20, "step": 1 }
    },
    "computeFnKey": "rev-price-volume",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Revenue Change = (1 + Price%) × (1 + Volume%) − 1",
      "= (1 + {{priceDeltaPct}}%) × (1 + {{volumeDeltaPct}}%) − 1 = {{answerFormatted}}"
    ]
  },
  {
    "id": "market-sizing-easy",
    "topic": "market-sizing",
    "title": "Market Size Estimation",
    "difficulty": "easy",
    "template": "A market has {{population}}M potential customers. {{penetrationPct}}% are expected to adopt the product at ${{price}}/year. What is the total addressable market?",
    "variables": {
      "population": { "min": 50, "max": 300, "step": 50 },
      "penetrationPct": { "min": 10, "max": 40, "step": 10 },
      "price": { "min": 100, "max": 500, "step": 100 }
    },
    "computeFnKey": "market-sizing",
    "answerFormat": "currency",
    "workingStepsTemplate": [
      "Customers = {{population}}M × {{penetrationPct}}% = {{customers}}M",
      "TAM = {{customers}}M × ${{price}} = {{answerFormatted}}"
    ]
  },
  {
    "id": "market-sizing-medium",
    "topic": "market-sizing",
    "title": "Market Size Estimation",
    "difficulty": "medium",
    "template": "There are {{population}}M households in the target region. {{penetrationPct}}% own the relevant product, spending ${{price}}/year on average. Estimate the market size.",
    "variables": {
      "population": { "min": 20, "max": 200, "step": 10 },
      "penetrationPct": { "min": 5, "max": 35, "step": 5 },
      "price": { "min": 50, "max": 1500, "step": 50 }
    },
    "computeFnKey": "market-sizing",
    "answerFormat": "currency",
    "workingStepsTemplate": [
      "Adopters = {{population}}M × {{penetrationPct}}% = {{customers}}M households",
      "Market Size = {{customers}}M × ${{price}} = {{answerFormatted}}"
    ]
  },
  {
    "id": "market-sizing-hard",
    "topic": "market-sizing",
    "title": "Addressable Market Share",
    "difficulty": "hard",
    "template": "A market has {{population}}M consumers, {{penetrationPct}}% of whom are addressable. Average annual spend is ${{price}}. A new entrant captures 10% market share. What is the entrant's revenue?",
    "variables": {
      "population": { "min": 30, "max": 250, "step": 10 },
      "penetrationPct": { "min": 8, "max": 40, "step": 4 },
      "price": { "min": 75, "max": 2000, "step": 25 }
    },
    "computeFnKey": "market-sizing",
    "answerFormat": "currency",
    "workingStepsTemplate": [
      "TAM: {{population}}M × {{penetrationPct}}% × ${{price}} = {{answerFormatted}} (×10 before 10% share)",
      "Entrant Revenue = TAM × 10% = {{answerFormatted}}"
    ]
  },
  {
    "id": "break-even-units-easy",
    "topic": "break-even",
    "title": "Break-Even Units",
    "difficulty": "easy",
    "template": "A product sells for ${{price}} per unit with ${{variableCost}} variable cost. Fixed costs are ${{fixedCosts}}. How many units to break even?",
    "variables": {
      "price": { "min": 50, "max": 200, "step": 10 },
      "variableCost": { "min": 10, "max": 150, "step": 10 },
      "fixedCosts": { "min": 10000, "max": 100000, "step": 10000 }
    },
    "computeFnKey": "break-even-units",
    "answerFormat": "number",
    "workingStepsTemplate": [
      "Contribution per unit = Price − Variable Cost = ${{price}} − ${{variableCost}} = ${{contribution}}",
      "Break-Even Units = Fixed Costs / Contribution = ${{fixedCosts}} / ${{contribution}} = {{answerFormatted}} units"
    ]
  },
  {
    "id": "break-even-revenue-medium",
    "topic": "break-even",
    "title": "Break-Even Revenue",
    "difficulty": "medium",
    "template": "A business has ${{fixedCosts}}K in fixed costs and a {{grossMarginPct}}% gross margin. What revenue is needed to break even?",
    "variables": {
      "fixedCosts": { "min": 200, "max": 2000, "step": 100 },
      "grossMarginPct": { "min": 20, "max": 60, "step": 5 }
    },
    "computeFnKey": "break-even-revenue",
    "answerFormat": "number",
    "workingStepsTemplate": [
      "Break-Even Revenue = Fixed Costs / Gross Margin% = ${{fixedCosts}}K / {{grossMarginPct}}% = ${{answerFormatted}}K"
    ]
  },
  {
    "id": "payback-medium",
    "topic": "break-even",
    "title": "Investment Payback Period",
    "difficulty": "medium",
    "template": "A company invests ${{investment}}M in a project generating ${{annualProfit}}M annual profit. How many years until payback?",
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
    "id": "ltv-basic-easy",
    "topic": "unit-economics",
    "title": "Customer Lifetime Value",
    "difficulty": "easy",
    "template": "A SaaS product earns ${{arpu}}/month per customer. Gross margin is {{marginPct}}% and monthly churn is {{churnPct}}%. What is the LTV?",
    "variables": {
      "arpu": { "min": 50, "max": 300, "step": 50 },
      "marginPct": { "min": 60, "max": 90, "step": 10 },
      "churnPct": { "min": 2, "max": 10, "step": 2 }
    },
    "computeFnKey": "ltv-basic",
    "answerFormat": "number",
    "workingStepsTemplate": [
      "LTV = ARPU × Margin% / Churn% = ${{arpu}} × {{marginPct}}% / {{churnPct}}% = ${{answerFormatted}}"
    ]
  },
  {
    "id": "ltv-cac-easy",
    "topic": "unit-economics",
    "title": "LTV / CAC Ratio",
    "difficulty": "easy",
    "template": "ARPU is ${{arpu}}/month, margin is {{marginPct}}%, monthly churn is {{churnPct}}%, and CAC is ${{cac}}. What is the LTV/CAC ratio?",
    "variables": {
      "arpu": { "min": 50, "max": 200, "step": 50 },
      "marginPct": { "min": 60, "max": 90, "step": 10 },
      "churnPct": { "min": 2, "max": 10, "step": 2 },
      "cac": { "min": 100, "max": 1000, "step": 100 }
    },
    "computeFnKey": "ltv-cac",
    "answerFormat": "multiplier",
    "workingStepsTemplate": [
      "LTV = ARPU × Margin% / Churn% = ${{arpu}} × {{marginPct}}% / {{churnPct}}% = ${{ltv}}",
      "LTV/CAC = ${{ltv}} / ${{cac}} = {{answerFormatted}}"
    ]
  },
  {
    "id": "cac-payback-medium",
    "topic": "unit-economics",
    "title": "CAC Payback Period",
    "difficulty": "medium",
    "template": "A company spends ${{investment}} to acquire a customer who pays ${{annualProfit}}/year in gross profit. How long to recover CAC?",
    "variables": {
      "investment": { "min": 200, "max": 2000, "step": 100 },
      "annualProfit": { "min": 100, "max": 800, "step": 50 }
    },
    "computeFnKey": "payback-basic",
    "answerFormat": "years",
    "workingStepsTemplate": [
      "CAC Payback = CAC / Annual Gross Profit = ${{investment}} / ${{annualProfit}} = {{answerFormatted}}"
    ]
  },
  {
    "id": "contribution-per-unit-hard",
    "topic": "unit-economics",
    "title": "Contribution Margin per Unit",
    "difficulty": "hard",
    "template": "A unit sells for ${{revenue}} with ${{costs}} in variable costs. What is the contribution margin %?",
    "variables": {
      "revenue": { "min": 30, "max": 300, "step": 15 },
      "costs": { "min": 10, "max": 270, "step": 10 }
    },
    "computeFnKey": "margin-calc",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Contribution = Price − Variable Cost = ${{revenue}} − ${{costs}} = ${{profit}}",
      "Contribution Margin % = ${{profit}} / ${{revenue}} = {{answerFormatted}}"
    ]
  },
  {
    "id": "roic-basic",
    "topic": "valuation",
    "title": "Return on Invested Capital",
    "difficulty": "medium",
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
      "ROIC = Value / Investment − 1 = ${{value}}M / ${{investment}}M − 1 = {{answerFormatted}}"
    ]
  },
  {
    "id": "ev-ebitda-easy",
    "topic": "valuation",
    "title": "EV/EBITDA Multiple",
    "difficulty": "easy",
    "template": "A company has an enterprise value of ${{ev}}M and EBITDA of ${{ebitda}}M. What is the EV/EBITDA multiple?",
    "variables": {
      "ev": { "min": 120, "max": 2400, "step": 120 },
      "ebitda": { "min": 10, "max": 200, "step": 10 }
    },
    "computeFnKey": "simple-ratio",
    "answerFormat": "multiplier",
    "workingStepsTemplate": [
      "EV/EBITDA = Enterprise Value / EBITDA = ${{ev}}M / ${{ebitda}}M = {{answerFormatted}}"
    ]
  },
  {
    "id": "pe-ratio-medium",
    "topic": "valuation",
    "title": "P/E Ratio",
    "difficulty": "medium",
    "template": "A company's market cap is ${{numerator}}M and net income is ${{denominator}}M. What is the P/E ratio?",
    "variables": {
      "numerator": { "min": 100, "max": 5000, "step": 100 },
      "denominator": { "min": 5, "max": 250, "step": 5 }
    },
    "computeFnKey": "simple-ratio",
    "answerFormat": "multiplier",
    "workingStepsTemplate": [
      "P/E = Market Cap / Net Income = ${{numerator}}M / ${{denominator}}M = {{answerFormatted}}"
    ]
  },
  {
    "id": "cost-per-unit-easy",
    "topic": "cost-structure",
    "title": "Cost per Unit",
    "difficulty": "easy",
    "template": "A factory incurs ${{numerator}}M in total costs to produce {{denominator}}M units. What is the cost per unit?",
    "variables": {
      "numerator": { "min": 10, "max": 200, "step": 10 },
      "denominator": { "min": 1, "max": 50, "step": 1 }
    },
    "computeFnKey": "simple-ratio",
    "answerFormat": "number",
    "workingStepsTemplate": [
      "Cost per Unit = Total Costs / Units = ${{numerator}}M / {{denominator}}M = ${{answerFormatted}}"
    ]
  },
  {
    "id": "cost-reduction-medium",
    "topic": "cost-structure",
    "title": "Cost Reduction Impact",
    "difficulty": "medium",
    "template": "A firm's COGS dropped from ${{oldValue}}M to ${{newValue}}M. By what percentage did costs fall?",
    "variables": {
      "oldValue": { "min": 100, "max": 800, "step": 50 },
      "newValue": { "min": 50, "max": 750, "step": 25 }
    },
    "computeFnKey": "pct-change",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Cost Reduction = (New − Old) / Old = (${{newValue}}M − ${{oldValue}}M) / ${{oldValue}}M = {{answerFormatted}}"
    ]
  },
  {
    "id": "fixed-variable-split-hard",
    "topic": "cost-structure",
    "title": "Fixed vs Variable Cost Split",
    "difficulty": "hard",
    "template": "Total costs are ${{revenue}}M. Fixed costs are ${{costs}}M. What share of total costs is variable?",
    "variables": {
      "revenue": { "min": 100, "max": 600, "step": 50 },
      "costs": { "min": 20, "max": 500, "step": 20 }
    },
    "computeFnKey": "margin-calc",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Variable Costs = Total − Fixed = ${{revenue}}M − ${{costs}}M = ${{profit}}M",
      "Variable Share = Variable / Total = ${{profit}}M / ${{revenue}}M = {{answerFormatted}}"
    ]
  },
  {
    "id": "utilization-easy",
    "topic": "capacity",
    "title": "Capacity Utilization",
    "difficulty": "easy",
    "template": "A plant produces {{numerator}}K units/month against a maximum capacity of {{denominator}}K units/month. What is the utilization rate?",
    "variables": {
      "numerator": { "min": 50, "max": 450, "step": 50 },
      "denominator": { "min": 100, "max": 500, "step": 100 }
    },
    "computeFnKey": "simple-ratio",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Utilization = Actual / Capacity = {{numerator}}K / {{denominator}}K = {{answerFormatted}}"
    ]
  },
  {
    "id": "throughput-medium",
    "topic": "capacity",
    "title": "Throughput Calculation",
    "difficulty": "medium",
    "template": "A facility produces {{numerator}}K units/day and runs at {{denominator}}% of rated capacity. What is rated capacity?",
    "variables": {
      "numerator": { "min": 50, "max": 450, "step": 25 },
      "denominator": { "min": 50, "max": 90, "step": 5 }
    },
    "computeFnKey": "break-even-revenue",
    "answerFormat": "number",
    "workingStepsTemplate": [
      "Rated Capacity = Actual Output / Utilization% = {{numerator}}K / {{denominator}}% = {{answerFormatted}}K units/day"
    ]
  },
  {
    "id": "utilization-hard",
    "topic": "capacity",
    "title": "Multi-Line Utilization Rate",
    "difficulty": "hard",
    "template": "A facility runs at {{numerator}}K units/month actual output against a rated capacity of {{denominator}}K units/month. What is the utilization rate?",
    "variables": {
      "numerator": { "min": 60, "max": 450, "step": 10 },
      "denominator": { "min": 100, "max": 500, "step": 25 }
    },
    "computeFnKey": "simple-ratio",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Utilization = Actual Output / Rated Capacity = {{numerator}}K / {{denominator}}K = {{answerFormatted}}"
    ]
  },
  {
    "id": "rev-per-customer-easy",
    "topic": "revenue",
    "title": "Revenue per Customer",
    "difficulty": "easy",
    "template": "A company generates ${{numerator}}M in annual revenue from {{denominator}}M customers. What is revenue per customer?",
    "variables": {
      "numerator": { "min": 10, "max": 500, "step": 10 },
      "denominator": { "min": 1, "max": 50, "step": 1 }
    },
    "computeFnKey": "simple-ratio",
    "answerFormat": "number",
    "workingStepsTemplate": [
      "Revenue per Customer = Total Revenue / Customers = ${{numerator}}M / {{denominator}}M = ${{answerFormatted}}"
    ]
  },
  {
    "id": "rev-market-share-medium",
    "topic": "revenue",
    "title": "Revenue from Market Share",
    "difficulty": "medium",
    "template": "A {{population}}M-person market has {{penetrationPct}}% adoption at ${{price}}/year. A competitor holds 30% share. What is the competitor's revenue?",
    "variables": {
      "population": { "min": 20, "max": 200, "step": 20 },
      "penetrationPct": { "min": 10, "max": 50, "step": 5 },
      "price": { "min": 100, "max": 1000, "step": 100 }
    },
    "computeFnKey": "market-sizing",
    "answerFormat": "currency",
    "workingStepsTemplate": [
      "TAM = {{population}}M × {{penetrationPct}}% × ${{price}} = {{answerFormatted}} (full market)",
      "Competitor Revenue = TAM × 30% = {{answerFormatted}}"
    ]
  },
  {
    "id": "rev-price-volume-hard",
    "topic": "revenue",
    "title": "Revenue Bridge: Price & Volume",
    "difficulty": "hard",
    "template": "Prices rise {{priceDeltaPct}}% and unit volume declines {{volumeDeltaPct}}%. What is the net revenue change?",
    "variables": {
      "priceDeltaPct": { "min": 5, "max": 20, "step": 1 },
      "volumeDeltaPct": { "min": -20, "max": -2, "step": 1 }
    },
    "computeFnKey": "rev-price-volume",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Revenue Change = (1 + Price%) × (1 + Volume%) − 1",
      "= (1 + {{priceDeltaPct}}%) × (1 + {{volumeDeltaPct}}%) − 1 = {{answerFormatted}}"
    ]
  },
  {
    "id": "cagr-hard",
    "topic": "growth",
    "title": "Implied CAGR from Revenue Target",
    "difficulty": "hard",
    "template": "Management wants to grow from ${{startValue}}M to ${{endValue}}M over {{years}} years. What CAGR is required?",
    "variables": {
      "startValue": { "min": 100, "max": 500, "step": 50 },
      "endValue": { "min": 200, "max": 2000, "step": 100 },
      "years": { "min": 3, "max": 7, "step": 1 }
    },
    "computeFnKey": "cagr-basic",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "Required CAGR = (Target / Current)^(1/Years) − 1",
      "= (${{endValue}}M / ${{startValue}}M)^(1/{{years}}) − 1 = {{answerFormatted}}"
    ]
  },
  {
    "id": "markup-to-margin-hard",
    "topic": "percentages",
    "title": "Markup to Margin (Complex)",
    "difficulty": "hard",
    "template": "A distributor applies a {{markupPct}}% markup to wholesale cost. What is the gross margin they earn on each sale?",
    "variables": {
      "markupPct": { "min": 15, "max": 150, "step": 5 }
    },
    "computeFnKey": "markup-to-margin",
    "answerFormat": "percentage",
    "workingStepsTemplate": [
      "If cost = 100, selling price = 100 + {{markupPct}} = {{markupPct}} above cost",
      "Margin = Markup / (100 + Markup) = {{markupPct}} / (100 + {{markupPct}}) = {{answerFormatted}}"
    ]
  },
  {
    "id": "ltv-advanced-hard",
    "topic": "unit-economics",
    "title": "LTV with Churn (Advanced)",
    "difficulty": "hard",
    "template": "Monthly ARPU is ${{arpu}}, gross margin {{marginPct}}%, and annual churn is {{churnPct}}%. Calculate LTV.",
    "variables": {
      "arpu": { "min": 20, "max": 500, "step": 10 },
      "marginPct": { "min": 40, "max": 85, "step": 5 },
      "churnPct": { "min": 5, "max": 30, "step": 5 }
    },
    "computeFnKey": "ltv-basic",
    "answerFormat": "number",
    "workingStepsTemplate": [
      "Monthly Gross Profit = ARPU × Margin% = ${{arpu}} × {{marginPct}}% ",
      "LTV = Monthly GP / Monthly Churn% = ${{arpu}} × {{marginPct}}% / {{churnPct}}% = ${{answerFormatted}}"
    ]
  }
]
```

- [ ] **Run tests — all should pass**

```bash
npx vitest run tests/lib/drills.test.ts
```

Expected: all tests pass.

- [ ] **Commit**

```bash
git add data/drills/templates.json
git commit -m "feat(drills): expand template bank to 35 templates across 10 topics"
```

---

### Task 4: Update the API route

**Files:**
- Modify: `app/api/drills/route.ts`

- [ ] **Update route to accept `?difficulty=` param**

```typescript
import { NextResponse } from 'next/server'
import { getRandomDrill } from '@/lib/drills'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const topic = searchParams.get('topic') ?? undefined
  const difficulty = searchParams.get('difficulty') ?? undefined
  const drill = getRandomDrill(topic, difficulty)
  return NextResponse.json(drill)
}
```

- [ ] **Commit**

```bash
git add app/api/drills/route.ts
git commit -m "feat(drills): add difficulty query param to /api/drills route"
```

---

### Task 5: Rewrite the drills page UI

**Files:**
- Modify: `app/drills/page.tsx`

- [ ] **Replace `app/drills/page.tsx`**

```typescript
'use client'
import { useState, useEffect } from 'react'
import type { GeneratedDrill } from '@/types/drill'

const TOPICS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'percentages', label: 'Percentages' },
  { key: 'margins', label: 'Margins' },
  { key: 'growth', label: 'Growth & CAGR' },
  { key: 'market-sizing', label: 'Market Sizing' },
  { key: 'break-even', label: 'Break-Even' },
  { key: 'unit-economics', label: 'Unit Economics' },
  { key: 'valuation', label: 'Valuation' },
  { key: 'cost-structure', label: 'Cost Structure' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'revenue', label: 'Revenue' },
]

const DIFFICULTIES: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
]

export default function DrillsPage() {
  const [topic, setTopic] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [drill, setDrill] = useState<GeneratedDrill | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  async function fetchDrill(nextTopic = topic, nextDifficulty = difficulty) {
    setLoading(true)
    setRevealed(false)
    const params = new URLSearchParams()
    if (nextTopic !== 'all') params.set('topic', nextTopic)
    if (nextDifficulty !== 'all') params.set('difficulty', nextDifficulty)
    const r = await fetch(`/api/drills?${params}`)
    const d = await r.json() as GeneratedDrill
    setDrill(d)
    setStartTime(Date.now())
    setLoading(false)
  }

  useEffect(() => { fetchDrill() }, [])

  function handleTopicChange(next: string) {
    setTopic(next)
    fetchDrill(next, difficulty)
  }

  function handleDifficultyChange(next: string) {
    setDifficulty(next)
    fetchDrill(topic, next)
  }

  async function handleReveal(correct: boolean) {
    if (!drill) return
    const durationMs = Date.now() - startTime
    setRevealed(true)
    await fetch('/api/drills/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drillId: drill.drillId,
        drillType: 'randomized',
        topic: drill.topic,
        correct,
        durationMs,
      }),
    })
  }

  const difficultyColor: Record<string, string> = {
    easy: 'text-green-600',
    medium: 'text-yellow-600',
    hard: 'text-red-600',
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Math Drills</h1>

      {/* Topic filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        {TOPICS.map(t => (
          <button
            key={t.key}
            onClick={() => handleTopicChange(t.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              topic === t.key
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-2 mb-6">
        {DIFFICULTIES.map(d => (
          <button
            key={d.key}
            onClick={() => handleDifficultyChange(d.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              difficulty === d.key
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {loading || !drill ? (
        <div className="text-slate-400 text-sm" role="status">Loading drill...</div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-800 text-slate-100 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest text-slate-400">{drill.title}</p>
              <span className={`text-xs font-semibold capitalize ${difficultyColor[drill.difficulty] ?? 'text-slate-400'}`}>
                {drill.difficulty}
              </span>
            </div>
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
              <p className="text-xs uppercase tracking-widest text-green-800">
                Answer: <span className="text-lg font-bold text-green-900">{drill.answerFormatted}</span>
              </p>
              <div className="space-y-1">
                {drill.workingSteps.map((step, i) => (
                  <p key={i} className="text-sm text-green-900">{step}</p>
                ))}
              </div>
              <button
                onClick={() => fetchDrill()}
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

- [ ] **Commit**

```bash
git add app/drills/page.tsx
git commit -m "feat(drills): replace mode toggle with topic + difficulty filter bars"
```

---

### Task 6: Final build check and push

- [ ] **Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Build**

```bash
npm run build
```

Expected: clean build with no type errors.

- [ ] **Push**

```bash
git push origin master
```
