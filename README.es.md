# T-SDK

Capa de transporte de API independiente del framework para el ecosistema T-Suite.

**Disponible en:** [English](./README.md) · [Français](./README.fr.md) · [Italiano](./README.it.md) · [Deutsch](./README.de.md) · [Português](./README.pt.md) · [中文](./README.zh.md)

---

## Descripción general

T-SDK es una capa de transporte HTTP fuertemente tipada basada en drivers. Abstrae el protocolo de comunicación con el backend detrás de una API fluida orientada a recursos, de forma que el frontend nunca sabe si está hablando con una API REST, Lomkit o GraphQL.

```ts
const res = await TSDK.user.create(payload)
```

### Principios clave

- **Independiente del backend** — cambia el driver, no los puntos de llamada
- **Independiente del framework** — núcleo TypeScript puro, con adaptadores para React, Vue y Astro
- **Fuertemente tipado** — recursos y métodos inferidos en tiempo de compilación
- **Errores normalizados** — cada fallo HTTP se expone como `TSDKError`

---

## Paquetes

| Paquete | Descripción |
|---|---|
| `@t-suite/t-sdk` | Transporte central (driver, normalización de errores) |
| `@t-suite/t-sdk-react` | Contexto React + hooks `useQuery` / `useMutation` |
| `@t-suite/t-sdk-vue` | Composables Vue (`useTSDK`, `useQuery`, `useMutation`) |
| `@t-suite/t-sdk-astro` | Helper servidor Astro (`defineTSDK`) |

---

## Instalación

```bash
pnpm add @t-suite/t-sdk
pnpm add @t-suite/t-sdk-react  # React / Next.js
pnpm add @t-suite/t-sdk-vue    # Vue / Nuxt
pnpm add @t-suite/t-sdk-astro  # Astro
```

---

## SDK Core

### 1. Definir recursos

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

### 2. Elegir un driver

#### Driver REST

```ts
import { restDriver } from '@t-suite/t-sdk'
```

#### Driver Lomkit

```ts
import { lomkitDriver } from '@t-suite/t-sdk'
```

#### Driver personalizado

```ts
import type { IDriver, IRequest } from '@t-suite/shared'

const miDriver: IDriver = {
    resolve(resource, method, payload): IRequest {
        return { url: `/${resource}/${method}`, method: 'POST', body: payload }
    },
}
```

### 3. Crear la instancia

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

### 4. Realizar llamadas

```ts
const users   = await TSDK.user.list()
const newUser = await TSDK.user.create({ name: 'Alice', email: 'alice@example.com' })
```

---

## Manejo de errores

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.create(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        console.log(error.status)   // Código HTTP
        console.log(error.message)  // Mensaje legible
        console.log(error.errors)   // Errores por campo
    }
}
```

---

## Adaptadores de Framework

### React / Next.js

```tsx
// Proveedor en el layout raíz
import { TSDKProvider } from '@t-suite/t-sdk-react'
import { TSDK } from '@/lib/tsdk'

<TSDKProvider sdk={TSDK}>{children}</TSDKProvider>
```

```tsx
// Lectura de datos
import { useTSDKContext, useQuery } from '@t-suite/t-sdk-react'

const sdk = useTSDKContext()
const { data, isLoading, error } = useQuery(() => sdk.user.list())
```

```tsx
// Escritura de datos
import { useTSDKContext, useMutation } from '@t-suite/t-sdk-react'

const sdk = useTSDKContext()
const { mutate, isLoading } = useMutation((p: UserPayload) => sdk.user.create(p))
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

## Licencia

MIT — © 2026 Gaetan Compigni
