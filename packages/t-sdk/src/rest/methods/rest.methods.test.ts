import { describe, it, expect } from 'vitest'
import { list } from './list'
import { get } from './get'
import { create } from './create'
import { update } from './update'
import { del } from './delete'

describe('REST method — list', () => {
    it('resolves to GET /{resource}', () => {
        expect(list.resolve('users')).toEqual({ url: '/users', method: 'GET' })
    })

    it('works for any resource name', () => {
        expect(list.resolve('products').url).toBe('/products')
    })
})

describe('REST method — get', () => {
    it('resolves to GET /{resource}/{id} with numeric id', () => {
        expect(get.resolve('users', { id: 5 })).toEqual({ url: '/users/5', method: 'GET' })
    })

    it('resolves to GET /{resource}/{id} with string id', () => {
        expect(get.resolve('users', { id: 'abc' })).toEqual({ url: '/users/abc', method: 'GET' })
    })
})

describe('REST method — create', () => {
    it('resolves to POST /{resource} with the full payload as body', () => {
        const payload = { name: 'Alice', email: 'alice@example.com' }
        expect(create.resolve('users', payload)).toEqual({
            url: '/users',
            method: 'POST',
            body: payload,
        })
    })
})

describe('REST method — update', () => {
    it('resolves to PUT /{resource}/{id} and strips id from body', () => {
        expect(update.resolve('users', { id: 5, name: 'Bob' })).toEqual({
            url: '/users/5',
            method: 'PUT',
            body: { name: 'Bob' },
        })
    })

    it('works with string id', () => {
        const result = update.resolve('users', { id: 'xyz', role: 'admin' })
        expect(result.url).toBe('/users/xyz')
        expect(result.body).toEqual({ role: 'admin' })
    })
})

describe('REST method — delete', () => {
    it('resolves to DELETE /{resource}/{id}', () => {
        expect(del.resolve('users', { id: 5 })).toEqual({ url: '/users/5', method: 'DELETE' })
    })

    it('works with string id', () => {
        expect(del.resolve('users', { id: 'abc' }).url).toBe('/users/abc')
    })
})
