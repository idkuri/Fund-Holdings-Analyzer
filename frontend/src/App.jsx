import { useReducer, useMemo, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

import { holdingsQueryOptions, tickerQueryOptions } from '@/api/nport'
import { formatRowForPdf } from '@/utils/format'
import {
  holdingsColumns,
  coreRowModel,
  sortedRowModel,
  filteredRowModel,
} from '@/table/holdingsColumns'
import { useSearchHistoryStore } from '@/stores/searchHistoryStore'
import { appUiReducer, getInitialAppUiState } from '@/appUiReducer'

import AppHeader from '@/components/layout/AppHeader'
import LandingCard from '@/components/fund-lookup/LandingCard'
import FundLookupSidebar from '@/components/fund-lookup/FundLookupSidebar'
import HoldingsResultsPanel from '@/components/holdings/HoldingsResultsPanel'
import Spinner from '@/components/ui/Spinner'
import './App.css'

function App() {
  const [state, dispatch] = useReducer(appUiReducer, null, getInitialAppUiState)
  const {
    isDark,
    cik,
    submittedCik,
    sorting,
    columnFilters,
    mode,
    isExporting,
    exportMenuOpen,
    exportPdfError,
    sidebarOpen,
  } = state
  const exportMenuRef = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [isDark])

  useEffect(() => {
    if (!exportMenuOpen) {
      return
    }
    const onPointerDown = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        dispatch({ type: 'SET_EXPORT_MENU_OPEN', payload: false })
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_EXPORT_MENU_OPEN', payload: false })
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [exportMenuOpen, dispatch])

  const addSearchToHistory = useSearchHistoryStore((s) => s.addSearch)

  const { data, isLoading, error, isSuccess, isFetching } = useQuery({
    ...holdingsQueryOptions(submittedCik),
    enabled: !!submittedCik,
  })

  useEffect(() => {
    if (!submittedCik || !isSuccess || isFetching || !data) {
      return
    }
    addSearchToHistory({ cik: submittedCik, fundName: data.fundName ?? '' })
  }, [submittedCik, data, isSuccess, isFetching, addSearchToHistory])

  const { data: tickerData } = useQuery({
    ...tickerQueryOptions(submittedCik),
    enabled: !!submittedCik,
  })

  const ticker = tickerData?.tickers?.[0] ?? null

  const holdings = useMemo(() => data?.holdings ?? [], [data])
  const fundName = useMemo(() => data?.fundName ?? '', [data])
  const hasResultPanelData = useMemo(
    () => holdings.length > 0 || Boolean(fundName),
    [holdings, fundName]
  )

  const table = useReactTable({
    data: holdings,
    columns: holdingsColumns,
    state: { sorting, columnFilters },
    onSortingChange: (updater) => dispatch({ type: 'SET_SORTING', payload: updater }),
    onColumnFiltersChange: (updater) => dispatch({ type: 'SET_COLUMN_FILTERS', payload: updater }),
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    getFilteredRowModel: filteredRowModel,
  })

  /** Don’t memoize with `[table]` — the table instance is stable while data/sort/filters change, so rows would stay stale. */
  const visibleRows = table.getRowModel().rows

  const handleExportPdf = useCallback(() => {
    if (holdings.length === 0) {
      dispatch({ type: 'SET_EXPORT_PDF_ERROR', payload: 'No holdings to export.' })
      return
    }
    dispatch({ type: 'SET_EXPORTING', payload: 'pdf' })
    dispatch({ type: 'SET_EXPORT_PDF_ERROR', payload: null })
    try {
      const tableBody = table.getRowModel().rows.map((row) => formatRowForPdf(row.original))
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const margin = 12
      let y = 14
      if (fundName) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(fundName, margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
      }
      if (submittedCik) {
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`CIK: ${submittedCik}`, margin, y)
        y += 5
        doc.setTextColor(0, 0, 0)
      }
      autoTable(doc, {
        startY: y + 2,
        head: [['Title / Name', 'CUSIP', 'Balance / Units', 'Value']],
        body: tableBody,
        margin: { left: margin, right: margin, bottom: 10 },
        styles: { fontSize: 7, cellPadding: 1.2, textColor: [20, 20, 20] },
        headStyles: { fillColor: [15, 35, 75], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
      })
      const safeCik = String(submittedCik ?? 'export').replace(/[^\w-]/g, '-')
      doc.save(`N-Port-holdings-${safeCik}.pdf`)
    } catch (e) {
      dispatch({
        type: 'SET_EXPORT_PDF_ERROR',
        payload: e instanceof Error ? e.message : 'PDF export failed.',
      })
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: null })
    }
  }, [holdings, table, fundName, submittedCik, dispatch])

  const handleExportExcel = useCallback(() => {
    dispatch({ type: 'SET_EXPORTING', payload: 'excel' })
    try {
      const safeCik = String(submittedCik ?? 'export').replace(/[^\w-]/g, '-')
      const header = ['Title / Name', 'CUSIP', 'Balance / Units', 'Value', 'Currency']
      const rows = visibleRows.map((row) => {
        const r = row.original
        const cusip = r.cusip === '000000000' ? 'N/A' : (r.cusip ?? '')
        return [
          r.title ?? '',
          cusip,
          r.units !== null && r.units !== undefined && r.units !== '' ? Number(r.units) : null,
          r.value !== null && r.value !== undefined && r.value !== '' ? Number(r.value) : null,
          r.currency ?? '',
        ]
      })
      const aoa = [
        [fundName || 'Holdings'],
        ...(submittedCik ? [[`CIK: ${submittedCik}`]] : []),
        [],
        header,
        ...rows,
      ]
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Holdings')
      XLSX.writeFile(wb, `N-Port-holdings-${safeCik}.xlsx`)
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: null })
    }
  }, [visibleRows, fundName, submittedCik, dispatch])

  const applyHistoryCik = useCallback(
    (historyCik) => {
      dispatch({ type: 'APPLY_HISTORY_CIK', payload: historyCik })
    },
    [dispatch]
  )

  const submitCikLookup = useCallback(() => {
    dispatch({ type: 'SUBMIT_CIK_LOOKUP' })
  }, [dispatch])

  const hasActiveSession = Boolean(submittedCik)
  const viewModeOptions = useMemo(
    () => ['table', 'chart', ...(ticker ? ['performance'] : [])],
    [ticker]
  )

  const clearSession = useCallback(() => {
    if (isExporting) {
      return
    }
    dispatch({ type: 'CLEAR_SESSION' })
  }, [isExporting, dispatch])

  return (
    <div
      className={`ease-theme flex w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-[var(--lm-page)] text-stone-900 dark:bg-gray-950 dark:text-gray-100 ${
        hasActiveSession ? 'h-screen min-h-0 overflow-hidden' : 'min-h-screen h-screen'
      }`}
    >
      {!hasActiveSession && (
        <>
          <div className="ease-theme flex w-full shrink-0 justify-center px-4 pt-8 sm:pt-10">
            <AppHeader
              hasActiveSession={false}
              sidebarOpen={sidebarOpen}
              onOpenSidebar={() => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: true })}
              isDark={isDark}
              onToggleDark={() => dispatch({ type: 'TOGGLE_DARK' })}
            />
          </div>
          <div className="ease-theme flex min-h-0 w-full flex-1 flex-col items-center px-4 pb-12 pt-10 sm:pt-12">
            <LandingCard
              showHero={!hasResultPanelData}
              cik={cik}
              onCikChange={(value) => dispatch({ type: 'SET_CIK', payload: value })}
              onSubmitCik={submitCikLookup}
              isLoading={isLoading}
              lookupError={error}
              onSelectHistoryCik={applyHistoryCik}
            />
          </div>
        </>
      )}

      {hasActiveSession && (
        <div className="flex min-h-0 w-full flex-1 flex-col md:h-full md:flex-row md:items-stretch">
          <FundLookupSidebar
            sidebarOpen={sidebarOpen}
            onClose={() => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false })}
            cik={cik}
            onCikChange={(value) => dispatch({ type: 'SET_CIK', payload: value })}
            onSubmitCik={submitCikLookup}
            isLoading={isLoading}
            lookupError={error}
            onSelectHistoryCik={applyHistoryCik}
            onClearSession={clearSession}
            isExporting={isExporting}
          />
          <div className="ease-theme flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
            <AppHeader
              hasActiveSession
              sidebarOpen={sidebarOpen}
              onOpenSidebar={() => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: true })}
              isDark={isDark}
              onToggleDark={() => dispatch({ type: 'TOGGLE_DARK' })}
            />
            <main className="ease-theme session-main-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
              {isLoading && !fundName && (
                <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 py-16 text-sm text-stone-500 dark:text-gray-500">
                  <Spinner />
                  <span>Loading holdings…</span>
                </div>
              )}

              {hasResultPanelData && (
                <HoldingsResultsPanel
                  fundName={fundName}
                  holdings={holdings}
                  mode={mode}
                  setMode={(m) => dispatch({ type: 'SET_MODE', payload: m })}
                  viewModeOptions={viewModeOptions}
                  isDark={isDark}
                  ticker={ticker}
                  table={table}
                  visibleRows={visibleRows}
                  exportMenuRef={exportMenuRef}
                  exportMenuOpen={exportMenuOpen}
                  setExportMenuOpen={(v) => dispatch({ type: 'SET_EXPORT_MENU_OPEN', payload: v })}
                  setExportPdfError={(v) => dispatch({ type: 'SET_EXPORT_PDF_ERROR', payload: v })}
                  isExporting={isExporting}
                  handleExportPdf={handleExportPdf}
                  handleExportExcel={handleExportExcel}
                  exportPdfError={exportPdfError}
                />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
