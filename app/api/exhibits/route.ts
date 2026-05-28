import { NextResponse } from 'next/server'
import { getRandomExhibit } from '@/lib/exhibits'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? undefined
  const difficulty = searchParams.get('difficulty') ?? undefined
  const exhibit = getRandomExhibit(type, difficulty)
  return NextResponse.json(exhibit)
}
