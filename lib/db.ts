import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined
}

function initDb(): Database.Database {
  const dbPath = path.join(process.cwd(), 'caseinterviewer.db')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  const schema = fs.readFileSync(path.join(process.cwd(), 'db/schema.sql'), 'utf-8')
  db.exec(schema)
  return db
}

export function getDb(): Database.Database {
  if (!global.__db) {
    global.__db = initDb()
  }
  return global.__db
}
