import type { Exhibit } from '@/types/exhibit'
import { BarChart } from './charts/BarChart'
import { LineChart } from './charts/LineChart'
import { ScatterPlot } from './charts/ScatterPlot'
import { WaterfallChart } from './charts/WaterfallChart'
import { PieChart } from './charts/PieChart'
import { TableExhibit } from './charts/TableExhibit'
import { TwoByTwo } from './charts/TwoByTwo'
import { DecisionTree } from './charts/DecisionTree'
import { ProcessFlow } from './charts/ProcessFlow'
import { ValueChain } from './charts/ValueChain'
import { MarketSizing } from './charts/MarketSizing'
import { CustomerSegmentation } from './charts/CustomerSegmentation'
import { GeographicBreakdown } from './charts/GeographicBreakdown'
import type {
  BarChartData, LineChartData, ScatterData, WaterfallData, PieData,
  TableData, TwoByTwoData, DecisionTreeData, ProcessFlowData,
  ValueChainData, MarketSizingData, CustomerSegmentationData, GeographicData,
} from '@/types/exhibit'

export function ChartRenderer({ exhibit }: { exhibit: Exhibit }) {
  const d = exhibit.chartData
  switch (exhibit.type) {
    case 'bar-chart':          return <BarChart data={d as BarChartData} />
    case 'line-graph':         return <LineChart data={d as LineChartData} />
    case 'scatter-plot':       return <ScatterPlot data={d as ScatterData} />
    case 'waterfall':          return <WaterfallChart data={d as WaterfallData} />
    case 'pie-chart':          return <PieChart data={d as PieData} />
    case 'table':              return <TableExhibit data={d as TableData} />
    case 'two-by-two':         return <TwoByTwo data={d as TwoByTwoData} />
    case 'decision-tree':      return <DecisionTree data={d as DecisionTreeData} />
    case 'process-flow':       return <ProcessFlow data={d as ProcessFlowData} />
    case 'value-chain':        return <ValueChain data={d as ValueChainData} />
    case 'market-sizing':      return <MarketSizing data={d as MarketSizingData} />
    case 'customer-segmentation': return <CustomerSegmentation data={d as CustomerSegmentationData} />
    case 'geographic':         return <GeographicBreakdown data={d as GeographicData} />
  }
}
