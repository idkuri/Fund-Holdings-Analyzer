import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, Title)

/** Categorical palette: blue-forward to match the app, distinct hues for many slices */
const COLORS = [
  '#1e3a5f',
  '#2563eb',
  '#0891b2',
  '#0d9488',
  '#059669',
  '#65a30d',
  '#ca8a04',
  '#ea580c',
  '#c2410c',
  '#7c3aed',
  '#9333ea',
  '#db2777',
]

const SELECT_OFFSET = 22

/** Aggregated “non-selected” slice — neutral contrast vs the palette */
const OTHER_SLICE_LIGHT = '#94a3b8'
const OTHER_SLICE_DARK = '#475569'

const DoughnutChart = ({ holdings, darkMode = false }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(null)

  const rootRef = useRef(null)
  const chartBlockRef = useRef(null)

  useEffect(() => {
    setSelectedIndex(null)
  }, [searchTerm])

  useEffect(() => {
    const onWindowPointerDownCapture = (e) => {
      const t = e.target
      if (!(t instanceof Node) || !rootRef.current) return
      if (!rootRef.current.contains(t)) {
        setSelectedIndex(null)
        return
      }
      /** List row buttons: let them handle selection; same-row toggle still works (no pre-clear). */
      if (t instanceof Element && t.closest('ul[role="listbox"] button')) return
      if (chartBlockRef.current?.contains(t)) return
      setSelectedIndex(null)
    }
    window.addEventListener('pointerdown', onWindowPointerDownCapture, true)
    return () => window.removeEventListener('pointerdown', onWindowPointerDownCapture, true)
  }, [])

  const { chartData, percentages, doughnutRotation } = useMemo(() => {
    const totalValue = holdings.reduce((sum, item) => sum + item.value, 0)
    const pct =
      totalValue > 0
        ? holdings.map((item) => (item.value / totalValue) * 100)
        : holdings.map(() => 0)

    const q = searchTerm.trim().toLowerCase()
    const mergeOthers =
      selectedIndex !== null && holdings.length > 1 && pct[selectedIndex] != null

    const otherNeutral = darkMode ? OTHER_SLICE_DARK : OTHER_SLICE_LIGHT

    if (mergeOthers) {
      const sel = holdings[selectedIndex]
      const selPct = pct[selectedIndex]
      const otherPct = pct.reduce((sum, p, i) => (i === selectedIndex ? sum : sum + p), 0)
      const baseSel = COLORS[selectedIndex % COLORS.length]
      const selBg = baseSel
      const otherBg = otherNeutral

      const offsets = [SELECT_OFFSET, 0]

      /** Keep the focused slice at the same angle as in the full pie (Chart.js uses degrees; first arc starts at rotation − 90°). */
      const cumDegBefore =
        selectedIndex > 0 ? pct.slice(0, selectedIndex).reduce((s, p) => s + p, 0) : 0
      const rotation = (360 * cumDegBefore) / 100

      return {
        percentages: pct,
        doughnutRotation: rotation,
        chartData: {
          labels: [sel.title, 'All other holdings'],
          datasets: [
            {
              label: 'Percentage Allocation',
              data: [selPct, otherPct],
              backgroundColor: [selBg, otherBg],
              borderWidth: 0,
              hoverBorderWidth: 0,
              offset: offsets,
            },
          ],
        },
      }
    }

    const labels = holdings.map((item) => item.title)
    const backgrounds = holdings.map((item, i) => {
      const base = COLORS[i % COLORS.length]
      if (!q) return base
      return item.title.toLowerCase().includes(q) ? base : otherNeutral
    })

    const offsets = holdings.map((_, i) =>
      selectedIndex === i ? SELECT_OFFSET : 0,
    )

    return {
      percentages: pct,
      doughnutRotation: 0,
      chartData: {
        labels,
        datasets: [
          {
            label: 'Percentage Allocation',
            data: pct,
            backgroundColor: backgrounds,
            borderWidth: 0,
            hoverBorderWidth: 0,
            offset: offsets,
          },
        ],
      },
    }
  }, [holdings, searchTerm, selectedIndex, darkMode])

  const filteredAllocationRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) {
      return holdings.map((item, i) => ({ item, index: i }))
    }
    return holdings
      .map((item, i) => ({ item, index: i }))
      .filter(({ item }) => item.title.toLowerCase().includes(q))
  }, [holdings, searchTerm])

  const options = useMemo(
    () => ({
      responsive: true,
      cutout: '50%',
      /** No stroke between slices (borderWidth on dataset was drawing “gaps”). */
      spacing: 0,
      /** Merged view: rotate so the selected segment stays where it was in the full chart */
      rotation: doughnutRotation,
      onClick: (_event, elements) => {
        const merged = selectedIndex !== null && holdings.length > 1

        if (!elements?.length) {
          if (selectedIndex !== null) {
            setSelectedIndex(null)
          }
          return
        }

        const idx = elements[0].index

        if (merged) {
          setSelectedIndex(null)
          return
        }

        if (selectedIndex === null) {
          setSelectedIndex(idx)
          return
        }
        if (selectedIndex === idx) {
          setSelectedIndex(null)
          return
        }
        setSelectedIndex(null)
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Portfolio Allocation Distribution',
          font: { size: 18, weight: 'bold' },
          color: darkMode ? '#e5e7eb' : '#111827',
          padding: { bottom: 16 },
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${context.raw.toFixed(2)}%`
            },
          },
        },
      },
      maintainAspectRatio: false,
      animation: { animateRotate: true, animateScale: true },
      elements: {
        arc: {
          borderWidth: 0,
          hoverBorderWidth: 0,
        },
      },
    }),
    [darkMode, selectedIndex, holdings.length, doughnutRotation]
  )

  const toggleSlice = (index) => {
    setSelectedIndex((prev) => (prev === index ? null : index))
  }

  return (
    <div
      ref={rootRef}
      className="ease-theme flex w-full min-w-0 max-w-6xl flex-col items-stretch gap-4 rounded-xl border border-[color:var(--lm-border)] bg-[var(--lm-card)] p-4 shadow-sm shadow-stone-900/10 sm:p-6 dark:border-gray-700 dark:bg-gray-900 dark:shadow-none"
    >
      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
        {/* Desktop left / mobile below chart: focused slice + how to use (narrow band so doughnut stays centered on x) */}
        <div className="order-2 flex w-full shrink-0 flex-col gap-2 lg:order-1 lg:w-52 lg:min-w-0 lg:max-w-full xl:w-56">
          <h3 className="ease-theme text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-gray-400">
            Selection
          </h3>
          {selectedIndex !== null && holdings[selectedIndex] != null && (
            <div
              className="ease-theme rounded-lg border border-[color:var(--lm-border)] bg-[var(--lm-raised)] p-3 dark:border-gray-600 dark:bg-gray-800/80"
              role="status"
              aria-live="polite"
            >
              <p className="ease-theme text-[10px] font-semibold uppercase tracking-widest text-stone-500 dark:text-gray-400">
                Selected slice
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="h-4 w-4 shrink-0 rounded-sm ring-1 ring-black/10"
                  style={{
                    backgroundColor: COLORS[selectedIndex % COLORS.length],
                  }}
                  aria-hidden
                />
                <p className="ease-theme min-w-0 flex-1 text-sm font-medium leading-snug text-stone-800 dark:text-gray-100">
                  {holdings[selectedIndex].title}
                </p>
              </div>
              <p className="ease-theme mt-2 text-2xl font-bold tabular-nums tracking-tight text-stone-900 dark:text-gray-50">
                {percentages[selectedIndex].toFixed(2)}%
              </p>
              <p className="ease-theme mt-1 text-[11px] text-stone-500 dark:text-gray-500">
                Share of portfolio by value
              </p>
            </div>
          )}
          <p className="ease-theme text-xs leading-snug text-stone-500 dark:text-gray-500">
            Click a slice or row to focus it; other positions merge into one neutral slice. Click the chart
            again to show the full breakdown.
          </p>
        </div>

        <div className="order-1 flex w-full min-w-0 flex-1 flex-col items-center justify-center lg:order-2 lg:max-h-[50vh]">
          <div
            ref={chartBlockRef}
            className="relative mx-auto aspect-square w-full max-h-[50vh] max-w-[min(100%,50vh)] shrink-0 cursor-pointer"
          >
            <Doughnut data={chartData} options={options} />
          </div>
        </div>

        {/* Search + allocation list — max 50% viewport tall; clicks here deselect the chart (not on doughnut) */}
        <div
          role="group"
          aria-label="Allocation filter and list"
          className="order-3 flex h-fit max-h-[50vh] w-full min-w-0 shrink-0 flex-col gap-2 self-start lg:order-3 lg:w-[min(100%,300px)]"
          onClickCapture={(e) => {
            // Bubble onClick on this div never runs for list row clicks (button uses stopPropagation).
            // Deselect in capture, but skip when the click is on/inside a list row button (closest includes SPAN hits).
            const t = e.target
            const fromListRow =
              t instanceof Element && !!t.closest('ul[role="listbox"] button')
            if (fromListRow) return
            setSelectedIndex((i) => (i !== null ? null : i))
          }}
        >
          <h3 className="ease-theme shrink-0 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-gray-400">
            Allocation
          </h3>
          <input
            type="text"
            placeholder="Filter holdings by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ease-theme w-full shrink-0 rounded-lg border border-[color:var(--lm-border)] bg-[var(--lm-input)] px-3 py-2.5 text-sm text-stone-900 placeholder-stone-500 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-blue-400"
          />
          <ul
            className="allocation-list-scroll ease-theme max-h-[calc(50vh-6rem)] min-h-0 overflow-y-auto rounded-lg border border-[color:var(--lm-border)] bg-[var(--lm-row)] pr-1 dark:border-gray-700 dark:bg-gray-800"
            role="listbox"
            aria-label={
              searchTerm.trim()
                ? 'Holdings matching your search'
                : 'Holdings allocation legend'
            }
          >
            {filteredAllocationRows.length === 0 ? (
              <li className="ease-theme px-3 py-4 text-center text-sm text-stone-500 dark:text-gray-500" role="status">
                No holdings match your search.
              </li>
            ) : (
              filteredAllocationRows.map(({ item, index: i }) => {
                const pct = percentages[i]
                const color = COLORS[i % COLORS.length]
                const isSelected = selectedIndex === i
                return (
                  <li key={`${item.cusip ?? 'row'}-${i}`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSlice(i)
                      }}
                      className={`ease-theme flex w-full cursor-pointer items-start gap-2.5 rounded-md border border-transparent px-3 py-2 text-left text-sm transition-colors duration-[var(--theme-transition-duration)] ease-[var(--theme-transition-ease)] ${
                        isSelected
                          ? 'border-blue-200 bg-[var(--lm-input)] shadow-sm ring-1 ring-blue-100 dark:border-blue-600 dark:bg-gray-700 dark:ring-blue-900/50'
                          : 'hover:bg-black/[0.05] dark:hover:bg-gray-700/60'
                      }`}
                      aria-selected={isSelected}
                    >
                      <span
                        className="mt-1 h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/10"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      <span className="ease-theme min-w-0 flex-1 leading-snug text-stone-800 dark:text-gray-200">
                        {item.title}
                      </span>
                      <span className="ease-theme shrink-0 font-medium tabular-nums text-stone-600 dark:text-gray-400">
                        {pct.toFixed(2)}%
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DoughnutChart
