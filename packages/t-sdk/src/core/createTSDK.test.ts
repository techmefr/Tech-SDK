import { describe, it, expect, vi } from 'vitest'
import { createTSDK } from './createTSDK'
import { TSDKError } from './TSDKError'

const mockMethod = {
    resolve: vi.fn((resource: string, payload?: unknown) => ({
        url: `/${resource}/action`,
        method: 'POST' as const,
        body: payload,
    })),
}

const mockPlugin = { methods: { action: mockMethod } }

function makeTransport(returnValue: unknown = { data: [] }) {
    return vi.fn().mockResolvedValue(returnValue)
}

describe('createTSDK', () => {
    it('creates an instance with all declared resources', () => {
        const sdk = createTSDK({
            transport: makeTransport(),
            baseURL: 'https://api.example.com',
            plugin: mockPlugin,
            resources: ['users', 'orders'] as const,
        })

        expect(sdk).toHaveProperty('users')
        expect(sdk).toHaveProperty('orders')
    })

    it('attaches all plugin methods to each resource', () => {
        const sdk = createTSDK({
            transport: makeTransport(),
            baseURL: 'https://api.example.com',
            plugin: mockPlugin,
            resources: ['users'] as const,
        })

        expect(typeof sdk.users.action).toBe('function')
    })

    it('calls transport with the correct URL and options', async () => {
        const transport = makeTransport()
        const sdk = createTSDK({
            transport,
            baseURL: 'https://api.example.com',
            plugin: mockPlugin,
            resources: ['users'] as const,
        })

        await sdk.users.action({ id: 1 })

        expect(transport).toHaveBeenCalledWith('https://api.example.com/users/action', {
            method: 'POST',
            body: { id: 1 },
            headers: undefined,
        })
    })

    it('calls resolve with the resource name and payload', async () => {
        mockMethod.resolve.mockClear()
        const sdk = createTSDK({
            transport: makeTransport(),
            baseURL: 'https://api.example.com',
            plugin: mockPlugin,
            resources: ['products'] as const,
        })

        await sdk.products.action({ key: 42 })

        expect(mockMethod.resolve).toHaveBeenCalledWith('products', { key: 42 })
    })

    it('returns the transport result', async () => {
        const result = { data: [{ id: 1 }] }
        const sdk = createTSDK({
            transport: makeTransport(result),
            baseURL: 'https://api.example.com',
            plugin: mockPlugin,
            resources: ['users'] as const,
        })

        const response = await sdk.users.action()
        expect(response).toBe(result)
    })

    it('throws TSDKError when transport throws an HTTP error', async () => {
        const httpError = { status: 422, data: { message: 'Validation failed', errors: { name: ['required'] } } }
        const transport = vi.fn().mockRejectedValue(httpError)
        const sdk = createTSDK({
            transport,
            baseURL: 'https://api.example.com',
            plugin: mockPlugin,
            resources: ['users'] as const,
        })

        await expect(sdk.users.action()).rejects.toBeInstanceOf(TSDKError)

        try {
            await sdk.users.action()
        } catch (e) {
            const err = e as TSDKError
            expect(err.status).toBe(422)
            expect(err.message).toBe('Validation failed')
            expect(err.errors).toEqual({ name: ['required'] })
        }
    })

    it('throws TSDKError when transport throws a plain Error', async () => {
        const transport = vi.fn().mockRejectedValue(new Error('network failure'))
        const sdk = createTSDK({
            transport,
            baseURL: 'https://api.example.com',
            plugin: mockPlugin,
            resources: ['users'] as const,
        })

        await expect(sdk.users.action()).rejects.toBeInstanceOf(TSDKError)
    })

    it('isolates resources — each gets its own method calls', async () => {
        mockMethod.resolve.mockClear()
        const sdk = createTSDK({
            transport: makeTransport(),
            baseURL: 'https://api.example.com',
            plugin: mockPlugin,
            resources: ['users', 'orders'] as const,
        })

        await sdk.users.action()
        await sdk.orders.action()

        expect(mockMethod.resolve).toHaveBeenNthCalledWith(1, 'users', undefined)
        expect(mockMethod.resolve).toHaveBeenNthCalledWith(2, 'orders', undefined)
    })
})
