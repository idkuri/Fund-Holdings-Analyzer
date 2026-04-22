import CikLookupForm from './CikLookupForm'
import SearchHistory, { HistoryIcon } from './SearchHistory'

export default function FundLookupSidebar({
  sidebarOpen,
  onClose,
  cik,
  onCikChange,
  onSubmitCik,
  isLoading,
  lookupError,
  onSelectHistoryCik,
  onClearSession,
  isExporting,
}) {
  return (
    <aside
      id="fund-lookup-sidebar"
      className={`ease-theme box-border flex min-h-0 shrink-0 flex-col border-[color:var(--lm-border)] bg-[var(--lm-row)] dark:border-gray-800 md:will-change-[width] max-md:will-change-[max-height,opacity] ${
        sidebarOpen
          ? 'w-full min-w-0 max-w-full overflow-x-visible overflow-y-auto border-b max-md:max-h-[min(90vh,40rem)] max-md:min-h-0 max-md:opacity-100 md:max-w-72 md:min-w-0 md:h-full md:max-h-full md:w-72 md:shrink-0 md:self-stretch md:border-b-0 md:border-r md:opacity-100'
          : 'max-md:pointer-events-none max-md:max-h-0 max-md:min-h-0 max-md:overflow-hidden max-md:border-b-0 max-md:opacity-0 md:pointer-events-none md:min-w-0 md:max-w-0 md:overflow-x-hidden md:overflow-y-hidden md:border-0 md:opacity-0'
      }${!sidebarOpen ? ' md:w-0' : ''}`}
      aria-label="Fund lookup"
      aria-hidden={sidebarOpen ? undefined : true}
      inert={!sidebarOpen ? true : undefined}
    >
      <div className="box-border flex h-full min-h-0 w-full min-w-0 max-w-full flex-col px-4 pb-4 pt-3 md:min-w-[18rem]">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[color:var(--lm-border)] pb-2.5 pt-0.5 dark:border-gray-700">
          <div className="flex min-w-0 items-center gap-2">
            <HistoryIcon className="h-5 w-5 shrink-0 text-stone-600 dark:text-gray-400" />
            <h2 className="truncate text-base font-semibold tracking-tight text-stone-800 dark:text-gray-100">
              Search History
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ease-theme -m-1 shrink-0 rounded-md p-1.5 text-stone-500 transition-colors duration-[var(--theme-transition-duration)] ease-[var(--theme-transition-ease)] hover:bg-stone-200/80 hover:text-stone-900 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Close fund lookup sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 pt-1">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <SearchHistory variant="sidebar" onSelectCik={onSelectHistoryCik} />
          </div>
          <div className="flex shrink-0 flex-col gap-4 overflow-visible border-t border-[color:var(--lm-border)] pt-4 dark:border-gray-700">
            <CikLookupForm
              value={cik}
              onChange={onCikChange}
              onSubmit={onSubmitCik}
              isLoading={isLoading}
              error={lookupError}
            />
            <button
              type="button"
              onClick={onClearSession}
              disabled={!!isExporting}
              className="ease-theme w-full rounded-lg border border-red-600 bg-transparent px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors duration-[var(--theme-transition-duration)] ease-[var(--theme-transition-ease)] hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-950/40"
              aria-label="Clear current fund and return to CIK search"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
