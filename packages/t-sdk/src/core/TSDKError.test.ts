import { describe, it, expect } from 'vitest'
import { TSDKError } from './TSDKError'

describe('TSDKError', () => {
    describe('constructor', () => {
        it('sets status, message and errors', () => {
            const error = new TSDKError({ status: 422, message: 'Unprocessable', errors: { name: ['required'] } })

            expect(error.status).toBe(422)
            expect(error.message).toBe('Unprocessable')
            expect(error.errors).toEqual({ name: ['required'] })
        })

        it('sets name to TSDKError', () => {
            const error = new TSDKError({ status: 500, message: 'fail', errors: {} })
            expect(error.name).toBe('TSDKError')
        })

        it('is an instance of Error', () => {
            const error = new TSDKError({ status: 404, message: 'Not found', errors: {} })
            expect(error).toBeInstanceOf(Error)
        })
    })

    describe('from()', () => {
        it('returns the same TSDKError if already one', () => {
            const original = new TSDKError({ status: 403, message: 'Forbidden', errors: {} })
            expect(TSDKError.from(original)).toBe(original)
        })

        it('wraps a plain Error with status 0', () => {
            const wrapped = TSDKError.from(new Error('something broke'))
            expect(wrapped).toBeInstanceOf(TSDKError)
            expect(wrapped.status).toBe(0)
            expect(wrapped.message).toBe('something broke')
        })

        it('returns a generic error for unknown values', () => {
            const wrapped = TSDKError.from('oops')
            expect(wrapped).toBeInstanceOf(TSDKError)
            expect(wrapped.status).toBe(0)
            expect(wrapped.message).toBe('Unknown error')
        })
    })

    describe('isHttpError()', () => {
        it('returns true for objects with a numeric status', () => {
            expect(TSDKError.isHttpError({ status: 404, data: null })).toBe(true)
        })

        it('returns false for objects without status', () => {
            expect(TSDKError.isHttpError({ message: 'oops' })).toBe(false)
        })

        it('returns false for non-objects', () => {
            expect(TSDKError.isHttpError('error')).toBe(false)
            expect(TSDKError.isHttpError(null)).toBe(false)
            expect(TSDKError.isHttpError(undefined)).toBe(false)
        })

        it('returns false when status is not a number', () => {
            expect(TSDKError.isHttpError({ status: '404' })).toBe(false)
        })
    })
})
