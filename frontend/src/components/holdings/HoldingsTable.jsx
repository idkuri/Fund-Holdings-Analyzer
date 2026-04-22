import { flexRender } from '@tanstack/react-table'

export default function HoldingsTable({ table, visibleRows, totalHoldings }) {
  return (
    <div className="ease-theme w-full min-w-0 overflow-hidden rounded-xl border border-[color:var(--lm-border)] bg-[var(--lm-card)] shadow-sm shadow-stone-900/10 dark:border-gray-700 dark:bg-gray-900 dark:shadow-none">
      <div className="holdings-table-scroll max-h-[min(70vh,36rem)] max-md:max-h-[min(58dvh,28rem)] overflow-x-auto overflow-y-auto overscroll-contain bg-[var(--lm-card)] dark:bg-gray-900">
        <table className="w-full min-w-[36rem] max-md:min-w-[32rem]">
          <thead className="sticky top-0 z-10 bg-[var(--lm-raised)] shadow-[0_1px_0_0_var(--lm-border)] dark:bg-gray-800 dark:shadow-[0_1px_0_0_rgb(55_65_81)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="ease-theme border-b-2 border-[color:var(--lm-border)] bg-[var(--lm-raised)] dark:border-gray-700 dark:bg-gray-800"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="ease-theme cursor-pointer select-none bg-[var(--lm-raised)] px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600 transition-colors duration-[var(--theme-transition-duration)] ease-[var(--theme-transition-ease)] hover:bg-stone-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 md:px-4 md:py-3"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span
                        className="ease-theme inline-flex shrink-0 items-center text-[15px] font-semibold leading-none text-stone-500 dark:text-gray-400"
                        aria-hidden
                      >
                        {{ asc: '↑', desc: '↓' }[header.column.getIsSorted()] ?? '↕'}
                      </span>
                    </div>
                    {header.column.getCanFilter() && header.column.id === 'title' && (
                      <input
                        type="text"
                        value={header.column.getFilterValue() || ''}
                        onChange={(e) => header.column.setFilterValue(e.target.value)}
                        placeholder="Filter by name..."
                        className="ease-theme mt-2 w-full rounded-md border border-[color:var(--lm-border)] bg-[var(--lm-input)] px-2 py-1 text-xs font-normal normal-case tracking-normal text-stone-700 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:ring-blue-400"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {header.column.getCanFilter() && header.column.id === 'cusip' && (
                      <input
                        type="text"
                        value={header.column.getFilterValue() || ''}
                        onChange={(e) => header.column.setFilterValue(e.target.value)}
                        placeholder="Filter..."
                        className="ease-theme mt-2 w-full rounded-md border border-[color:var(--lm-border)] bg-[var(--lm-input)] px-2 py-1 text-xs font-normal normal-case tracking-normal text-stone-700 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:ring-blue-400"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {header.column.getCanFilter() &&
                      (header.column.id === 'units' || header.column.id === 'value') && (
                        <div className="mt-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
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
                            className="ease-theme w-1/2 rounded-md border border-[color:var(--lm-border)] bg-[var(--lm-input)] px-2 py-1 text-xs font-normal normal-case tracking-normal text-stone-700 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:ring-blue-400"
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
                            className="ease-theme w-1/2 rounded-md border border-[color:var(--lm-border)] bg-[var(--lm-input)] px-2 py-1 text-xs font-normal normal-case tracking-normal text-stone-700 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:ring-blue-400"
                          />
                        </div>
                      )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[color:var(--lm-border)] dark:divide-gray-800">
            {visibleRows.map((row) => (
              <tr
                key={row.id}
                className="ease-theme odd:bg-[var(--lm-card)] even:bg-[var(--lm-row)] hover:bg-blue-50 dark:odd:bg-gray-950 dark:even:bg-gray-900 dark:hover:bg-blue-950"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="ease-theme px-2 py-2 text-sm text-stone-700 dark:text-gray-300 md:px-4 md:py-2.5"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ease-theme shrink-0 border-t border-[color:var(--lm-border)] bg-[var(--lm-raised)] px-3 py-2.5 dark:border-gray-800 dark:bg-gray-800/50 md:px-4 md:py-3">
        <p className="ease-theme text-xs text-stone-500 dark:text-gray-500">
          Showing {visibleRows.length.toLocaleString()} of {totalHoldings.toLocaleString()} holdings
        </p>
      </div>
    </div>
  )
}
