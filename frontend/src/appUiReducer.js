import { readInitialDarkMode } from '@/utils/themeStorage'

export function getInitialAppUiState() {
  return {
    isDark: readInitialDarkMode(),
    cik: '',
    submittedCik: null,
    sorting: [],
    columnFilters: [],
    mode: 'table',
    isExporting: null,
    exportMenuOpen: false,
    exportPdfError: null,
    sidebarOpen: true,
  }
}

export function appUiReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_DARK':
      return { ...state, isDark: !state.isDark }
    case 'SET_CIK':
      return { ...state, cik: action.payload }
    case 'SET_SUBMITTED_CIK':
      return { ...state, submittedCik: action.payload }
    case 'APPLY_HISTORY_CIK':
      return { ...state, cik: action.payload, submittedCik: action.payload }
    case 'SUBMIT_CIK_LOOKUP':
      return state.cik ? { ...state, submittedCik: state.cik } : state
    case 'SET_SORTING': {
      const next =
        typeof action.payload === 'function' ? action.payload(state.sorting) : action.payload
      return { ...state, sorting: next }
    }
    case 'SET_COLUMN_FILTERS': {
      const next =
        typeof action.payload === 'function' ? action.payload(state.columnFilters) : action.payload
      return { ...state, columnFilters: next }
    }
    case 'SET_MODE':
      return { ...state, mode: action.payload }
    case 'SET_EXPORTING':
      return { ...state, isExporting: action.payload }
    case 'SET_EXPORT_MENU_OPEN': {
      const next =
        typeof action.payload === 'function' ? action.payload(state.exportMenuOpen) : action.payload
      return { ...state, exportMenuOpen: Boolean(next) }
    }
    case 'SET_EXPORT_PDF_ERROR':
      return { ...state, exportPdfError: action.payload }
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload }
    case 'CLEAR_SESSION':
      return {
        ...state,
        exportMenuOpen: false,
        exportPdfError: null,
        submittedCik: null,
      }
    default:
      return state
  }
}
