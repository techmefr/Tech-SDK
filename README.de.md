# T-SDK

Framework-agnostische API-Transportschicht für das T-Suite-Ökosystem.

**Verfügbar in:** [English](./README.md) · [Français](./README.fr.md) · [Español](./README.es.md) · [Italiano](./README.it.md) · [Português](./README.pt.md) · [中文](./README.zh.md)

---

## Überblick

T-SDK ist eine stark typisierte, treiberbasierte HTTP-Transportschicht. Sie abstrahiert das Backend-Kommunikationsprotokoll hinter einer fließenden, ressourcenorientierten API, sodass das Frontend nie weiß, ob es mit einer REST-, Lomkit- oder GraphQL-API kommuniziert.

```ts
const res = await TSDK.user.create(payload)
```

### Kernprinzipien

- **Backend-agnostisch** — Treiber wechseln, nicht die Aufrufstellen
- **Framework-agnostisch** — reines TypeScript-Kern mit Adaptern für React, Vue und Astro
- **Stark typisiert** — Ressourcen und Methoden werden zur Kompilierzeit inferiert
- **Normalisierte Fehler** — jeder HTTP-Fehler wird als `TSDKError` zurückgegeben

---

## Pakete

| Paket | Beschreibung |
|---|---|
| `@t-suite/t-sdk` | Kerntransport (Treiber, Fehlernormalisierung) |
| `@t-suite/t-sdk-react` | React-Kontext + `useQuery` / `useMutation` Hooks |
| `@t-suite/t-sdk-vue` | Vue Composables (`useTSDK`, `useQuery`, `useMutation`) |
| `@t-suite/t-sdk-astro` | Astro Server-Helper (`defineTSDK`) |

---

## Installation

```bash
pnpm add @t-suite/t-sdk
pnpm add @t-suite/t-sdk-react  # React / Next.js
pnpm add @t-suite/t-sdk-vue    # Vue / Nuxt
pnpm add @t-suite/t-sdk-astro  # Astro
```

---

## SDK Core

### 1. Ressourcen definieren

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

### 2. Treiber wählen

#### REST-Treiber

```ts
import { restDriver } from '@t-suite/t-sdk'
```

#### Lomkit-Treiber

```ts
import { lomkitDriver } from '@t-suite/t-sdk'
```

#### Eigener Treiber

```ts
import type { IDriver, IRequest } from '@t-suite/shared'

const meinTreiber: IDriver = {
    resolve(resource, method, payload): IRequest {
        return { url: `/${resource}/${method}`, method: 'POST', body: payload }
    },
}
```

### 3. Instanz erstellen

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

### 4. Aufrufe durchführen

```ts
const users   = await TSDK.user.list()
const newUser = await TSDK.user.create({ name: 'Alice', email: 'alice@example.com' })
```

---

## Fehlerbehandlung

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.create(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        console.log(error.status)   // HTTP-Statuscode
        console.log(error.message)  // Lesbare Fehlermeldung
        console.log(error.errors)   // Feldfehler
    }
}
```

---

## Framework-Adapter

### React / Next.js

```tsx
// Provider im Root-Layout
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

## Lizenz

MIT — © 2026 Gaetan Compigni
