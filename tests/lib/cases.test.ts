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

  it('returns cases sorted by number ascending', () => {
    const cases = getAllCaseSummaries()
    for (let i = 1; i < cases.length; i++) {
      expect(cases[i].number).toBeGreaterThanOrEqual(cases[i - 1].number)
    }
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
