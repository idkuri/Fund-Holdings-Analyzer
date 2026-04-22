import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const API_URL = import.meta.env.VITE_API_URL

const RANGES = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
]

async function fetchChartData(ticker, range) {
  const resp = await fetch(
    `${API_URL}/chart/${encodeURIComponent(ticker)}?range=${range}&interval=1d`
  )
  const json = await resp.json()
  if (!resp.ok) {
    throw new Error(json.error || 'Failed to fetch chart data')
  }
  return json
}

function StatCard({ label, value, highlight }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="ease-theme text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-gray-500">
        {label}
      </p>
      <p
        className={`ease-theme text-lg font-semibold ${highlight ?? 'text-stone-900 dark:text-gray-100'}`}
      >
        {value ?? '—'}
      </p>
    </div>
  )
}

const PerformanceChart = ({ ticker, darkMode = false }) => {
  const [range, setRange] = useState('1y')

  const { data, isLoading, error } = useQuery({
    queryKey: ['chart', ticker, range],
    queryFn: () => fetchChartData(ticker, range),
    enabled: !!ticker,
  })

  const result = data?.chart?.result?.[0]
  const chartError = data?.chart?.error

  const panel = useMemo(() => {
    if (isLoading) {
      return { state: 'loading' }
    }
    if (error) {
      return {
        state: 'error',
        message: error instanceof Error ? error.message : String(error),
      }
    }
    if (chartError) {
      return {
        state: 'error',
        message: String(chartError?.description ?? 'Failed to load chart data'),
      }
    }
    if (!result) {
      return { state: 'none' }
    }

    const { meta, timestamp, indicators } = result
    const rawCloses = indicators?.adjclose?.[0]?.adjclose ?? indicators?.quote?.[0]?.close
    if (!timestamp?.length || !rawCloses) {
      return { state: 'noPoints' }
    }

    const validPoints = timestamp
      .map((t, i) => ({ t, c: rawCloses[i] }))
      .filter((p) => p.c !== null && p.c !== undefined)

    if (validPoints.length === 0) {
      return { state: 'noPoints' }
    }

    const labels = validPoints.map(({ t }) =>
      new Date(t * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(range === '5y' ? { year: '2-digit' } : {}),
      })
    )
    const prices = validPoints.map((p) => p.c)
    const firstPrice = prices[0]
    const lastPrice = prices[prices.length - 1]
    const returnPct = ((lastPrice - firstPrice) / firstPrice) * 100
    const isPositive = returnPct >= 0
    const sym = meta.currency === 'USD' ? '$' : meta.currency || '$'
    const fmt = (v) => (v !== undefined && v !== null ? `${sym}${Number(v).toFixed(2)}` : '—')

    const chartData = {
      labels,
      datasets: [
        {
          data: prices,
          borderColor: darkMode ? '#60a5fa' : '#172554',
          backgroundColor: darkMode ? 'rgba(96, 165, 250, 0.12)' : 'rgba(23, 37, 84, 0.06)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
          fill: true,
        },
      ],
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => ` ${fmt(ctx.raw)}` },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 8, font: { size: 11 }, color: '#9ca3af' },
          border: { display: false },
        },
        y: {
          position: 'right',
          grid: { color: darkMode ? '#374151' : '#f3f4f6' },
          ticks: {
            font: { size: 11 },
            color: '#9ca3af',
            callback: (v) => `${sym}${v.toFixed(0)}`,
          },
          border: { display: false },
        },
      },
    }

    return {
      state: 'ready',
      chartData,
      options,
      fmt,
      lastPrice,
      returnPct,
      isPositive,
      range,
      meta,
    }
  }, [isLoading, error, chartError, result, range, darkMode])

  const body =
    panel.state === 'loading' ? (
      <div className="ease-theme flex h-64 items-center justify-center text-sm text-stone-500 dark:text-gray-500">
        Loading price data...
      </div>
    ) : panel.state === 'error' ? (
      <div className="ease-theme flex h-64 items-center justify-center text-sm text-red-500 dark:text-red-400">
        {panel.message}
      </div>
    ) : panel.state === 'none' ? null : panel.state === 'noPoints' ? (
      <div className="ease-theme flex h-64 items-center justify-center text-sm text-stone-500 dark:text-gray-500">
        No price data available for this range
      </div>
    ) : (
      <>
        <div className="ease-theme grid grid-cols-2 gap-6 border-b border-[color:var(--lm-border)] px-2 pb-6 dark:border-gray-800 sm:grid-cols-4">
          <StatCard label="Current Price" value={panel.fmt(panel.lastPrice)} />
          <StatCard
            label={`${panel.range.toUpperCase()} Return`}
            value={`${panel.isPositive ? '+' : ''}${panel.returnPct.toFixed(2)}%`}
            highlight={
              panel.isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }
          />
          <StatCard label="52W High" value={panel.fmt(panel.meta['52WeekHigh'])} />
          <StatCard label="52W Low" value={panel.fmt(panel.meta['52WeekLow'])} />
        </div>
        <div style={{ height: '300px' }}>
          <Line data={panel.chartData} options={panel.options} />
        </div>
      </>
    )

  return (
    <div className="ease-theme flex w-full min-w-0 max-w-6xl flex-col overflow-hidden rounded-xl border border-[color:var(--lm-border)] bg-[var(--lm-card)] shadow-sm shadow-stone-900/10 dark:border-gray-700 dark:bg-gray-900 dark:shadow-none">
      <div className="ease-theme flex items-center justify-between border-b border-[color:var(--lm-border)] px-6 py-4 dark:border-gray-800">
        <div>
          <p className="ease-theme text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-gray-500">
            Ticker
          </p>
          <p className="ease-theme text-lg font-bold text-stone-900 dark:text-gray-100">{ticker}</p>
        </div>
        <div className="ease-theme flex gap-1 rounded-lg bg-[var(--lm-track)] p-1 dark:bg-gray-800">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`ease-theme cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-[color,background-color,box-shadow] duration-[var(--theme-transition-duration)] ease-[var(--theme-transition-ease)] ${
                range === r.value
                  ? 'bg-[var(--lm-card)] text-stone-900 shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:shadow-none'
                  : 'text-stone-600 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-6 p-6">{body}</div>
    </div>
  )
}

export default PerformanceChart
