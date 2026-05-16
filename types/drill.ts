export interface DrillVariable {
  min: number
  max: number
  step: number
}

export interface DrillTemplate {
  id: string
  topic: string
  title: string
  template: string
  variables: Record<string, DrillVariable>
  computeFnKey: string
  answerFormat: 'percentage' | 'currency' | 'years' | 'number'
  workingStepsTemplate: string[]
}

export interface GeneratedDrill {
  drillId: string
  topic: string
  title: string
  question: string
  variables: Record<string, number>
  answer: number
  answerFormatted: string
  workingSteps: string[]
}
