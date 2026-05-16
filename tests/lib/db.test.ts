// @vitest-environment node
import { describe, it, expect } from 'vitest'
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
