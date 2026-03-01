<template>
    <main>
        <h1>T-SDK — Nuxt playground</h1>

        <h2>Posts</h2>
        <p v-if="isLoading">Loading…</p>
        <p v-else-if="error">Error: {{ error.message }}</p>
        <ul v-else>
            <li v-for="post in posts" :key="post.id">
                <strong>{{ post.title }}</strong>
                <p>{{ post.body }}</p>
            </li>
        </ul>

        <h2>Create a post</h2>
        <form @submit.prevent="handleSubmit">
            <input v-model="title" placeholder="Post title" />
            <button type="submit" :disabled="isCreating || !title">
                {{ isCreating ? 'Creating…' : 'Create post' }}
            </button>
        </form>
        <p v-if="created">Created: <strong>{{ created.title }}</strong> (id: {{ created.id }})</p>
    </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTSDK, useQuery } from '@t-suite/t-sdk-vue'

interface IPost {
    id: number
    title: string
    body: string
}

const sdk = useTSDK()

const { data, isLoading, error } = useQuery<IPost[]>(() => sdk.posts.list() as Promise<IPost[]>)
const posts = computed(() => data.value?.slice(0, 5) ?? [])

const title = ref('')
const isCreating = ref(false)
const created = ref<IPost | null>(null)

async function handleSubmit() {
    if (!title.value) return
    isCreating.value = true
    try {
        created.value = (await sdk.posts.create({
            title: title.value,
            body: 'Created via T-SDK',
            userId: 1,
        })) as IPost
        title.value = ''
    } finally {
        isCreating.value = false
    }
}
</script>
