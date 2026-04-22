import { queryClient } from '@/queryClient'

const API_URL = import.meta.env.VITE_API_URL

async function readJsonSafe(resp, fallbackMessage) {
  const contentType = resp.headers.get('content-type') || ''
  const text = await resp.text()
  if (!text) {
    return {}
  }
  if (!contentType.includes('application/json')) {
    throw new Error(fallbackMessage)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(fallbackMessage)
  }
}

export function holdingsQueryKey(cik) {
  return ['holdings', cik]
}

export function tickerQueryKey(cik) {
  return ['ticker', cik]
}

export function fundLookupQueryKey(query) {
  return ['fund-lookup', query]
}

async function requestTicker(cik) {
  const resp = await fetch(`${API_URL}/ticker/${cik}`)
  const json = await readJsonSafe(resp, 'Ticker service returned non-JSON response')
  if (!resp.ok) {
    throw new Error(json.error || 'Failed to fetch ticker')
  }
  return json
}

async function requestHoldings(cik) {
  const resp = await fetch(`${API_URL}/cik/${cik}`)
  const json = await readJsonSafe(
    resp,
    'API returned HTML/non-JSON. Check VITE_API_URL and backend route.'
  )
  if (!resp.ok) {
    throw new Error(json.error || resp.statusText || `Request failed (${resp.status})`)
  }
  return {
    holdings: Array.isArray(json.data) ? json.data : Object.values(json.data),
    fundName: json.fund_name || '',
  }
}

async function requestFundLookup(query) {
  const resp = await fetch(`${API_URL}/lookup?q=${encodeURIComponent(query)}`)
  const json = await readJsonSafe(
    resp,
    'Lookup returned HTML/non-JSON. Ensure backend /lookup is running.'
  )
  if (!resp.ok) {
    throw new Error(json.error || 'Failed to search funds')
  }
  return Array.isArray(json.matches) ? json.matches : []
}

/** For `useQuery` / defaults — same cache as `fetchTicker`. */
export function tickerQueryOptions(cik) {
  return {
    queryKey: tickerQueryKey(cik),
    queryFn: () => requestTicker(cik),
  }
}

/** For `useQuery` / defaults — same cache as `fetchHoldings`. */
export function holdingsQueryOptions(cik) {
  return {
    queryKey: holdingsQueryKey(cik),
    queryFn: () => requestHoldings(cik),
  }
}

export function fundLookupQueryOptions(query) {
  return {
    queryKey: fundLookupQueryKey(query),
    queryFn: () => requestFundLookup(query),
    staleTime: 1000 * 60 * 5,
  }
}

/** Imperative — goes through QueryClient cache & deduping. */
export function fetchTicker(cik) {
  return queryClient.fetchQuery(tickerQueryOptions(cik))
}

/** Imperative — goes through QueryClient cache & deduping. */
export function fetchHoldings(cik) {
  return queryClient.fetchQuery(holdingsQueryOptions(cik))
}

export function fetchFundLookup(query) {
  return queryClient.fetchQuery(fundLookupQueryOptions(query))
}
