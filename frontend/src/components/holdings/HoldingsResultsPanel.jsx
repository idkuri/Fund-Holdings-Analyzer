import DoughnutChart from '@/components/charts/DoughnutChart'
import PerformanceChart from '@/components/charts/PerformanceChart'
import ExportHoldingsMenu from './ExportHoldingsMenu'
import HoldingsTable from './HoldingsTable'

export default function HoldingsResultsPanel({
  fundName,
  holdings,
  mode,
  setMode,
  viewModeOptions,
  isDark,
  ticker,
  table,
  visibleRows,
  exportMenuRef,
  exportMenuOpen,
  setExportMenuOpen,
  setExportPdfError,
  isExporting,
  handleExportPdf,
  handleExportExcel,
  exportPdfError,
}) {
  return (
    <div
      className={`mx-auto flex min-h-0 w-full max-w-6xl flex-col items-stretch ${
        mode === 'table' ? 'gap-2' : 'flex-1 gap-2 sm:gap-3'
      }`}
    >
      <div className="flex w-full min-w-0 shrink-0 flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          {fundName && (
            <h2 className="ease-theme text-xl font-semibold text-stone-900 dark:text-gray-100">
              {fundName}
            </h2>
          )}
          <p className="ease-theme text-sm text-stone-500 dark:text-gray-500">
            {holdings.length.toLocaleString()} holdings
          </p>
        </div>
        <div className="flex min-w-0 shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div className="ease-theme flex w-full shrink-0 justify-start gap-1 rounded-lg bg-[var(--lm-track)] p-1 dark:bg-gray-800 sm:w-auto sm:justify-end">
            {viewModeOptions.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMode(m)}
                className={`ease-theme cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-[color,background-color,box-shadow] duration-[var(--theme-transition-duration)] ease-[var(--theme-transition-ease)] ${
                  mode === m
                    ? 'bg-[var(--lm-card)] text-stone-900 shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:shadow-none'
                    : 'text-stone-600 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {m === 'table' ? 'Table' : m === 'chart' ? 'Allocation' : 'Performance'}
              </button>
            ))}
          </div>
          <ExportHoldingsMenu
            exportMenuRef={exportMenuRef}
            exportMenuOpen={exportMenuOpen}
            setExportMenuOpen={setExportMenuOpen}
            setExportPdfError={setExportPdfError}
            isExporting={isExporting}
            handleExportPdf={handleExportPdf}
            handleExportExcel={handleExportExcel}
          />
        </div>
      </div>

      <div
        className={
          mode === 'table'
            ? 'flex min-h-0 w-full flex-col'
            : 'flex min-h-0 w-full flex-1 flex-col py-2'
        }
      >
        {mode === 'chart' && <DoughnutChart holdings={holdings} darkMode={isDark} />}
        {mode === 'performance' && ticker && <PerformanceChart ticker={ticker} darkMode={isDark} />}

        {mode === 'table' && (
          <HoldingsTable table={table} visibleRows={visibleRows} totalHoldings={holdings.length} />
        )}
      </div>
      {exportPdfError && (
        <p
          className="ease-theme w-full min-w-0 text-sm text-red-600 dark:text-red-300"
          role="alert"
        >
          {exportPdfError}
        </p>
      )}
    </div>
  )
}
