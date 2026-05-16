import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CardFlip from '@/components/CardFlip'
import type { CaseCard } from '@/types/case'

const mockCard: CaseCard = {
  index: 0,
  type: 'framework',
  interviewer: 'Walk me through your framework.',
  question: 'How would you structure this?',
  modelAnswer: 'Use the profitability tree.',
  checklistItems: ['Identified revenue', 'Identified costs'],
}

describe('CardFlip', () => {
  it('shows interviewer prompt initially', () => {
    render(<CardFlip card={mockCard} onComplete={vi.fn()} />)
    expect(screen.getByText('Walk me through your framework.')).toBeInTheDocument()
    expect(screen.queryByText('Use the profitability tree.')).not.toBeInTheDocument()
  })

  it('reveals model answer after clicking flip button', () => {
    render(<CardFlip card={mockCard} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /flip/i }))
    expect(screen.getByText('Use the profitability tree.')).toBeInTheDocument()
  })

  it('calls onComplete with rating and checklist when submitted', () => {
    const onComplete = vi.fn()
    render(<CardFlip card={mockCard} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: /flip/i }))
    fireEvent.click(screen.getByRole('button', { name: /nailed it/i }))
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ selfRating: 3 }))
  })
})
