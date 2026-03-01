import { describe, it, expect } from 'vitest'
import { search } from './search'
import { mutate } from './mutate'
import { destroy } from './destroy'
import { restore } from './restore'
import { actions } from './actions'

describe('Lomkit method — search', () => {
    it('resolves to POST /{resource}/search with payload as body', () => {
        const payload = { filters: [{ field: 'active', value: true }] }
        expect(search.resolve('users', payload)).toEqual({
            url: '/users/search',
            method: 'POST',
            body: payload,
        })
    })

    it('defaults body to empty object when no payload given', () => {
        expect(search.resolve('users')).toEqual({
            url: '/users/search',
            method: 'POST',
            body: {},
        })
    })

    it('defaults body to empty object when payload is undefined', () => {
        expect(search.resolve('users', undefined)).toEqual({
            url: '/users/search',
            method: 'POST',
            body: {},
        })
    })
})

describe('Lomkit method — mutate', () => {
    it('resolves to POST /{resource}/mutate with payload as body', () => {
        const payload = { mutate: [{ operation: 'create', attributes: { name: 'Alice' } }] }
        expect(mutate.resolve('users', payload)).toEqual({
            url: '/users/mutate',
            method: 'POST',
            body: payload,
        })
    })
})

describe('Lomkit method — destroy', () => {
    it('resolves to POST /{resource}/mutate with destroy operation (numeric key)', () => {
        expect(destroy.resolve('users', { key: 42 })).toEqual({
            url: '/users/mutate',
            method: 'POST',
            body: { mutate: [{ operation: 'destroy', key: 42 }] },
        })
    })

    it('resolves to POST /{resource}/mutate with destroy operation (string key)', () => {
        const result = destroy.resolve('users', { key: 'abc' })
        expect(result.body).toEqual({ mutate: [{ operation: 'destroy', key: 'abc' }] })
    })
})

describe('Lomkit method — restore', () => {
    it('resolves to POST /{resource}/restore with key in array', () => {
        expect(restore.resolve('users', { key: 5 })).toEqual({
            url: '/users/restore',
            method: 'POST',
            body: { restore: [5] },
        })
    })

    it('works with string key', () => {
        const result = restore.resolve('users', { key: 'uuid-123' })
        expect(result.body).toEqual({ restore: ['uuid-123'] })
    })
})

describe('Lomkit method — actions', () => {
    it('resolves to POST /{resource}/actions/{action} with remaining body', () => {
        expect(actions.resolve('users', { action: 'approve', id: 5, reason: 'ok' })).toEqual({
            url: '/users/actions/approve',
            method: 'POST',
            body: { id: 5, reason: 'ok' },
        })
    })

    it('sends empty body when no extra fields beside action', () => {
        const result = actions.resolve('users', { action: 'sync' })
        expect(result.url).toBe('/users/actions/sync')
        expect(result.body).toEqual({})
    })
})
