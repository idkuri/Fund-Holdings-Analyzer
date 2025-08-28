import { useEffect, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender
} from '@tanstack/react-table'
import DoughnutChart from './components/DoughnutChart'
import './App.css'

function App() {
  const [cik, setCik] = useState("")
  const [holdings, setHoldings] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sorting, setSorting] = useState([])
  const [fundName, setFundName] = useState("")
  const [columnFilters, setColumnFilters] = useState([])
  const [mode, setMode] = useState("table") // "table" or "chart"

  const fetchData = async () => {
    if (!cik) return
    setLoading(true)
    setError(null)
    setFundName("")
    setHoldings([])
    try {
      const resp = await fetch(`http://localhost:5000/api/cik/${cik}`)
      const data = await resp.json()
      if (!resp.ok) {
        setError(data.error || "Failed to fetch data")
        setHoldings([])
        return
      }

      // Extract the data array from API response
      const holdingsArray = Array.isArray(data.data) ? data.data : Object.values(data.data)
      setHoldings(holdingsArray)
      setFundName(data.fund_name || "")

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }



  // Currency symbol mapping
  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$',
    }
    return symbols[currency] || currency || '$'
  }


  const formatNumber = (value) => {
    if (value == null || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };


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
      }
    },
    { 
      accessorKey: 'units', 
      header: 'Balance/Units',
      sortingFn: 'alphanumeric',
      filterFn: 'inNumberRange',
      cell: ({ getValue }) => formatNumber(getValue())
    },
    { 
      accessorKey: 'value', 
      header: 'Value',
      sortingFn: 'alphanumeric',
      filterFn: 'inNumberRange',
      cell: ({ row, getValue }) => {
        const value = getValue()
        const currency = row.original.currency
        const symbol = getCurrencySymbol(currency)
        const formattedValue = formatNumber(Number(value));
        return formattedValue ? `${symbol} ${formattedValue}` : ''
      }
    },
  ]

  const table = useReactTable({
    data: holdings,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className='flex flex-col w-screen min-w-screen min-h-screen items-center mx-auto py-8 bg-white gap-[5px]'>

      {/* HEADER BLOCK */}
      <div className='flex flex-col w-[75vw] min-w-[500px] mb-4'>
        <div className='flex flex-row items-center w-full mb-2 gap-4 p-5 border border-gray-300 rounded-lg'>
          <div className="bg-blue-950 p-2 inline-block rounded-lg">
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
          <div className='flex flex-col'>
            <h1 className='text-4xl font-bold'>Fund Holdings Analyzer</h1>
            <p className='text-sm text-gray-500'>N-Port Filing Data Retrieval Tool</p>
          </div>
        </div>
      </div>

      {/* DESCRIPTION BLOCK */}
      <div data-component="header" className='rounded-2xl p-5 w-[75vw] min-w-[500px] mb-4 bg-card flex flex-col items-center justify-center gap-2'>
        <h1 className='text-2xl font-bold mb-4 text-center text-black'>
          Analyze Fund Holdings from N-Port Filings
        </h1>
        <p>
          Enter a fund's Central Index Key (CIK) to retrieve and analyze its most recent N-Port filing data, including detailed holdings information.
        </p>
      </div>

      {/* INPUT BLOCK */}
      <div className='rounded-2xl outline-1 outline-black flex flex-col w-[30vw] min-w-[500px] min-h-[250px] bg-card items-center justify-center'>
        <h4 className='text-2xl font-semibold'>Enter Fund CIK</h4>
        <div className='flex flex-col w-full p-5'>
          <label htmlFor="cik">Central Index Key (CIK)</label>
          <input
            id="cik"
            value={cik}
            onChange={(e) => setCik(e.target.value)}
            className='border border-gray-300 rounded-md p-2'
            placeholder="e.g. 0000823277"
          />
          <button
            onClick={fetchData}
            className='bg-blue-950 text-white rounded-md p-2 mt-4 hover:bg-blue-600 hover:cursor-pointer'
          >
            {loading ? "Loading..." : "Get Holdings"}
          </button>
          {error && <p className='text-red-500 mt-2'>{error}</p>}
        </div>
      </div>
      {/* TABLE BLOCK */}
      <hr className='w-[75vw] border-t border-gray-300 my-4' />
      {fundName && <h2 className='text-2xl font-bold'>Fund Name: {fundName}</h2>}
      {holdings.length > 0 && (
        <div className='flex flex-row justify-end w-[75vw] min-w-[500px] mb-4 gap-2'>
          <button className={`${mode == "table" ? "bg-blue-950 text-white": ""} w-25 h-10 outline-1 outline-black rounded-md hover:cursor-pointer`} onClick={() => {setMode("table")}}>Table View</button>
          <button className={`${mode == "chart" ? "bg-blue-950 text-white": ""} w-25 h-10 outline-1 outline-black rounded-md hover:cursor-pointer`} onClick={() => {setMode("chart")}}>Chart View</button>
        </div>
      )}
      {holdings.length > 0 && mode == "chart" && (
        <DoughnutChart holdings={holdings} getCurrencySymbol={getCurrencySymbol} formatNumber
        />
      )}
      {holdings.length > 0 && mode == "table" && (
        <div className='w-[75vw] mt-6 border border-gray-300 rounded-lg items-center justify-center p-4 overflow-x-auto'>
          <table className='table-auto w-full border-collapse '>
            <thead className='bg-gray-100'>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      className='border p-2 text-left cursor-pointer hover:bg-gray-200 select-none'
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      
                      {/* Sort & Filter Controls */}
                      <div className='flex items-center gap-2'>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className='text-xs'>
                          {{
                            asc: '↑',
                            desc: '↓',
                          }[header.column.getIsSorted()] ?? '↕'}
                        </span>
                      </div>
                      {header.column.getCanFilter() && header.column.id == "title" ? (
                        <input
                          type="text"
                          value={header.column.getFilterValue() || ''}
                          onChange={e => header.column.setFilterValue(e.target.value)}
                          placeholder={`Search by name...`}
                          className="border border-gray-300 rounded p-1 text-sm"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : null}

                      {header.column.getCanFilter() && header.column.id == "cusip" ? (
                        <input
                          type="text"
                          value={header.column.getFilterValue() || ''}
                          onChange={e => header.column.setFilterValue(e.target.value)}
                          placeholder={`Search by CUSIP...`}
                          className="border border-gray-300 rounded p-1 text-sm"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : null}

                      {header.column.getCanFilter() && (header.column.id == "units" || header.column.id == "value") ? (
                        <div className='flex flex-row items-center justify-between'>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            value={header.column.getFilterValue()?.[0] ?? ''}
                            placeholder={`Min`}
                            onChange={e => {
                              const value = e.target.value.replace(/\D/g, '');
                              const max = header.column.getFilterValue()?.[1] || ''
                              header.column.setFilterValue([e.target.value ? Number(value) : null, max])
                              }
                            } 
                            className="border border-gray-300 rounded p-1 text-sm"
                            onClick={e => e.stopPropagation()}
                          />

                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            value={header.column.getFilterValue()?.[1] ?? ''}
                            placeholder="Max"
                            onChange={e => {
                              const value = e.target.value.replace(/\D/g, '');
                              const min = header.column.getFilterValue()?.[0] || '';
                              header.column.setFilterValue([min, value ? Number(value) : null]);
                            }}
                            className="border border-gray-300 rounded p-1 text-sm"
                            onClick={e => e.stopPropagation()}
                          />

                        </div>
                      ) : null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className='border p-2'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default App