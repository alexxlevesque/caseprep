import fs from 'fs'
import path from 'path'
import type { Case, CaseSummary } from '@/types/case'

const CASES_DIR = path.join(process.cwd(), 'data', 'cases')

function readCaseFile(filename: string): Case {
  const raw = fs.readFileSync(path.join(CASES_DIR, filename), 'utf-8')
  return JSON.parse(raw) as Case
}

export function getAllCaseSummaries(): CaseSummary[] {
  const files = fs.readdirSync(CASES_DIR).filter(f => f.endsWith('.json'))
  return files
    .map(f => readCaseFile(f))
    .sort((a, b) => a.number - b.number)
    .map(({ cards, ...rest }) => ({ ...rest, cardCount: cards.length }))
}

export function getCaseById(id: string): Case | null {
  const files = fs.readdirSync(CASES_DIR).filter(f => f.endsWith('.json'))
  for (const f of files) {
    const c = readCaseFile(f)
    if (c.id === id) return c
  }
  return null
}
