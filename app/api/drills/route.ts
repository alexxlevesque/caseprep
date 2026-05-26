import { NextResponse } from 'next/server'
import { getRandomDrill } from '@/lib/drills'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const topic = searchParams.get('topic') ?? undefined
  const difficulty = searchParams.get('difficulty') ?? undefined
  const drill = getRandomDrill(topic, difficulty)
  return NextResponse.json(drill)
}
