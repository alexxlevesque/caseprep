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

describe.skip('analytics library', () => {
  let db: Database.Database

  beforeEach(() => {
    db = createTestDb()
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

  it('returns null avgRating for cells with no data', () => {
    const cells = computeHeatMap(db, [{ id: 'wharton-2017-02', type: 'market-entry' }])
    const recCell = cells.find(c => c.skill === 'Recommendation')
    expect(recCell?.avgRating).toBeNull()
  })
})
