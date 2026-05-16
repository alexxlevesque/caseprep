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
    const drill = generateDrill('roic-basic', { investment: 200, annualProfit: 30, discountRatePct: 10 })
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
    const drill = generateDrill('roic-basic', { investment: 100, annualProfit: 10, discountRatePct: 10 })
    expect(drill.answerFormatted).toMatch(/%/)
  })
})
