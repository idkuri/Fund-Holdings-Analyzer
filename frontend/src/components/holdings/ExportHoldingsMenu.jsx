import Spinner from '@/components/ui/Spinner'

export default function ExportHoldingsMenu({
  exportMenuRef,
  exportMenuOpen,
  setExportMenuOpen,
  setExportPdfError,
  isExporting,
  handleExportPdf,
  handleExportExcel,
}) {
  return (
    <div className="relative self-start sm:self-auto" ref={exportMenuRef}>
      <button
        type="button"
        onClick={() => {
          if (isExporting) {
            return
          }
          setExportPdfError(null)
          setExportMenuOpen((o) => !o)
        }}
        disabled={!!isExporting}
        className="ease-theme flex w-full cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[color:var(--lm-border)] bg-[var(--lm-card)] px-3 py-2 text-sm font-medium text-stone-700 transition-colors duration-[var(--theme-transition-duration)] ease-[var(--theme-transition-ease)] hover:bg-[var(--lm-raised)] disabled:cursor-wait disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 sm:w-auto"
        aria-label="Export"
        aria-haspopup="true"
        aria-expanded={exportMenuOpen}
      >
        {isExporting ? (
          <>
            <Spinner />
            {isExporting === 'pdf' ? 'Exporting PDF…' : 'Exporting…'}
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="currentColor"
              aria-hidden
            >
              <path d="M19.903 8.586a.998.998 0 0 0-.1-.1l-6-6a.99.99 0 0 0-.276-.196c-.01-.006-.02-.01-.03-.012A.99.99 0 0 0 13 2H6a2.002 2.002 0 0 0-2 2v16a2.002 2.002 0 0 0 2 2h12a2.002 2.002 0 0 0 2-2V9a.99.99 0 0 0-.101-.404l.004-.01ZM14 4.414 17.586 8H16a1 1 0 0 1-1-1V4.414ZM18 20H6V4h7v5a2.002 2.002 0 0 0 2 2h5v9Z" />
            </svg>
            Export
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              className="h-4 w-4 shrink-0 text-stone-500 dark:text-gray-400"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </>
        )}
      </button>
      {exportMenuOpen && !isExporting && (
        <div
          className="ease-theme absolute right-0 z-30 mt-1.5 min-w-[11.5rem] overflow-hidden rounded-lg border border-[color:var(--lm-border)] bg-[var(--lm-card)] py-1 text-sm shadow-lg shadow-stone-900/15 dark:border-gray-600 dark:bg-gray-800 dark:shadow-black/40"
          role="menu"
          aria-label="Export format"
        >
          <button
            type="button"
            role="menuitem"
            className="ease-theme flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-stone-800 hover:bg-stone-100 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              setExportMenuOpen(false)
              setExportPdfError(null)
              setTimeout(() => {
                void handleExportPdf()
              }, 0)
            }}
          >
            <span className="font-medium">PDF</span>
            <span className="text-xs text-stone-500 dark:text-gray-400">.pdf</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="ease-theme flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-stone-800 hover:bg-stone-100 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              setExportMenuOpen(false)
              handleExportExcel()
            }}
          >
            <span className="font-medium">Excel</span>
            <span className="text-xs text-stone-500 dark:text-gray-400">.xlsx</span>
          </button>
        </div>
      )}
    </div>
  )
}
