import { getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table'
import { getCurrencySymbol, formatNumber } from '@/utils/format'

/** One instance each — factories return stable model getters (avoid re-creating plugin closures each render). */
export const coreRowModel = getCoreRowModel()
export const sortedRowModel = getSortedRowModel()
export const filteredRowModel = getFilteredRowModel()

export const holdingsColumns = [
  {
    accessorKey: 'title',
    header: 'Title / Name',
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
    header: 'Balance / Units',
    sortingFn: 'alphanumeric',
    filterFn: 'inNumberRange',
    cell: ({ row, getValue }) => {
      const symbol = getCurrencySymbol(row.original.currency)
      const formatted = formatNumber(Number(getValue()))
      return formatted ? `${symbol} ${formatted}` : ''
    },
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
