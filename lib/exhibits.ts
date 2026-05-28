import fs from 'fs'
import path from 'path'
import type { Exhibit } from '@/types/exhibit'

let _exhibits: Exhibit[] | null = null

export function getAllExhibits(): Exhibit[] {
  if (_exhibits) return _exhibits
  const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'exhibits', 'exhibits.json'), 'utf-8')
  _exhibits = JSON.parse(raw) as Exhibit[]
  return _exhibits
}

export function getRandomExhibit(type?: string, difficulty?: string): Exhibit {
  const exhibits = getAllExhibits()
  let pool = exhibits
  if (type) pool = pool.filter(e => e.type === type)
  if (difficulty) pool = pool.filter(e => e.difficulty === difficulty)
  if (pool.length === 0) pool = exhibits // fallback if combo yields nothing
  return pool[Math.floor(Math.random() * pool.length)]
}
