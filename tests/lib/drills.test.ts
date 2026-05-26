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

  it('simple-ratio: ev=120, ebitda=20 → 6x', () => {
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
