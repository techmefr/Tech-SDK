# T-SDK

Couche de transport API framework-agnostique pour l'écosystème T-Suite.

**Disponible en :** [English](./README.md) · [Español](./README.es.md) · [Italiano](./README.it.md) · [Deutsch](./README.de.md) · [Português](./README.pt.md) · [中文](./README.zh.md)

---

## Vue d'ensemble

T-SDK est une couche de transport HTTP fortement typée, basée sur un système de drivers. Elle abstrait le protocole de communication backend derrière une API fluide orientée ressources, de sorte que votre frontend ne sait jamais s'il parle à une API REST, Lomkit ou GraphQL.

```ts
const res = await TSDK.user.create(payload)
```

### Principes clés

- **Agnostique backend** — changez le driver, pas les appels
- **Agnostique framework** — cœur TypeScript pur, avec des adaptateurs légers pour React, Vue et Astro
- **Fortement typé** — ressources et méthodes inférées à la compilation
- **Erreurs normalisées** — chaque échec HTTP remonte sous forme de `TSDKError`

---

## Packages

| Package | Description |
|---|---|
| `@t-suite/t-sdk` | Transport central (driver, normalisation d'erreurs) |
| `@t-suite/t-sdk-react` | Contexte React + hooks `useQuery` / `useMutation` |
| `@t-suite/t-sdk-vue` | Composables Vue (`useTSDK`, `useQuery`, `useMutation`) |
| `@t-suite/t-sdk-astro` | Helper côté serveur Astro (`defineTSDK`) |

---

## Installation

### Avec npm

```bash
# Cœur uniquement
npm install @t-suite/t-sdk

# React / Next.js
npm install @t-suite/t-sdk @t-suite/t-sdk-react

# Vue / Nuxt
npm install @t-suite/t-sdk @t-suite/t-sdk-vue

# Astro
npm install @t-suite/t-sdk @t-suite/t-sdk-astro
```

### Avec pnpm (recommandé)

```bash
pnpm add @t-suite/t-sdk
pnpm add @t-suite/t-sdk-react  # React / Next.js
pnpm add @t-suite/t-sdk-vue    # Vue / Nuxt
pnpm add @t-suite/t-sdk-astro  # Astro
```

---

## SDK Core

### 1. Définir vos ressources

Une **Resource** déclare les méthodes que votre backend expose pour cette entité.

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

### 2. Choisir un driver

Un **Driver** transforme le nom de la ressource et de la méthode en une requête HTTP concrète.

#### Driver REST

Suit les conventions d'URL REST classiques.

```ts
import { restDriver } from '@t-suite/t-sdk'
```

#### Driver Lomkit

Envoie chaque requête en `POST` avec `{ action, payload }`.

```ts
import { lomkitDriver } from '@t-suite/t-sdk'
```

#### Driver personnalisé

Implémentez l'interface `IDriver` pour cibler n'importe quelle convention backend.

```ts
import type { IDriver, IRequest } from '@t-suite/shared'

const monDriver: IDriver = {
    resolve(resource, method, payload): IRequest {
        return {
            url: `/${resource}/${method}`,
            method: 'POST',
            body: payload,
        }
    },
}
```

### 3. Créer l'instance du SDK

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

### 4. Effectuer des appels

```ts
const users   = await TSDK.user.list()
const user    = await TSDK.user.get({ id: 1 })
const newUser = await TSDK.user.create({ name: 'Alice', email: 'alice@example.com' })
```

---

## Gestion des erreurs

Chaque requête échouée est normalisée en `TSDKError`.

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.create(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        console.log(error.status)   // Code HTTP
        console.log(error.message)  // Message lisible
        console.log(error.errors)   // Erreurs par champ
    }
}
```

---

## Adaptateurs Framework

### React / Next.js

#### Configuration

Enveloppez votre application avec `TSDKProvider`.

```tsx
// app/layout.tsx
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

#### `useQuery`

```tsx
import { useTSDKContext, useQuery } from '@t-suite/t-sdk-react'

export function UserList() {
    const sdk = useTSDKContext()
    const { data, isLoading, error } = useQuery(() => sdk.user.list())

    if (isLoading) return <p>Chargement…</p>
    if (error)     return <p>Erreur : {error.message}</p>

    return <ul>{(data as User[]).map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

#### `useMutation`

```tsx
import { useTSDKContext, useMutation } from '@t-suite/t-sdk-react'

export function CreateUserForm() {
    const sdk = useTSDKContext()
    const { mutate, isLoading } = useMutation((p: UserPayload) => sdk.user.create(p))

    return <button onClick={() => mutate({ name: 'Alice', email: 'alice@example.com' })}>Créer</button>
}
```

---

### Vue / Nuxt

#### Configuration

Appelez `provideTSDK` à la racine de l'app ou dans un plugin Nuxt.

```ts
// plugins/tsdk.ts (Nuxt)
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
```

#### `useMutation`

```vue
<script setup lang="ts">
import { useMutation, useTSDK } from '@t-suite/t-sdk-vue'

const sdk = useTSDK()
const { mutate, isLoading } = useMutation((p: UserPayload) => sdk.user.create(p))

async function submit() {
    await mutate({ name: 'Alice', email: 'alice@example.com' })
}
</script>
```

---

### Astro

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
import { TSDK } from '../lib/tsdk'
const users = await TSDK.user.list()
---

<ul>
    {users.map(u => <li>{u.name}</li>)}
</ul>
```

---

## Licence

MIT — © 2026 Gaetan Compigni
