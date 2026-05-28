// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { getAllExhibits, getRandomExhibit } from '@/lib/exhibits'

describe('getAllExhibits', () => {
  it('loads all 40 exhibits', () => {
    expect(getAllExhibits()).toHaveLength(40)
  })

  it('every exhibit has required fields', () => {
    getAllExhibits().forEach(e => {
      expect(e.id).toBeTruthy()
      expect(e.type).toBeTruthy()
      expect(e.topic).toBeTruthy()
      expect(['easy', 'medium', 'hard']).toContain(e.difficulty)
      expect(e.title).toBeTruthy()
      expect(e.question).toBeTruthy()
      expect(e.answer.insights.length).toBeGreaterThanOrEqual(1)
      expect(e.answer.calculation.length).toBeGreaterThanOrEqual(1)
    })
  })
})

describe('getRandomExhibit', () => {
  it('returns an exhibit with no filters', () => {
    const exhibit = getRandomExhibit()
    expect(exhibit).toBeDefined()
    expect(exhibit.id).toBeTruthy()
  })

  it('filters by type', () => {
    const exhibit = getRandomExhibit('bar-chart')
    expect(exhibit.type).toBe('bar-chart')
  })

  it('filters by difficulty', () => {
    const exhibit = getRandomExhibit(undefined, 'easy')
    expect(exhibit.difficulty).toBe('easy')
  })

  it('filters by both type and difficulty', () => {
    const exhibit = getRandomExhibit('table', 'medium')
    expect(exhibit.type).toBe('table')
    expect(exhibit.difficulty).toBe('medium')
  })

  it('falls back to full pool when no match', () => {
    const exhibit = getRandomExhibit('bar-chart', 'hard') // no hard bar charts
    expect(exhibit).toBeDefined()
  })
})
