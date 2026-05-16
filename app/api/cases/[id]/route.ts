import { NextResponse } from 'next/server'
import { getCaseById } from '@/lib/cases'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = getCaseById(id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(c)
}
