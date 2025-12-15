// Custom events for cross-component communication

export const SEARCH_COMPLETED_EVENT = 'search-completed'
export const SEARCH_STARTED_EVENT = 'search-started'
export const DATA_REFRESH_EVENT = 'data-refresh'

// Track running searches globally
const runningSearches = new Set<string>()

export function dispatchSearchStarted(searchId: string) {
  runningSearches.add(searchId)
  window.dispatchEvent(new CustomEvent(SEARCH_STARTED_EVENT, { detail: { searchId } }))
}

export function dispatchSearchCompleted(searchId: string, result: { jobsFound: number; companiesFound: number }) {
  runningSearches.delete(searchId)
  window.dispatchEvent(new CustomEvent(SEARCH_COMPLETED_EVENT, { detail: { searchId, result } }))
}

export function dispatchSearchFailed(searchId: string) {
  runningSearches.delete(searchId)
  window.dispatchEvent(new CustomEvent(SEARCH_COMPLETED_EVENT, { detail: { searchId, result: null } }))
}

export function dispatchDataRefresh() {
  window.dispatchEvent(new CustomEvent(DATA_REFRESH_EVENT))
}

export function isSearchRunning(searchId: string): boolean {
  return runningSearches.has(searchId)
}

export function getRunningSearches(): string[] {
  return Array.from(runningSearches)
}

export function onSearchStarted(callback: (event: CustomEvent<{ searchId: string }>) => void) {
  const handler = (e: Event) => callback(e as CustomEvent)
  window.addEventListener(SEARCH_STARTED_EVENT, handler)
  return () => window.removeEventListener(SEARCH_STARTED_EVENT, handler)
}

export function onSearchCompleted(callback: (event: CustomEvent<{ searchId: string; result: { jobsFound: number; companiesFound: number } | null }>) => void) {
  const handler = (e: Event) => callback(e as CustomEvent)
  window.addEventListener(SEARCH_COMPLETED_EVENT, handler)
  return () => window.removeEventListener(SEARCH_COMPLETED_EVENT, handler)
}

export function onDataRefresh(callback: () => void) {
  window.addEventListener(DATA_REFRESH_EVENT, callback)
  return () => window.removeEventListener(DATA_REFRESH_EVENT, callback)
}
