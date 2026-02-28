import { ref, onMounted, type Ref } from 'vue'

export interface IUseQueryResult<T> {
    data: Ref<T | null>
    isLoading: Ref<boolean>
    error: Ref<Error | null>
    refetch: () => Promise<void>
}

export function useQuery<T>(fn: () => Promise<T>): IUseQueryResult<T> {
    const data = ref<T | null>(null) as Ref<T | null>
    const isLoading = ref(true)
    const error = ref<Error | null>(null)

    async function execute(): Promise<void> {
        isLoading.value = true
        error.value = null

        try {
            data.value = await fn()
        } catch (e) {
            error.value = e instanceof Error ? e : new Error(String(e))
        } finally {
            isLoading.value = false
        }
    }

    onMounted(execute)

    return { data, isLoading, error, refetch: execute }
}
