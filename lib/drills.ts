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
    extras['totalPct'] = (answer * 100).toFixed(1)
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
  if (pool.length === 0) pool = templates // fallback if combo yields nothing
  const template = pool[Math.floor(Math.random() * pool.length)]
  return generateDrill(template.id)
}
