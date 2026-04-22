export function readInitialDarkMode() {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') {
      return true
    }
    if (stored === 'light') {
      return false
    }
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
