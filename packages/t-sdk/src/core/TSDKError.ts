import type { ITSDKError } from '@t-suite/shared'

export class TSDKError extends Error implements ITSDKError {
    readonly status: number
    readonly errors: Record<string, string[]>

    constructor({ status, message, errors }: ITSDKError) {
        super(message)
        this.name = 'TSDKError'
        this.status = status
        this.errors = errors
    }

    static from(error: unknown): TSDKError {
        if (error instanceof TSDKError) return error

        if (error instanceof Error) {
            return new TSDKError({ status: 0, message: error.message, errors: {} })
        }

        return new TSDKError({ status: 0, message: 'Unknown error', errors: {} })
    }

    static isHttpError(error: unknown): error is { status: number; data: unknown } {
        return (
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            typeof (error as Record<string, unknown>).status === 'number'
        )
    }
}
