import { useCallback, useState } from 'react'
import { useTSDKContext, useQuery, useMutation } from '@t-suite/t-sdk-react'

interface IPost {
    id: number
    title: string
    body: string
    userId: number
}

function PostList() {
    const sdk = useTSDKContext()
    const { data, isLoading, error } = useQuery<IPost[]>(
        useCallback(() => sdk.posts.list() as Promise<IPost[]>, [sdk]),
    )

    if (isLoading) return <p>Loading posts…</p>
    if (error) return <p>Error: {error.message}</p>

    return (
        <ul>
            {(data ?? []).slice(0, 5).map(post => (
                <li key={post.id}>
                    <strong>{post.title}</strong>
                    <p>{post.body}</p>
                </li>
            ))}
        </ul>
    )
}

function CreatePost() {
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

export default function App() {
    return (
        <main>
            <h1>T-SDK — React playground</h1>
            <h2>Posts</h2>
            <PostList />
            <h2>Create a post</h2>
            <CreatePost />
        </main>
    )
}
