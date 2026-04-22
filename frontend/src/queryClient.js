import { QueryClient } from '@tanstack/react-query'

/** Shared instance — used by `QueryClientProvider` and `@/api/nport` imperative fetches. */
export const queryClient = new QueryClient()
