import { queryClient } from '@/queryClient'

const API_URL = import.meta.env.VITE_API_URL

export function holdingsQueryKey(cik) {
  return ['holdings', cik]
}

export function tickerQueryKey(cik) {
  return ['ticker', cik]
}

async function requestTicker(cik) {
  const resp = await fetch(`${API_URL}/ticker/${cik}`)
  const json = await resp.json()
  if (!resp.ok) {
    throw new Error(json.error || 'Failed to fetch ticker')
  }
  return json
}

async function requestHoldings(cik) {
  const resp = await fetch(`${API_URL}/cik/${cik}`)
  const isJson = resp.headers.get('content-type')?.includes('application/json')
  if (!resp.ok) {
    const message = isJson ? (await resp.json()).error : resp.statusText
    throw new Error(message || `Request failed (${resp.status})`)
  }
  const json = await resp.json()
  return {
    holdings: Array.isArray(json.data) ? json.data : Object.values(json.data),
    fundName: json.fund_name || '',
  }
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

/** Imperative — goes through QueryClient cache & deduping. */
export function fetchTicker(cik) {
  return queryClient.fetchQuery(tickerQueryOptions(cik))
}

/** Imperative — goes through QueryClient cache & deduping. */
export function fetchHoldings(cik) {
  return queryClient.fetchQuery(holdingsQueryOptions(cik))
}
