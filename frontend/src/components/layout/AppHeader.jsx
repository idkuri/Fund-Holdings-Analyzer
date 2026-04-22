import ThemeToggle from '@/components/ui/ThemeToggle'

export default function AppHeader({
  hasActiveSession,
  sidebarOpen,
  onOpenSidebar,
  isDark,
  onToggleDark,
}) {
  const logoBlock = (
    <div
      className={`relative flex min-w-[4.75rem] shrink-0 items-center justify-center px-3 py-2.5 sm:min-w-[5.5rem] sm:px-4 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 ${
        hasActiveSession ? 'order-1' : ''
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, white 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgb(147 197 253) 0%, transparent 40%)',
        }}
      />
      <div className="relative flex h-12 w-13 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur-sm sm:h-12 sm:w-13 sm:rounded-xl">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[1.5rem] w-[1.5rem] text-white sm:h-6 sm:w-6"
          aria-hidden
        >
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      </div>
    </div>
  )

  const titleBlock = (
    <div className="min-w-0">
      <p className="ease-theme text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-950/70 dark:text-blue-300/80">
        SEC N-Port
      </p>
      <h1 className="ease-theme truncate text-lg font-bold tracking-tight text-stone-900 sm:text-xl dark:text-gray-100">
        Fund Holdings Analyzer
      </h1>
    </div>
  )

  return (
    <header
      className={`ease-theme flex flex-row items-stretch overflow-hidden rounded-xl border border-[color:var(--lm-border)] bg-[var(--lm-card)] shadow-sm shadow-stone-900/10 dark:border-gray-700/80 dark:bg-gray-900 dark:shadow-none ${
        hasActiveSession ? 'w-full shrink-0' : 'w-[75vw] min-w-[500px]'
      }`}
    >
      {hasActiveSession ? (
        <>
          {!sidebarOpen && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="ease-theme order-3 flex shrink-0 items-center justify-center self-stretch border-[color:var(--lm-border)] bg-[var(--lm-row)] px-2.5 text-stone-600 transition-colors duration-[var(--theme-transition-duration)] ease-[var(--theme-transition-ease)] hover:bg-[var(--lm-raised)] hover:text-stone-900 max-md:border-l max-md:border-r-0 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100 md:order-0 md:border-r md:border-l-0"
              aria-expanded={false}
              aria-controls="fund-lookup-sidebar"
              aria-label="Open fund lookup sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-5 w-5"
                strokeWidth={2}
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {logoBlock}
          <div className="ease-theme order-2 flex min-w-0 flex-1 items-center gap-3 border-l border-[color:var(--lm-border)] py-2 pl-3 pr-2 sm:pl-4 sm:pr-3 dark:border-gray-700">
            {titleBlock}
          </div>
          <div className="ease-theme order-0 flex shrink-0 items-center self-center border-[color:var(--lm-border)] py-2 pl-2 pr-2 max-md:border-r sm:pr-3 md:order-3 md:border-r-0 md:pl-3 md:pr-3 dark:border-gray-700">
            <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
          </div>
        </>
      ) : (
        <>
          {logoBlock}
          <div className="ease-theme flex min-w-0 flex-1 items-center justify-between gap-3 border-l border-[color:var(--lm-border)] py-2 pl-3 pr-2 sm:pl-4 sm:pr-3 dark:border-gray-700">
            {titleBlock}
            <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
          </div>
        </>
      )}
    </header>
  )
}
