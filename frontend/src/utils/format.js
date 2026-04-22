export function getCurrencySymbol(currency) {
  const symbols = { USD: '$' }
  return symbols[currency] || currency || '$'
}

export function formatNumber(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  const num = parseFloat(value)
  if (isNaN(num)) {
    return value
  }
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatRowForPdf(r) {
  const cusip = r.cusip === '000000000' ? 'N/A' : (r.cusip ?? '')
  const sym = getCurrencySymbol(r.currency)
  const units = formatNumber(Number(r.units))
  const val = formatNumber(Number(r.value))
  return [String(r.title ?? ''), cusip, units ? `${sym} ${units}` : '', val ? `${sym} ${val}` : '']
}
