import { useState, useEffect, useCallback } from 'react'

export interface IUseQueryResult<T> {
    data: T | null
    isLoading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

export function useQuery<T>(fn: () => Promise<T>): IUseQueryResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const execute = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            setData(await fn())
        } catch (e) {
            setError(e instanceof Error ? e : new Error(String(e)))
        } finally {
            setIsLoading(false)
        }
    }, [fn])

    useEffect(() => {
        execute()
    }, [execute])

    return { data, isLoading, error, refetch: execute }
}
