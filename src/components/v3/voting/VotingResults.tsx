import { useMemo, useState } from 'react'
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  ResponsiveContainer, Tooltip, Legend 
} from 'recharts'
import { 
  CheckCircle, XCircle, MinusCircle, Users, Scale, 
  PieChart as PieChartIcon, BarChart2 
} from 'lucide-react'
import { Card, Badge, Button } from '../../ui'
import type { VoteResult, AgendaItem } from '../../../types/v3'

interface VotingResultsProps {
  agendaItem: AgendaItem
  result: VoteResult | null
  showRealtime?: boolean
  loading?: boolean
}

type ChartType = 'pie' | 'bar'

const COLORS = {
  yes: '#22c55e',    // green-500
  no: '#ef4444',     // red-500
  abstain: '#9ca3af' // gray-400
}

const LABELS = {
  yes: 'Igen',
  no: 'Nem',
  abstain: 'Tartózkodott'
}

const MAJORITY_LABELS: Record<string, string> = {
  simple: 'Egyszerű többség',
  two_thirds: 'Kétharmados többség',
  unanimous: 'Egyhangú döntés',
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
    payload: { percentage: number }
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const data = payload[0]
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white">
          {data.name}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Súly: <span className="font-mono">{data.value.toFixed(2)}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Arány: <span className="font-mono">{data.payload.percentage.toFixed(1)}%</span>
        </p>
      </div>
    )
  }
  return null
}

interface CustomLegendProps {
  payload?: Array<{
    value: string
    color: string
  }>
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null
  
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }} 
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function VotingResults({ 
  agendaItem, 
  result, 
  showRealtime = false,
  loading = false 
}: VotingResultsProps) {
  const [chartType, setChartType] = useState<ChartType>('pie')

  const chartData = useMemo(() => {
    if (!result) return []
    
    const total = result.total_weight
    const data = []

    if (result.yes > 0) {
      data.push({
        name: LABELS.yes,
        value: result.yes,
        percentage: total > 0 ? (result.yes / total) * 100 : 0,
        color: COLORS.yes
      })
    }
    
    if (result.no > 0) {
      data.push({
        name: LABELS.no,
        value: result.no,
        percentage: total > 0 ? (result.no / total) * 100 : 0,
        color: COLORS.no
      })
    }
    
    if (result.abstain > 0) {
      data.push({
        name: LABELS.abstain,
        value: result.abstain,
        percentage: total > 0 ? (result.abstain / total) * 100 : 0,
        color: COLORS.abstain
      })
    }

    return data
  }, [result])

  // Loading state
  if (loading) {
    return (
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse mb-4" />
          <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </Card>
    )
  }

  // No results
  if (!result) {
    return (
      <Card className="p-6 sm:p-8 text-center">
        <BarChart2 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nincs eredmény
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          A szavazás még nem kezdődött el vagy nincsenek szavazatok.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {agendaItem.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Szükséges: {MAJORITY_LABELS[agendaItem.required_majority]}
          </p>
        </div>
        
        {/* Pass/Fail Badge with animation */}
        <Badge 
          variant={result.passed ? 'success' : 'danger'} 
          size="lg"
          className={`
            shrink-0 
            ${result.passed ? 'animate-pass-pulse' : 'animate-fail-shake'}
          `}
        >
          {result.passed ? (
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Elfogadva
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              Elutasítva
            </span>
          )}
        </Badge>
      </div>

      {/* Chart type toggle */}
      <div className="flex justify-center gap-2 mb-4">
        <Button
          variant={chartType === 'pie' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setChartType('pie')}
          aria-pressed={chartType === 'pie'}
          icon={<PieChartIcon className="w-4 h-4" />}
        >
          Kördiagram
        </Button>
        <Button
          variant={chartType === 'bar' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setChartType('bar')}
          aria-pressed={chartType === 'bar'}
          icon={<BarChart2 className="w-4 h-4" />}
        >
          Oszlopdiagram
        </Button>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    strokeWidth={2}
                    stroke="white"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          ) : (
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 14 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[0, 8, 8, 0]}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Detailed results */}
      <div className="mt-6 space-y-3">
        {/* Yes votes */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-700 dark:text-green-300">Igen</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-green-700 dark:text-green-300">
              {result.yes.toFixed(2)}
            </span>
            <span className="text-sm text-green-600 dark:text-green-400 min-w-[4rem] text-right">
              {result.total_weight > 0 
                ? ((result.yes / result.total_weight) * 100).toFixed(1) 
                : 0}%
            </span>
          </div>
        </div>

        {/* No votes */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="font-medium text-red-700 dark:text-red-300">Nem</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-red-700 dark:text-red-300">
              {result.no.toFixed(2)}
            </span>
            <span className="text-sm text-red-600 dark:text-red-400 min-w-[4rem] text-right">
              {result.total_weight > 0 
                ? ((result.no / result.total_weight) * 100).toFixed(1) 
                : 0}%
            </span>
          </div>
        </div>

        {/* Abstain votes (only show if > 0) */}
        {result.abstain > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <MinusCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="font-medium text-gray-600 dark:text-gray-300">Tartózkodott</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-gray-600 dark:text-gray-300">
                {result.abstain.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[4rem] text-right">
                {result.total_weight > 0 
                  ? ((result.abstain / result.total_weight) * 100).toFixed(1) 
                  : 0}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-4 border-t dark:border-gray-700">
        <div className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gray-400 mb-1" />
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {result.total_votes}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Szavazat
          </div>
        </div>
        <div className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Scale className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gray-400 mb-1" />
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {result.total_weight.toFixed(2)}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Összsúly
          </div>
        </div>
        <div className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gray-400 mb-1" />
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {result.total_weight > 0 
              ? ((result.yes / result.total_weight) * 100).toFixed(1)
              : 0}%
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Igen arány
          </div>
        </div>
      </div>

      {/* Realtime indicator */}
      {showRealtime && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Élő frissítés aktív
        </div>
      )}
    </Card>
  )
}
