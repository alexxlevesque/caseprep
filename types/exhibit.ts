export type ExhibitType =
  | 'bar-chart'
  | 'line-graph'
  | 'scatter-plot'
  | 'waterfall'
  | 'pie-chart'
  | 'table'
  | 'two-by-two'
  | 'decision-tree'
  | 'process-flow'
  | 'value-chain'
  | 'market-sizing'
  | 'customer-segmentation'
  | 'geographic'

export interface ExhibitAnswer {
  insights: string[]
  calculation: string[]
}

export interface BarChartData {
  labels: string[]
  values: number[]
  unit: string
}

export interface LineChartData {
  series: { label: string; points: number[] }[]
  xLabels: string[]
  unit: string
}

export interface ScatterData {
  points: { label: string; x: number; y: number }[]
  xLabel: string
  yLabel: string
}

export interface WaterfallData {
  bars: { label: string; value: number; type: 'start' | 'up' | 'down' | 'total' }[]
  unit: string
}

export interface PieData {
  slices: { label: string; value: number }[]
  unit: string
}

export interface TableData {
  headers: string[]
  rows: (string | number)[][]
}

export interface TwoByTwoData {
  xLabel: string
  yLabel: string
  items: { label: string; x: 'low' | 'high'; y: 'low' | 'high' }[]
}

export interface DecisionTreeData {
  nodes: { id: string; label: string; children?: string[]; value?: string }[]
}

export interface ProcessFlowData {
  steps: { label: string; detail?: string }[]
}

export interface ValueChainData {
  stages: { label: string; margin: number }[]
}

export interface MarketSizingData {
  levels: { label: string; value: number; unit: string }[]
}

export interface CustomerSegmentationData {
  segments: { label: string; metrics: { key: string; value: string }[] }[]
}

export interface GeographicData {
  regions: { label: string; value: number; unit: string }[]
}

export type ChartData =
  | BarChartData
  | LineChartData
  | ScatterData
  | WaterfallData
  | PieData
  | TableData
  | TwoByTwoData
  | DecisionTreeData
  | ProcessFlowData
  | ValueChainData
  | MarketSizingData
  | CustomerSegmentationData
  | GeographicData

export interface Exhibit {
  id: string
  type: ExhibitType
  topic: 'profitability' | 'market-sizing' | 'growth' | 'operations' | 'strategy'
  difficulty: 'easy' | 'medium' | 'hard'
  title: string
  context: string
  question: string
  chartData: ChartData
  answer: ExhibitAnswer
}
