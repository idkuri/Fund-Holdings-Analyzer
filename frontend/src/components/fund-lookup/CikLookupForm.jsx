import Spinner from '@/components/ui/Spinner'

export default function CikLookupForm({ value, onChange, onSubmit, isLoading, error }) {
  const canSubmit = Boolean(value?.trim())

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="cik"
          className="ease-theme text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-gray-400"
        >
          Central Index Key (CIK)
        </label>
        <input
          id="cik"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSubmit) {
              onSubmit()
            }
          }}
          className="ease-theme w-full rounded-lg border border-[color:var(--lm-border)] bg-[var(--lm-input)] px-3 py-2.5 text-sm text-stone-900 placeholder-stone-500 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-blue-400"
          placeholder="e.g. 0000884394"
        />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || isLoading}
        className="ease-theme mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-950 py-2.5 text-sm font-medium text-white transition-colors duration-[var(--theme-transition-duration)] ease-[var(--theme-transition-ease)] hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-800 dark:hover:bg-blue-700"
      >
        {isLoading ? (
          <>
            <Spinner />
            Loading...
          </>
        ) : (
          'Get Holdings'
        )}
      </button>
      {error && (
        <p className="ease-theme rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error.message}
        </p>
      )}
    </>
  )
}
