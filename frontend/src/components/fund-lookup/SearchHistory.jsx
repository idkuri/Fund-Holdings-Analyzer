import { useSearchHistoryStore } from '@/stores/searchHistoryStore'

const SEARCHED_AT_FORMATTER = (() => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return null
  }
})()

export function HistoryIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function formatSearchedAt(ts) {
  try {
    return SEARCHED_AT_FORMATTER ? SEARCHED_AT_FORMATTER.format(ts) : ''
  } catch {
    return ''
  }
}

/**
 * Recent CIK searches (persisted). Reused in the sidebar and on the landing card.
 */
export default function SearchHistory({ onSelectCik, variant = 'default' }) {
  const entries = useSearchHistoryStore((s) => s.entries)
  const removeSearch = useSearchHistoryStore((s) => s.removeSearch)
  const clearHistory = useSearchHistoryStore((s) => s.clearHistory)

  const isSidebar = variant === 'sidebar'
  const listMaxHeightLanding = 'min(36vh, 16rem)'

  if (entries.length === 0) {
    const emptyBody = (
      <div
        className={`ease-theme rounded-lg border border-dashed border-[color:var(--lm-border)] px-3 text-center text-xs text-stone-500 dark:border-gray-600 dark:text-gray-400 ${
          isSidebar ? 'py-2' : 'py-3 sm:px-4'
        }`}
      >
        <p className="font-medium text-stone-600 dark:text-gray-300">No recent searches yet</p>
        <p className="mt-1 text-[0.7rem] leading-snug opacity-90">
          Successful lookups appear here so you can reopen them quickly.
        </p>
      </div>
    )

    if (isSidebar) {
      return (
        <div
          className="ease-theme flex min-h-0 flex-1 flex-col gap-1.5 pt-0.5"
          role="region"
          aria-label="Search history"
        >
          {emptyBody}
        </div>
      )
    }

    return (
      <div role="region" aria-label="Recent searches">
        {emptyBody}
      </div>
    )
  }

  return (
    <div
      className={`ease-theme flex min-h-0 flex-col ${isSidebar ? 'flex-1 gap-1.5 pt-0.5' : 'gap-2'}`}
      role="region"
      aria-label={isSidebar ? 'Search history' : 'Recent searches'}
    >
      {isSidebar ? (
        <div className="flex shrink-0 justify-end pb-0.5">
          <button
            type="button"
            onClick={() => clearHistory()}
            className="ease-theme text-[0.65rem] font-medium text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline dark:text-gray-500 dark:hover:text-gray-300"
          >
            Clear all
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-gray-400">
            Recent searches
          </h3>
          <button
            type="button"
            onClick={() => clearHistory()}
            className="ease-theme shrink-0 text-[0.65rem] font-medium text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline dark:text-gray-500 dark:hover:text-gray-300"
          >
            Clear all
          </button>
        </div>
      )}
      <ul
        className={`ease-theme allocation-list-scroll flex flex-col gap-2 rounded-lg border border-[color:var(--lm-border)] bg-[var(--lm-input)] p-1.5 dark:border-gray-700 dark:bg-gray-950/80 ${
          isSidebar ? 'min-h-0 flex-1 overflow-visible' : 'overflow-y-auto'
        }`}
        style={isSidebar ? undefined : { maxHeight: listMaxHeightLanding }}
      >
        {entries.map((e) => (
          <li key={e.cik} className="min-w-0">
            <div className="ease-theme group flex items-stretch gap-0.5 rounded-md hover:bg-[var(--lm-row)] dark:hover:bg-gray-800/80">
              <button
                type="button"
                onClick={() => onSelectCik(e.cik)}
                className="ease-theme flex min-w-0 flex-1 flex-col items-start gap-0.5 px-2 py-2 text-left text-sm"
              >
                <span
                  className="whitespace-normal break-words font-medium text-stone-900 dark:text-gray-100"
                  title={e.fundName || undefined}
                >
                  {e.fundName || 'Fund (name unavailable)'}
                </span>
                <span className="font-mono text-[0.7rem] text-stone-500 dark:text-gray-400">
                  CIK {e.cik}
                </span>
                <span className="text-[0.65rem] text-stone-400 dark:text-gray-500">
                  {formatSearchedAt(e.searchedAt)}
                </span>
              </button>
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation()
                  removeSearch(e.cik)
                }}
                className="ease-theme flex shrink-0 items-center justify-center px-2 text-stone-400 opacity-70 transition-opacity hover:text-red-600 group-hover:opacity-100 dark:text-gray-500 dark:hover:text-red-400"
                aria-label={`Remove ${e.fundName || e.cik} from history`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
