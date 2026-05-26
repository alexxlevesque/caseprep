import { createClient, type Client } from '@libsql/client'

declare global {
  // eslint-disable-next-line no-var
  var __db: Client | undefined
  // eslint-disable-next-line no-var
  var __dbReady: Promise<void> | undefined
}

function createDb(): Client {
  return createClient({
    url: process.env.TURSO_DATABASE_URL ?? 'file:./caseinterviewer.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
}

async function initSchema(client: Client): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS practice_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      overall_rating INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS card_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES practice_sessions(id),
      card_index INTEGER NOT NULL,
      card_type TEXT NOT NULL,
      self_rating INTEGER,
      checklist_json TEXT,
      notes TEXT,
      revealed_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS drill_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drill_id TEXT NOT NULL,
      drill_type TEXT NOT NULL,
      case_id TEXT,
      topic TEXT NOT NULL,
      correct INTEGER NOT NULL,
      duration_ms INTEGER,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS fit_seen (
      question_id TEXT PRIMARY KEY,
      first_seen_at INTEGER NOT NULL
    )`,
  ]
  for (const sql of statements) {
    await client.execute(sql)
  }
}

export async function getDb(): Promise<Client> {
  if (!global.__db) {
    global.__db = createDb()
    global.__dbReady = initSchema(global.__db)
  }
  await global.__dbReady
  return global.__db
}
