# T-SDK

Livello di trasporto API indipendente dal framework per l'ecosistema T-Suite.

**Disponibile in:** [English](./README.md) · [Français](./README.fr.md) · [Español](./README.es.md) · [Deutsch](./README.de.md) · [Português](./README.pt.md) · [中文](./README.zh.md)

---

## Panoramica

T-SDK è uno strato di trasporto HTTP fortemente tipizzato basato su driver. Astrae il protocollo di comunicazione con il backend dietro un'API fluente orientata alle risorse, così il frontend non sa mai se sta parlando con una REST API, Lomkit o GraphQL.

```ts
const res = await TSDK.user.create(payload)
```

### Principi chiave

- **Indipendente dal backend** — cambia il driver, non i punti di chiamata
- **Indipendente dal framework** — core TypeScript puro con adattatori per React, Vue e Astro
- **Fortemente tipizzato** — risorse e metodi inferiti a tempo di compilazione
- **Errori normalizzati** — ogni fallimento HTTP viene esposto come `TSDKError`

---

## Pacchetti

| Pacchetto | Descrizione |
|---|---|
| `@t-suite/t-sdk` | Trasporto centrale (driver, normalizzazione errori) |
| `@t-suite/t-sdk-react` | Contesto React + hook `useQuery` / `useMutation` |
| `@t-suite/t-sdk-vue` | Composables Vue (`useTSDK`, `useQuery`, `useMutation`) |
| `@t-suite/t-sdk-astro` | Helper lato server Astro (`defineTSDK`) |

---

## Installazione

```bash
pnpm add @t-suite/t-sdk
pnpm add @t-suite/t-sdk-react  # React / Next.js
pnpm add @t-suite/t-sdk-vue    # Vue / Nuxt
pnpm add @t-suite/t-sdk-astro  # Astro
```

---

## SDK Core

### 1. Definire le risorse

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

### 2. Scegliere un driver

#### Driver REST

```ts
import { restDriver } from '@t-suite/t-sdk'
```

#### Driver Lomkit

```ts
import { lomkitDriver } from '@t-suite/t-sdk'
```

#### Driver personalizzato

```ts
import type { IDriver, IRequest } from '@t-suite/shared'

const mioDriver: IDriver = {
    resolve(resource, method, payload): IRequest {
        return { url: `/${resource}/${method}`, method: 'POST', body: payload }
    },
}
```

### 3. Creare l'istanza

```ts
// lib/tsdk.ts
import { createTSDK, restDriver } from '@t-suite/t-sdk'
import { ofetch } from 'ofetch'
import { UserResource } from './resources/user.resource'

export const TSDK = createTSDK({
    transport: ofetch,
    driver:    restDriver,
    baseURL:   'https://api.example.com',
    resources: { user: UserResource },
})
```

### 4. Effettuare chiamate

```ts
const users   = await TSDK.user.list()
const newUser = await TSDK.user.create({ name: 'Alice', email: 'alice@example.com' })
```

---

## Gestione degli errori

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.create(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        console.log(error.status)   // Codice HTTP
        console.log(error.message)  // Messaggio leggibile
        console.log(error.errors)   // Errori per campo
    }
}
```

---

## Adattatori Framework

### React / Next.js

```tsx
// Provider nel layout radice
import { TSDKProvider } from '@t-suite/t-sdk-react'
import { TSDK } from '@/lib/tsdk'

<TSDKProvider sdk={TSDK}>{children}</TSDKProvider>
```

```tsx
import { useTSDKContext, useQuery } from '@t-suite/t-sdk-react'

const sdk = useTSDKContext()
const { data, isLoading, error } = useQuery(() => sdk.user.list())
```

```tsx
import { useTSDKContext, useMutation } from '@t-suite/t-sdk-react'

const sdk = useTSDKContext()
const { mutate } = useMutation((p: UserPayload) => sdk.user.create(p))
```

---

### Vue / Nuxt

```ts
// plugins/tsdk.ts (Nuxt)
import { provideTSDK } from '@t-suite/t-sdk-vue'
import { TSDK } from '@/lib/tsdk'

export default defineNuxtPlugin(() => provideTSDK(TSDK))
```

```vue
<script setup lang="ts">
import { useQuery, useTSDK } from '@t-suite/t-sdk-vue'

const sdk = useTSDK()
const { data, isLoading } = useQuery(() => sdk.user.list())
</script>
```

---

### Astro

```astro
---
import { TSDK } from '../lib/tsdk'
const users = await TSDK.user.list()
---
<ul>{users.map(u => <li>{u.name}</li>)}</ul>
```

---

## Licenza

MIT — © 2026 Gaetan Compigni
