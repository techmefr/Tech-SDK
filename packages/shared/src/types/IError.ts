export interface ITSDKError {
    status: number
    message: string
    errors: Record<string, string[]>
}
