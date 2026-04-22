import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table'
import DoughnutChart from './components/DoughnutChart'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL

const getCurrencySymbol = (currency) => {
  const symbols = { USD: '$' }
  return symbols[currency] || currency || '$'
}

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  const num = parseFloat(value)
  if (isNaN(num)) {
    return value
  }
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const columns = [
  {
    accessorKey: 'title',
    header: 'Title/Name',
    sortingFn: 'alphanumeric',
    filterFn: 'includesString',
  },
  {
    accessorKey: 'cusip',
    header: 'CUSIP',
    sortingFn: 'alphanumeric',
    cell: ({ getValue }) => {
      const cusip = getValue()
      return cusip === '000000000' ? 'N/A' : cusip
    },
  },
  {
    accessorKey: 'units',
    header: 'Balance/Units',
    sortingFn: 'alphanumeric',
    filterFn: 'inNumberRange',
    cell: ({ getValue }) => formatNumber(getValue()),
  },
  {
    accessorKey: 'value',
    header: 'Value',
    sortingFn: 'alphanumeric',
    filterFn: 'inNumberRange',
    cell: ({ row, getValue }) => {
      const symbol = getCurrencySymbol(row.original.currency)
      const formatted = formatNumber(Number(getValue()))
      return formatted ? `${symbol} ${formatted}` : ''
    },
  },
]

async function fetchHoldings(cik) {
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

function App() {
  const [cik, setCik] = useState('')
  const [submittedCik, setSubmittedCik] = useState(null)
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [mode, setMode] = useState('table')

  const { data, isLoading, error } = useQuery({
    queryKey: ['holdings', submittedCik],
    queryFn: () => fetchHoldings(submittedCik),
    enabled: !!submittedCik,
  })

  const holdings = data?.holdings ?? []
  const fundName = data?.fundName ?? ''

  const table = useReactTable({
    data: holdings,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="flex flex-col min-h-screen w-screen items-center bg-gray-50 py-10 gap-6">
      {/* HEADER */}
      <div className="flex flex-col w-[75vw] min-w-[500px]">
        <div className="flex flex-row items-center gap-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="bg-blue-950 p-2 rounded-lg shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="35"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-gray-900">Fund Holdings Analyzer</h1>
            <p className="text-sm text-gray-500">N-Port Filing Data Retrieval Tool</p>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="w-[75vw] min-w-[500px] bg-blue-950 rounded-xl p-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Analyze Fund Holdings from N-Port Filings</h2>
        <p className="text-blue-200 text-sm">
          Enter a fund's Central Index Key (CIK) to retrieve and analyze its most recent N-Port
          filing data, including detailed holdings information.
        </p>
      </div>

      {/* INPUT */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col w-[30vw] min-w-[350px] md:w-[500px] p-6 gap-3">
        <h4 className="text-xl font-semibold text-gray-800">Enter Fund CIK</h4>
        <label htmlFor="cik" className="text-sm text-gray-600">
          Central Index Key (CIK) e.g. 0000884394
        </label>
        <input
          id="cik"
          value={cik}
          onChange={(e) => setCik(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && cik) {
              setSubmittedCik(cik)
            }
          }}
          className="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 0000884394"
        />
        <button
          onClick={() => {
            if (cik) {
              setSubmittedCik(cik)
            }
          }}
          disabled={!cik || isLoading}
          className="bg-blue-950 text-white rounded-lg p-2 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {isLoading ? 'Loading...' : 'Get Holdings'}
        </button>
        {error && <p className="text-red-500 text-sm">{error.message}</p>}
      </div>

      {/* RESULTS */}
      {(holdings.length > 0 || fundName) && (
        <>
          <hr className="w-[75vw] border-t border-gray-200" />
          {fundName && (
            <h2 className="text-2xl font-bold text-gray-800 text-center">Fund: {fundName}</h2>
          )}
          <div className="flex flex-row justify-end w-[75vw] min-w-[500px] gap-2">
            <button
              className={`px-4 h-9 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                mode === 'table'
                  ? 'bg-blue-950 text-white border-blue-950'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setMode('table')}
            >
              Table View
            </button>
            <button
              className={`px-4 h-9 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                mode === 'chart'
                  ? 'bg-blue-950 text-white border-blue-950'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setMode('chart')}
            >
              Chart View
            </button>
          </div>

          {mode === 'chart' && <DoughnutChart holdings={holdings} />}

          {mode === 'table' && (
            <div className="w-[75vw] min-w-[500px] bg-white border border-gray-200 rounded-xl shadow-sm p-4 overflow-x-auto">
              <table className="table-auto w-full border-collapse">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="border border-gray-200 p-2 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <span className="text-xs text-gray-400">
                              {{ asc: '↑', desc: '↓' }[header.column.getIsSorted()] ?? '↕'}
                            </span>
                          </div>
                          {header.column.getCanFilter() && header.column.id === 'title' && (
                            <input
                              type="text"
                              value={header.column.getFilterValue() || ''}
                              onChange={(e) => header.column.setFilterValue(e.target.value)}
                              placeholder="Search by name..."
                              className="mt-1 w-full border border-gray-300 rounded p-1 text-xs font-normal"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          {header.column.getCanFilter() && header.column.id === 'cusip' && (
                            <input
                              type="text"
                              value={header.column.getFilterValue() || ''}
                              onChange={(e) => header.column.setFilterValue(e.target.value)}
                              placeholder="Search by CUSIP..."
                              className="mt-1 w-full border border-gray-300 rounded p-1 text-xs font-normal"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          {header.column.getCanFilter() &&
                            (header.column.id === 'units' || header.column.id === 'value') && (
                              <div className="flex gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="\d*"
                                  value={header.column.getFilterValue()?.[0] ?? ''}
                                  placeholder="Min"
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '')
                                    const max = header.column.getFilterValue()?.[1] || ''
                                    header.column.setFilterValue([
                                      e.target.value ? Number(val) : null,
                                      max,
                                    ])
                                  }}
                                  className="w-1/2 border border-gray-300 rounded p-1 text-xs font-normal"
                                />
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="\d*"
                                  value={header.column.getFilterValue()?.[1] ?? ''}
                                  placeholder="Max"
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '')
                                    const min = header.column.getFilterValue()?.[0] || ''
                                    header.column.setFilterValue([
                                      min,
                                      e.target.value ? Number(val) : null,
                                    ])
                                  }}
                                  className="w-1/2 border border-gray-300 rounded p-1 text-xs font-normal"
                                />
                              </div>
                            )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="border border-gray-200 p-2 text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
