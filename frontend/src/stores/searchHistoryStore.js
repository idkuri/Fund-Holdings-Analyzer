import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const STORAGE_KEY = 'fund-search-history'
const MAX_ENTRIES = 40

function normalizeCik(cik) {
  const digits = String(cik ?? '').replace(/\D/g, '')
  if (!digits) {
    return ''
  }
  return digits.padStart(10, '0')
}

export const useSearchHistoryStore = create(
  persist(
    (set, get) => ({
      entries: [],

      /** Dedupes by CIK (most recent first). */
      addSearch: ({ cik, fundName }) => {
        const normalized = normalizeCik(cik)
        if (!normalized) {
          return
        }
        const title = typeof fundName === 'string' ? fundName.trim() : ''
        const searchedAt = Date.now()
        set(() => {
          const prev = get().entries.filter((e) => e.cik !== normalized)
          return {
            entries: [{ cik: normalized, fundName: title, searchedAt }, ...prev].slice(
              0,
              MAX_ENTRIES
            ),
          }
        })
      },

      removeSearch: (cik) => {
        const normalized = normalizeCik(cik)
        if (!normalized) {
          return
        }
        set(() => ({
          entries: get().entries.filter((e) => e.cik !== normalized),
        }))
      },

      clearHistory: () => set({ entries: [] }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ entries: state.entries }),
    }
  )
)
