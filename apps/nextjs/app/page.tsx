import { tsdk } from '../lib/tsdk'
import { PostsClient } from './PostsClient'

interface IPost {
    id: number
    title: string
    body: string
}

export default async function Home() {
    const posts = (await tsdk.rest.posts.list()) as IPost[]

    return (
        <main>
            <h1>T-SDK — Next.js playground</h1>
            <h2>Posts (server component)</h2>
            <ul>
                {posts.slice(0, 5).map(post => (
                    <li key={post.id}>
                        <strong>{post.title}</strong>
                        <p>{post.body}</p>
                    </li>
                ))}
            </ul>
            <h2>Create a post (client component)</h2>
            <PostsClient />
        </main>
    )
}
