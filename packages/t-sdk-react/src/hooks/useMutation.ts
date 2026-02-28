import { useState, useCallback } from 'react'

export interface IUseMutationResult<TPayload, TResult> {
    data: TResult | null
    isLoading: boolean
    error: Error | null
    mutate: (payload: TPayload) => Promise<TResult>
}

export function useMutation<TPayload, TResult>(
    fn: (payload: TPayload) => Promise<TResult>
): IUseMutationResult<TPayload, TResult> {
    const [data, setData] = useState<TResult | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const mutate = useCallback(
        async (payload: TPayload): Promise<TResult> => {
            setIsLoading(true)
            setError(null)

            try {
                const result = await fn(payload)
                setData(result)
                return result
            } catch (e) {
                const err = e instanceof Error ? e : new Error(String(e))
                setError(err)
                throw err
            } finally {
                setIsLoading(false)
            }
        },
        [fn]
    )

    return { data, isLoading, error, mutate }
}
