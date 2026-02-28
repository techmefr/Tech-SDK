# T-SDK

Camada de transporte de API independente de framework para o ecossistema T-Suite.

**Disponível em:** [English](./README.md) · [Français](./README.fr.md) · [Español](./README.es.md) · [Italiano](./README.it.md) · [Deutsch](./README.de.md) · [中文](./README.zh.md)

---

## Visão geral

T-SDK é uma camada de transporte HTTP fortemente tipada e baseada em drivers. Ela abstrai o protocolo de comunicação com o backend por trás de uma API fluente orientada a recursos, de forma que o frontend nunca sabe se está a comunicar com uma API REST, Lomkit ou GraphQL.

```ts
const res = await TSDK.user.create(payload)
```

### Princípios fundamentais

- **Independente do backend** — troque o driver, não os pontos de chamada
- **Independente do framework** — núcleo TypeScript puro com adaptadores para React, Vue e Astro
- **Fortemente tipado** — recursos e métodos inferidos em tempo de compilação
- **Erros normalizados** — cada falha HTTP é exposta como `TSDKError`

---

## Pacotes

| Pacote | Descrição |
|---|---|
| `@t-suite/t-sdk` | Transporte central (driver, normalização de erros) |
| `@t-suite/t-sdk-react` | Contexto React + hooks `useQuery` / `useMutation` |
| `@t-suite/t-sdk-vue` | Composables Vue (`useTSDK`, `useQuery`, `useMutation`) |
| `@t-suite/t-sdk-astro` | Helper lado servidor Astro (`defineTSDK`) |

---

## Instalação

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

### 2. Escolher um driver

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

const meuDriver: IDriver = {
    resolve(resource, method, payload): IRequest {
        return { url: `/${resource}/${method}`, method: 'POST', body: payload }
    },
}
```

### 3. Criar a instância

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

### 4. Realizar chamadas

```ts
const users   = await TSDK.user.list()
const newUser = await TSDK.user.create({ name: 'Alice', email: 'alice@example.com' })
```

---

## Tratamento de erros

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.create(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        console.log(error.status)   // Código HTTP
        console.log(error.message)  // Mensagem legível
        console.log(error.errors)   // Erros por campo
    }
}
```

---

## Adaptadores de Framework

### React / Next.js

```tsx
// Provedor no layout raiz
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

## Licença

MIT — © 2026 Gaetan Compigni
