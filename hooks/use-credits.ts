'use client'

import { useState, useEffect, useCallback } from 'react'

interface Credits {
    enrichment: {
        used: number
        limit: number
        remaining: number
    }
    icp: {
        used: number
        limit: number
        remaining: number
    }
    plan: {
        id: string
        name: string
        price: number
    }
    billingCycle: {
        start: string
        end: string
    }
}

export function useCredits() {
    const [credits, setCredits] = useState<Credits | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCredits = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await fetch('/api/credits')
            if (!response.ok) {
                throw new Error('Failed to fetch credits')
            }
            const data = await response.json()
            setCredits(data)
        } catch (err) {
            console.error('Error fetching credits:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch credits')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCredits()
    }, [fetchCredits])

    const consumeCredits = useCallback(async (type: 'enrichment' | 'icp', amount: number) => {
        try {
            const response = await fetch('/api/credits/consume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, amount }),
            })

            if (!response.ok) {
                const error = await response.json()
                if (response.status === 402) {
                    throw new Error(`Insufficient ${type} credits. Required: ${amount}, Remaining: ${error.remaining}`)
                }
                throw new Error(error.error || 'Failed to consume credits')
            }

            const result = await response.json()

            // Update local state
            if (credits) {
                setCredits({
                    ...credits,
                    [type]: {
                        ...credits[type],
                        used: result.used,
                        remaining: result.remaining,
                    },
                })
            }

            return result
        } catch (err) {
            console.error('Error consuming credits:', err)
            throw err
        }
    }, [credits])

    const refetch = useCallback(() => {
        fetchCredits()
    }, [fetchCredits])

    return {
        credits,
        isLoading,
        error,
        consumeCredits,
        refetch,
        // Convenience accessors
        enrichmentRemaining: credits?.enrichment.remaining ?? 0,
        icpRemaining: credits?.icp.remaining ?? 0,
        enrichmentUsed: credits?.enrichment.used ?? 0,
        icpUsed: credits?.icp.used ?? 0,
        enrichmentLimit: credits?.enrichment.limit ?? 0,
        icpLimit: credits?.icp.limit ?? 0,
        planName: credits?.plan.name ?? 'Free',
        planId: credits?.plan.id ?? 'free',
    }
}
