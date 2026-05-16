export interface PracticeSession {
  id: number
  caseId: string
  startedAt: number
  completedAt: number | null
  overallRating: number | null
}

export interface CardAttempt {
  id: number
  sessionId: number
  cardIndex: number
  cardType: string
  selfRating: number | null
  checklistJson: string | null
  notes: string | null
  revealedAt: number | null
}

export interface SessionSummary {
  session: PracticeSession
  attempts: CardAttempt[]
}
