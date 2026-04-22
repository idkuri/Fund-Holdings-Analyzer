import { useEffect, useMemo, useRef, useState } from 'react'
import Spinner from '@/components/ui/Spinner'
import { fetchFundLookup } from '@/api/nport'

function toNormalizedCik(input) {
  const digits = String(input ?? '').replace(/\D/g, '')
  if (!digits) {
    return ''
  }
  return digits.slice(0, 10).padStart(10, '0')
}

export default function CikLookupForm({ value, onChange, onSubmit, isLoading, error }) {
  const canSubmit = Boolean(value?.trim())
  const [suggestions, setSuggestions] = useState([])
  const [isLookupLoading, setIsLookupLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const containerRef = useRef(null)

  const trimmed = value?.trim() ?? ''

  useEffect(() => {
    if (trimmed.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    let canceled = false
    const timeout = setTimeout(async () => {
      try {
        setIsLookupLoading(true)
        const matches = await fetchFundLookup(trimmed)
        if (canceled) {
          return
        }
        setSuggestions(matches)
        setShowSuggestions(true)
      } catch {
        if (canceled) {
          return
        }
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        if (!canceled) {
          setIsLookupLoading(false)
        }
      }
    }, 280)

    return () => {
      canceled = true
      clearTimeout(timeout)
    }
  }, [trimmed])

  useEffect(() => {
    const onPointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [])

  const showLookupHint = useMemo(
    () => !isLookupLoading && showSuggestions && suggestions.length === 0 && trimmed.length >= 2,
    [isLookupLoading, showSuggestions, suggestions.length, trimmed.length]
  )

  const submitWithValue = (nextValue) => {
    const normalized = toNormalizedCik(nextValue)
    if (!normalized) {
      return
    }
    onChange(normalized)
    onSubmit(normalized)
    setShowSuggestions(false)
  }

  return (
    <>
      <div className="relative flex flex-col gap-1.5" ref={containerRef}>
        <label
          htmlFor="cik"
          className="ease-theme text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-gray-400"
        >
          Fund Name, Ticker, or CIK
        </label>
        <input
          id="cik"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsInputFocused(true)
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          onBlur={() => setIsInputFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSubmit) {
              onSubmit()
            }
          }}
          className="ease-theme w-full rounded-lg border border-[color:var(--lm-border)] bg-[var(--lm-input)] px-3 py-2.5 text-sm text-stone-900 placeholder-stone-500 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-blue-400"
          placeholder="e.g. Vanguard, VTI, or 0000036405"
        />
        {isInputFocused && (isLookupLoading || showSuggestions || showLookupHint) && (
          <div className="ease-theme absolute bottom-[calc(100%+0.25rem)] left-0 right-0 z-30 overflow-hidden rounded-lg border border-[color:var(--lm-border)] bg-[var(--lm-card)] shadow-lg shadow-stone-900/10 dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/30">
            {isLookupLoading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 dark:text-gray-300">
                <Spinner />
                Searching funds...
              </div>
            ) : null}
            {!isLookupLoading ? (
              <div className="session-main-scroll max-h-[17.5rem] overflow-y-auto">
                {suggestions.map((match) => (
                  <button
                    key={`${match.cik}-${match.ticker || 'na'}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => submitWithValue(match.cik)}
                    className="ease-theme flex min-h-14 w-full cursor-pointer items-start justify-between gap-2 px-3 py-2 text-left hover:bg-stone-100 dark:hover:bg-gray-800"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-stone-900 dark:text-gray-100">
                        {match.ticker || '—'} {'\u00b7'} {match.name || 'Fund name unavailable'}
                      </span>
                      <span className="block text-xs text-stone-500 dark:text-gray-400">
                        CIK {match.cik}
                      </span>
                    </span>
                  </button>
                ))}

                {showLookupHint ? (
                  <p className="px-3 py-2 text-sm text-stone-500 dark:text-gray-400">
                    No matches found. You can still paste a CIK directly.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onSubmit()}
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
