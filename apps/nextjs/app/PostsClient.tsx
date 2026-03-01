'use client'

import { useCallback, useState } from 'react'
import { useTSDKContext, useMutation } from '@t-suite/t-sdk-react'

interface IPost {
    id: number
    title: string
}

export function PostsClient() {
    const sdk = useTSDKContext()
    const [title, setTitle] = useState('')
    const { mutate, data, isLoading } = useMutation<
        { title: string; body: string; userId: number },
        IPost
    >(useCallback(payload => sdk.posts.create(payload) as Promise<IPost>, [sdk]))

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        await mutate({ title, body: 'Created via T-SDK', userId: 1 })
        setTitle('')
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Post title"
                />
                <button type="submit" disabled={isLoading || !title}>
                    {isLoading ? 'Creating…' : 'Create post'}
                </button>
            </form>
            {data && (
                <p>
                    Created: <strong>{data.title}</strong> (id: {data.id})
                </p>
            )}
        </div>
    )
}
