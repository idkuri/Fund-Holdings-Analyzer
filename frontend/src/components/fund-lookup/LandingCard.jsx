import CikLookupForm from './CikLookupForm'
import SearchHistory from './SearchHistory'

export default function LandingCard({
  showHero,
  cik,
  onCikChange,
  onSubmitCik,
  isLoading,
  lookupError,
  onSelectHistoryCik,
}) {
  return (
    <div className="ease-theme flex w-full max-w-4xl min-w-0 shrink-0 flex-col gap-6 rounded-xl border border-[color:var(--lm-border)] bg-[var(--lm-card)] p-8 shadow-sm shadow-stone-900/10 dark:border-gray-700 dark:bg-gray-900 dark:shadow-none sm:gap-8 sm:p-10">
      {showHero && (
        <div className="nport-hero ease-theme rounded-xl p-4 transition-shadow duration-[var(--theme-transition-duration)] ease-[var(--theme-transition-ease)] sm:p-5">
          <h2 className="mb-2 text-xl font-semibold sm:text-2xl">
            Analyze Fund Holdings from N-Port Filings
          </h2>
          <p className="text-base leading-relaxed sm:text-[1.05rem]">
            Enter a fund&apos;s Central Index Key (CIK) to retrieve and analyze its most recent
            N-Port filing data, including detailed holdings information.
          </p>
        </div>
      )}
      <CikLookupForm
        value={cik}
        onChange={onCikChange}
        onSubmit={onSubmitCik}
        isLoading={isLoading}
        error={lookupError}
      />
      <SearchHistory variant="landing" onSelectCik={onSelectHistoryCik} />
    </div>
  )
}
