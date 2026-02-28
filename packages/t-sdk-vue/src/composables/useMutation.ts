import { ref, type Ref } from 'vue'

export interface IUseMutationResult<TPayload, TResult> {
    data: Ref<TResult | null>
    isLoading: Ref<boolean>
    error: Ref<Error | null>
    mutate: (payload: TPayload) => Promise<TResult>
}

export function useMutation<TPayload, TResult>(
    fn: (payload: TPayload) => Promise<TResult>
): IUseMutationResult<TPayload, TResult> {
    const data = ref<TResult | null>(null) as Ref<TResult | null>
    const isLoading = ref(false)
    const error = ref<Error | null>(null)

    async function mutate(payload: TPayload): Promise<TResult> {
        isLoading.value = true
        error.value = null

        try {
            const result = await fn(payload)
            data.value = result
            return result
        } catch (e) {
            error.value = e instanceof Error ? e : new Error(String(e))
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    return { data, isLoading, error, mutate }
}
