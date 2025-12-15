'use client'

import { useState, useEffect, useCallback } from 'react'
import { onSearchStarted, onSearchCompleted, getRunningSearches, isSearchRunning } from '@/lib/events'

export function useRunningSearches() {
  const [runningIds, setRunningIds] = useState<string[]>(() => getRunningSearches())

  useEffect(() => {
    const unsubscribeStarted = onSearchStarted((event) => {
      setRunningIds(prev => [...prev, event.detail.searchId])
    })

    const unsubscribeCompleted = onSearchCompleted((event) => {
      setRunningIds(prev => prev.filter(id => id !== event.detail.searchId))
    })

    return () => {
      unsubscribeStarted()
      unsubscribeCompleted()
    }
  }, [])

  const isRunning = useCallback((searchId: string) => {
    return runningIds.includes(searchId)
  }, [runningIds])

  return {
    runningIds,
    isRunning,
    hasRunning: runningIds.length > 0,
  }
}
