export interface HeatMapCell {
  caseType: string
  skill: string
  avgRating: number | null
  attemptCount: number
}

export interface DrillAccuracy {
  topic: string
  accuracy: number
  avgDurationMs: number
  attemptCount: number
}

export interface AnalyticsData {
  heatMap: HeatMapCell[]
  caseTypes: string[]
  skills: string[]
  weakestCells: HeatMapCell[]
  drillAccuracy: DrillAccuracy[]
}
