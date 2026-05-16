export type CardType =
  | 'prompt'
  | 'framework'
  | 'clarifying-qa'
  | 'exhibit'
  | 'qualitative'
  | 'math'
  | 'synthesis'
  | 'recommendation'
  | 'pushback'
  | 'wrapup'

export type Difficulty = 'easy' | 'medium' | 'medium-hard' | 'hard'

export interface CaseCard {
  index: number
  type: CardType
  interviewer: string
  question: string
  modelAnswer: string
  checklistItems: string[]
  exhibitRef?: string
  exhibitType?: 'chart' | 'table'
  data?: Record<string, unknown>
}

export interface Case {
  id: string
  title: string
  number: number
  casebook: string
  difficulty: Difficulty
  firm: string
  type: string
  topics: string[]
  cards: CaseCard[]
}

export interface CaseSummary {
  id: string
  title: string
  number: number
  casebook: string
  difficulty: Difficulty
  firm: string
  type: string
  topics: string[]
  cardCount: number
}
