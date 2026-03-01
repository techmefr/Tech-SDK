# T-SDK

Camada de transporte de API agnóstica ao framework para o ecossistema T-Suite.

**Disponível em:** [English](./README.md) · [Français](./README.fr.md) · [Español](./README.es.md) · [Italiano](./README.it.md) · [Deutsch](./README.de.md) · [中文](./README.zh.md)

---

## Visão geral

O T-SDK é uma camada de transporte HTTP fortemente tipada e baseada em plugins. Em vez de configurar métodos HTTP e rotas por recurso, instala-se um **sub-SDK** (um plugin para a convenção do backend) e declaram-se apenas os nomes dos recursos necessários. O plugin fornece todos os métodos.

```ts
import { createLomkitSDK } from '@t-suite/t-sdk/lomkit'
import { ofetch } from 'ofetch'

const TSDK = createLomkitSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product', 'order'] as const,
})

await TSDK.user.search({ filters: [{ field: 'active', value: true }] })
await TSDK.user.mutate({ mutate: [{ operation: 'create', attributes: { name: 'Alice' } }] })
await TSDK.product.destroy({ key: 42 })
```

### Princípios fundamentais

- **Arquitectura plugin** — o sub-SDK detém os métodos, o driver e os tipos
- **Recurso = um nome** — passa-se `'user'` e obtêm-se todos os métodos do plugin inferidos pelo TypeScript
- **Método = um ficheiro** — cada método é um ficheiro autónomo que resolve o seu próprio pedido HTTP
- **Nomeado pela equipa de frontend** — `softDelete`, `archive`, `publish` mapeiam para o que o backend espera
- **Scaffolding CLI** — adiciona sub-SDKs, recursos e métodos sem tocar em nenhum ficheiro existente

---

## Pacotes

| Pacote | Descrição |
|---|---|
| `@t-suite/t-sdk` | Core + sub-SDKs integrados (`/rest`, `/lomkit`) |
| `@t-suite/t-sdk-cli` | CLI — `t-sdk add`, `t-sdk add-resource`, `t-sdk add-method` |
| `@t-suite/t-sdk-react` | Contexto React + hooks `useQuery` / `useMutation` |
| `@t-suite/t-sdk-vue` | Composables Vue (`useTSDK`, `useQuery`, `useMutation`) |
| `@t-suite/t-sdk-astro` | Helper lado servidor Astro (`defineTSDK`) |

---

## Instalação

```bash
pnpm add @t-suite/t-sdk

# Adaptadores de framework
pnpm add @t-suite/t-sdk-react   # React / Next.js
pnpm add @t-suite/t-sdk-vue     # Vue / Nuxt
pnpm add @t-suite/t-sdk-astro   # Astro

# CLI
pnpm add -D @t-suite/t-sdk-cli
```

---

## Arquitectura

### Sub-SDKs

Um sub-SDK é uma pasta autónoma dentro de `t-sdk/src/` que agrupa um **plugin** (métodos + tipos) para uma convenção de backend específica.

```
t-sdk/src/
├── core/           ← createTSDK, TSDKError
├── lomkit/         ← sub-SDK Lomkit
│   ├── driver.ts
│   ├── methods/    ← search.ts, mutate.ts, destroy.ts, restore.ts, actions.ts
│   ├── resources/  ← interfaces de recursos por projecto (geradas pelo CLI)
│   ├── types/      ← ILomkitSearchPayload, ILomkitMutatePayload, …
│   └── index.ts    ← createLomkitSDK, lomkitPlugin
├── rest/           ← sub-SDK REST
│   ├── methods/    ← list.ts, get.ts, create.ts, update.ts, delete.ts
│   └── index.ts    ← createRestSDK, restPlugin
└── index.ts
```

### Ficheiros de métodos

Cada método é um ficheiro que exporta uma `IMethodDefinition` — uma única função `resolve` que mapeia `(resource, payload) → IRequest`.

```ts
// lomkit/methods/destroy.ts
export const destroy: IMethodDefinition = {
    resolve: (resource, payload) => {
        const { key } = payload as { key: number | string }
        return {
            url:    `/${resource}/mutate`,
            method: 'POST',
            body:   { mutate: [{ operation: 'destroy', key }] },
        }
    },
}
```

O nome frontend (`destroy`) e o payload do backend estão **desacoplados**. Dê ao método o nome que fizer mais sentido na sua base de código.

---

## Sub-SDKs integrados

### Lomkit

Para backends que utilizam [Laravel Lomkit](https://github.com/lomkit/laravel-rest-api).

```ts
import { createLomkitSDK } from '@t-suite/t-sdk/lomkit'

const TSDK = createLomkitSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product'] as const,
})
```

| Método | Endpoint | Descrição |
|---|---|---|
| `search(payload)` | `POST /{resource}/search` | Filtrar, ordenar, paginar |
| `mutate(payload)` | `POST /{resource}/mutate` | Criar, actualizar em lote |
| `destroy({ key })` | `POST /{resource}/mutate` | Eliminar por chave |
| `restore({ key })` | `POST /{resource}/restore` | Restaurar registo eliminado de forma lógica |
| `actions({ action, ...body })` | `POST /{resource}/actions/{action}` | Acções personalizadas do backend |

#### Exemplo de pesquisa

```ts
const result = await TSDK.user.search({
    filters: [
        { field: 'active',      value: true },
        { field: 'role',        operator: 'in', value: ['admin', 'editor'] },
    ],
    sorts:   [{ field: 'created_at', direction: 'desc' }],
    page:    1,
    limit:   20,
})
```

#### Exemplo de mutação

```ts
await TSDK.user.mutate({
    mutate: [
        { operation: 'create', attributes: { name: 'Alice', email: 'alice@example.com' } },
        { operation: 'update', key: 5, attributes: { name: 'Bob' } },
    ],
})
```

---

### REST

Para backends RESTful convencionais.

```ts
import { createRestSDK } from '@t-suite/t-sdk/rest'

const TSDK = createRestSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product'] as const,
})
```

| Método | Endpoint | Descrição |
|---|---|---|
| `list()` | `GET /{resource}` | Obter todos |
| `get({ id })` | `GET /{resource}/{id}` | Obter um |
| `create(body)` | `POST /{resource}` | Criar |
| `update({ id, ...body })` | `PUT /{resource}/{id}` | Substituir |
| `delete({ id })` | `DELETE /{resource}/{id}` | Eliminar |

---

## CLI

### Adicionar um sub-SDK

Gera uma nova pasta de sub-SDK e actualiza `t-sdk/src/index.ts`.

```bash
t-sdk add graphql
# → cria t-sdk/src/graphql/ (methods/, resources/, types/, index.ts)
# → actualiza t-sdk/src/index.ts
# → o lead dev implementa driver.ts
```

### Adicionar um recurso

Gera uma interface de recurso tipada. Se for fornecido um URL de backend, é tentada a introspeção.

```bash
# Modelo pré-preenchido (o dev completa os campos)
t-sdk add-resource user --sdk=lomkit

# Com introspeção (envia POST /user/search, mapeia a forma da resposta)
t-sdk add-resource user --sdk=lomkit --url=https://api.example.com
```

Ficheiro gerado:

```ts
// t-sdk/src/lomkit/resources/user.ts
export interface IUser {
    id:         number
    name:       string
    email:      string
    created_at: string
    updated_at: string
}
```

### Adicionar um método

Gera um novo ficheiro de método e actualiza o `methods/index.ts` do SDK.

```bash
t-sdk add-method softDelete --sdk=lomkit
# → cria methods/softDelete.ts com um modelo
# → actualiza methods/index.ts
# → o lead dev implementa a função resolve
```

---

## Tratamento de erros

Cada pedido falhado é exposto como uma `TSDKError`.

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.mutate(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        error.status   // Código de estado HTTP
        error.message  // Mensagem legível por humanos
        error.errors   // Record<string, string[]> — erros ao nível do campo
    }
}
```

---

## Adaptadores de framework

### React / Next.js

```tsx
// app/layout.tsx
import { TSDKProvider } from '@t-suite/t-sdk-react'
import { TSDK } from '@/lib/tsdk'

<TSDKProvider sdk={TSDK}>{children}</TSDKProvider>
```

```tsx
import { useTSDKContext, useQuery, useMutation } from '@t-suite/t-sdk-react'

const sdk = useTSDKContext()

const { data, isLoading } = useQuery(() => sdk.user.search({ page: 1 }))
const { mutate }          = useMutation((p) => sdk.user.mutate(p))
```

### Vue / Nuxt

```ts
// plugins/tsdk.ts
import { provideTSDK } from '@t-suite/t-sdk-vue'
import { TSDK } from '@/lib/tsdk'

export default defineNuxtPlugin(() => provideTSDK(TSDK))
```

```vue
<script setup lang="ts">
import { useTSDK, useQuery } from '@t-suite/t-sdk-vue'

const sdk = useTSDK()
const { data, isLoading } = useQuery(() => sdk.user.search({ page: 1 }))
</script>
```

### Astro

```ts
// lib/tsdk.ts
import { defineTSDK } from '@t-suite/t-sdk-astro'
import { lomkitPlugin } from '@t-suite/t-sdk/lomkit'
import { ofetch } from 'ofetch'

export const TSDK = defineTSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    plugin:    lomkitPlugin,
    resources: ['user', 'product'] as const,
})
```

```astro
---
import { TSDK } from '../lib/tsdk'
const users = await TSDK.user.search({ limit: 10 })
---
```

---

## Estender com um sub-SDK personalizado

```bash
t-sdk add mybackend
```

Em seguida, implemente `driver.ts` e adicione métodos:

```ts
// t-sdk/src/mybackend/methods/customMethod.ts
import type { IMethodDefinition } from '../../types/ITSDK'

export const customMethod: IMethodDefinition = {
    resolve: (resource, payload) => ({
        url:    `/${resource}/custom`,
        method: 'POST',
        body:   payload,
    }),
}
```

```bash
t-sdk add-method customMethod --sdk=mybackend
t-sdk add-resource user --sdk=mybackend
```

---

## Estrutura do repositório

```
t-suite/
├── packages/
│   ├── shared/           # Interfaces partilhadas (IRequest, ITSDKError)
│   ├── t-sdk/            # Core + sub-SDKs (lomkit, rest, …)
│   ├── t-sdk-cli/        # CLI (add, add-resource, add-method)
│   ├── t-sdk-react/      # Adaptador React
│   ├── t-sdk-vue/        # Adaptador Vue
│   └── t-sdk-astro/      # Adaptador Astro
├── apps/                 # Aplicações playground (React, Next.js, Astro, Nuxt)
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## Licença

MIT — © 2026 Gaetan Compigni
