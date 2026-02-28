# T-SDK

Framework-agnostic API transport layer for the T-Suite ecosystem.

**Available in:** [Français](./README.fr.md) · [Español](./README.es.md) · [Italiano](./README.it.md) · [Deutsch](./README.de.md) · [Português](./README.pt.md) · [中文](./README.zh.md)

---

## Overview

T-SDK is a strongly-typed, driver-based HTTP transport layer. It abstracts the backend communication protocol behind a fluent, resource-oriented API, so your frontend never knows whether it is talking to a REST API, a Lomkit API, or GraphQL.

```ts
const res = await TSDK.user.create(payload)
```

### Key principles

- **Backend-agnostic** — swap the driver, not the call sites
- **Framework-agnostic** — pure TypeScript core, with thin adapters for React, Vue, and Astro
- **Strictly typed** — resources and methods are inferred at compile time
- **Normalised errors** — every HTTP failure surfaces as a `TSDKError`

---

## Packages

| Package | Description |
|---|---|
| `@t-suite/t-sdk` | Core transport (driver, error normalisation) |
| `@t-suite/t-sdk-react` | React context + `useQuery` / `useMutation` hooks |
| `@t-suite/t-sdk-vue` | Vue composables (`useTSDK`, `useQuery`, `useMutation`) |
| `@t-suite/t-sdk-astro` | Astro server-side helper (`defineTSDK`) |

---

## Installation

### Using npm

```bash
# Core only
npm install @t-suite/t-sdk

# React / Next.js
npm install @t-suite/t-sdk @t-suite/t-sdk-react

# Vue / Nuxt
npm install @t-suite/t-sdk @t-suite/t-sdk-vue

# Astro
npm install @t-suite/t-sdk @t-suite/t-sdk-astro
```

### Using pnpm (recommended)

```bash
pnpm add @t-suite/t-sdk
pnpm add @t-suite/t-sdk-react  # React / Next.js
pnpm add @t-suite/t-sdk-vue    # Vue / Nuxt
pnpm add @t-suite/t-sdk-astro  # Astro
```

---

## Core SDK

### 1. Define your resources

A **Resource** declares the methods your backend exposes for that entity.

```ts
// resources/user.resource.ts
import type { IResource } from '@t-suite/t-sdk'

export const UserResource = {
    methods: {
        list:   { path: '/users',     httpMethod: 'GET'    },
        get:    { path: '/users/:id', httpMethod: 'GET'    },
        create: { path: '/users',     httpMethod: 'POST'   },
        update: { path: '/users/:id', httpMethod: 'PUT'    },
        delete: { path: '/users/:id', httpMethod: 'DELETE' },
    },
} satisfies IResource
```

### 2. Choose a driver

A **Driver** resolves the resource name and method name into a concrete HTTP request. Two drivers are included out of the box.

#### REST driver

Follows conventional REST URL patterns.

```ts
import { restDriver } from '@t-suite/t-sdk'
```

#### Lomkit driver

Sends every request as a `POST` with `{ action, payload }` — suited for Lomkit-flavoured backends.

```ts
import { lomkitDriver } from '@t-suite/t-sdk'
```

#### Custom driver

Implement the `IDriver` interface to target any backend convention.

```ts
import type { IDriver, IRequest } from '@t-suite/shared'

const myDriver: IDriver = {
    resolve(resource, method, payload): IRequest {
        return {
            url: `/${resource}/${method}`,
            method: 'POST',
            body: payload,
        }
    },
}
```

### 3. Create the SDK instance

```ts
// lib/tsdk.ts
import { createTSDK, restDriver } from '@t-suite/t-sdk'
import { ofetch } from 'ofetch'
import { UserResource } from './resources/user.resource'

export const TSDK = createTSDK({
    transport: ofetch,
    driver:    restDriver,
    baseURL:   'https://api.example.com',
    resources: {
        user: UserResource,
    },
})
```

> **Note:** `transport` accepts any function with the signature `(url: string, options?) => Promise<unknown>`. `ofetch`, `fetch`, or `axios` all work out of the box.

### 4. Make calls

```ts
const users  = await TSDK.user.list()
const user   = await TSDK.user.get({ id: 1 })
const newUser = await TSDK.user.create({ name: 'Alice', email: 'alice@example.com' })
```

TypeScript infers the available resources and methods from your definition — a typo like `TSDK.user.creat()` is caught at compile time.

---

## Error Handling

Every failed request is normalised into a `TSDKError`.

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.create(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        console.log(error.status)           // HTTP status code
        console.log(error.message)          // Human-readable message
        console.log(error.errors)           // Record<string, string[]> — field errors
    }
}
```

### Shape

```ts
interface TSDKError {
    status:  number
    message: string
    errors:  Record<string, string[]>
}
```

---

## Framework Adapters

### React / Next.js

#### Setup

Wrap your app (or layout) with `TSDKProvider`.

```tsx
// app/layout.tsx  (Next.js App Router)
import { TSDKProvider } from '@t-suite/t-sdk-react'
import { TSDK } from '@/lib/tsdk'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <body>
                <TSDKProvider sdk={TSDK}>{children}</TSDKProvider>
            </body>
        </html>
    )
}
```

#### `useQuery` — fetching data

```tsx
import { useTSDKContext, useQuery } from '@t-suite/t-sdk-react'

export function UserList() {
    const sdk = useTSDKContext()
    const { data, isLoading, error, refetch } = useQuery(() => sdk.user.list())

    if (isLoading) return <p>Loading…</p>
    if (error)     return <p>Error: {error.message}</p>

    return <ul>{(data as User[]).map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

#### `useMutation` — writing data

```tsx
import { useTSDKContext, useMutation } from '@t-suite/t-sdk-react'

export function CreateUserForm() {
    const sdk = useTSDKContext()
    const { mutate, isLoading, error } = useMutation((payload: UserPayload) =>
        sdk.user.create(payload)
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await mutate({ name: 'Alice', email: 'alice@example.com' })
    }

    return <form onSubmit={handleSubmit}>…</form>
}
```

---

### Vue / Nuxt

#### Setup

Call `provideTSDK` once at the app root or in a Nuxt plugin.

```ts
// plugins/tsdk.ts  (Nuxt)
import { provideTSDK } from '@t-suite/t-sdk-vue'
import { TSDK } from '@/lib/tsdk'

export default defineNuxtPlugin(() => {
    provideTSDK(TSDK)
})
```

#### `useQuery`

```vue
<script setup lang="ts">
import { useQuery, useTSDK } from '@t-suite/t-sdk-vue'

const sdk = useTSDK()
const { data, isLoading, error } = useQuery(() => sdk.user.list())
</script>

<template>
    <ul v-if="!isLoading">
        <li v-for="user in data" :key="user.id">{{ user.name }}</li>
    </ul>
</template>
```

#### `useMutation`

```vue
<script setup lang="ts">
import { useMutation, useTSDK } from '@t-suite/t-sdk-vue'

const sdk = useTSDK()
const { mutate, isLoading, error } = useMutation((p: UserPayload) => sdk.user.create(p))

async function submit() {
    await mutate({ name: 'Alice', email: 'alice@example.com' })
}
</script>
```

---

### Astro

T-SDK works server-side in Astro `.astro` files via `defineTSDK`. For client-side islands (React, Vue, Svelte), use the appropriate adapter.

```ts
// lib/tsdk.ts
import { defineTSDK } from '@t-suite/t-sdk-astro'
import { restDriver } from '@t-suite/t-sdk'
import { ofetch } from 'ofetch'
import { UserResource } from './resources/user.resource'

export const TSDK = defineTSDK({
    transport: ofetch,
    driver:    restDriver,
    baseURL:   'https://api.example.com',
    resources: { user: UserResource },
})
```

```astro
---
// pages/users.astro
import { TSDK } from '../lib/tsdk'

const users = await TSDK.user.list()
---

<ul>
    {users.map(u => <li>{u.name}</li>)}
</ul>
```

---

## Repository Structure

```
t-suite/
├── packages/
│   ├── shared/           # Shared interfaces (IDriver, ITSDKError)
│   ├── t-sdk/            # Core transport layer
│   ├── t-sdk-react/      # React adapter
│   ├── t-sdk-vue/        # Vue adapter
│   └── t-sdk-astro/      # Astro adapter
├── apps/                 # Playground apps (React, Next.js, Astro, Nuxt)
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## License

MIT — © 2026 Gaetan Compigni
