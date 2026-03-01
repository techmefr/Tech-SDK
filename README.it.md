# T-SDK

Livello di trasporto API indipendente dal framework per l'ecosistema T-Suite.

**Disponibile in:** [English](./README.md) · [Français](./README.fr.md) · [Español](./README.es.md) · [Deutsch](./README.de.md) · [Português](./README.pt.md) · [中文](./README.zh.md)

---

## Panoramica

T-SDK è un livello di trasporto HTTP fortemente tipizzato e basato su plugin. Invece di configurare metodi HTTP e route per ogni risorsa, si installa un **sub-SDK** (un plugin per la propria convenzione di backend) e si dichiarano solo i nomi delle risorse necessarie. Il plugin fornisce tutti i metodi.

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

### Principi chiave

- **Architettura plugin** — il sub-SDK possiede i metodi, il driver e i tipi
- **Risorsa = un nome** — si passa `'user'` e si ottengono tutti i metodi del plugin inferiti da TypeScript
- **Metodo = un file** — ogni metodo è un file autonomo che risolve la propria richiesta HTTP
- **Denominato dal team frontend** — `softDelete`, `archive`, `publish` si mappano a ciò che il backend si aspetta
- **Scaffolding CLI** — aggiunge sub-SDK, risorse e metodi senza toccare alcun file esistente

---

## Pacchetti

| Pacchetto | Descrizione |
|---|---|
| `@t-suite/t-sdk` | Core + sub-SDK integrati (`/rest`, `/lomkit`) |
| `@t-suite/t-sdk-cli` | CLI — `t-sdk add`, `t-sdk add-resource`, `t-sdk add-method` |
| `@t-suite/t-sdk-react` | Contesto React + hook `useQuery` / `useMutation` |
| `@t-suite/t-sdk-vue` | Composables Vue (`useTSDK`, `useQuery`, `useMutation`) |
| `@t-suite/t-sdk-astro` | Helper lato server Astro (`defineTSDK`) |

---

## Installazione

```bash
pnpm add @t-suite/t-sdk

# Adattatori framework
pnpm add @t-suite/t-sdk-react   # React / Next.js
pnpm add @t-suite/t-sdk-vue     # Vue / Nuxt
pnpm add @t-suite/t-sdk-astro   # Astro

# CLI
pnpm add -D @t-suite/t-sdk-cli
```

---

## Architettura

### Sub-SDK

Un sub-SDK è una cartella autonoma all'interno di `t-sdk/src/` che raggruppa un **plugin** (metodi + tipi) per una specifica convenzione di backend.

```
t-sdk/src/
├── core/           ← createTSDK, TSDKError
├── lomkit/         ← sub-SDK Lomkit
│   ├── driver.ts
│   ├── methods/    ← search.ts, mutate.ts, destroy.ts, restore.ts, actions.ts
│   ├── resources/  ← interfacce di risorse per progetto (generate dal CLI)
│   ├── types/      ← ILomkitSearchPayload, ILomkitMutatePayload, …
│   └── index.ts    ← createLomkitSDK, lomkitPlugin
├── rest/           ← sub-SDK REST
│   ├── methods/    ← list.ts, get.ts, create.ts, update.ts, delete.ts
│   └── index.ts    ← createRestSDK, restPlugin
└── index.ts
```

### File dei metodi

Ogni metodo è un file che esporta una `IMethodDefinition` — un'unica funzione `resolve` che mappa `(resource, payload) → IRequest`.

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

Il nome frontend (`destroy`) e il payload del backend sono **disaccoppiati**. Assegna al metodo il nome più appropriato per la tua base di codice.

---

## Sub-SDK integrati

### Lomkit

Per i backend che usano [Laravel Lomkit](https://github.com/lomkit/laravel-rest-api).

```ts
import { createLomkitSDK } from '@t-suite/t-sdk/lomkit'

const TSDK = createLomkitSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product'] as const,
})
```

| Metodo | Endpoint | Descrizione |
|---|---|---|
| `search(payload)` | `POST /{resource}/search` | Filtrare, ordinare, paginare |
| `mutate(payload)` | `POST /{resource}/mutate` | Creare, aggiornare in batch |
| `destroy({ key })` | `POST /{resource}/mutate` | Eliminare per chiave |
| `restore({ key })` | `POST /{resource}/restore` | Ripristinare un record eliminato in modo logico |
| `actions({ action, ...body })` | `POST /{resource}/actions/{action}` | Azioni backend personalizzate |

#### Esempio di ricerca

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

#### Esempio di mutazione

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

Per i backend RESTful convenzionali.

```ts
import { createRestSDK } from '@t-suite/t-sdk/rest'

const TSDK = createRestSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product'] as const,
})
```

| Metodo | Endpoint | Descrizione |
|---|---|---|
| `list()` | `GET /{resource}` | Ottenere tutti |
| `get({ id })` | `GET /{resource}/{id}` | Ottenere uno |
| `create(body)` | `POST /{resource}` | Creare |
| `update({ id, ...body })` | `PUT /{resource}/{id}` | Sostituire |
| `delete({ id })` | `DELETE /{resource}/{id}` | Eliminare |

---

## CLI

### Aggiungere un sub-SDK

Genera una nuova cartella sub-SDK e aggiorna `t-sdk/src/index.ts`.

```bash
t-sdk add graphql
# → crea t-sdk/src/graphql/ (methods/, resources/, types/, index.ts)
# → aggiorna t-sdk/src/index.ts
# → il lead dev implementa driver.ts
```

### Aggiungere una risorsa

Genera un'interfaccia di risorsa tipizzata. Se viene fornito un URL del backend, tenta l'introspezione.

```bash
# Template pre-compilato (il dev completa i campi)
t-sdk add-resource user --sdk=lomkit

# Con introspezione (invia POST /user/search, mappa la forma della risposta)
t-sdk add-resource user --sdk=lomkit --url=https://api.example.com
```

File generato:

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

### Aggiungere un metodo

Genera un nuovo file di metodo e aggiorna il `methods/index.ts` dell'SDK.

```bash
t-sdk add-method softDelete --sdk=lomkit
# → crea methods/softDelete.ts con un template
# → aggiorna methods/index.ts
# → il lead dev implementa la funzione resolve
```

---

## Gestione degli errori

Ogni richiesta fallita emerge come una `TSDKError`.

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.mutate(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        error.status   // Codice di stato HTTP
        error.message  // Messaggio leggibile da un essere umano
        error.errors   // Record<string, string[]> — errori a livello di campo
    }
}
```

---

## Adattatori framework

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

## Estendere con un sub-SDK personalizzato

```bash
t-sdk add mybackend
```

Poi implementa `driver.ts` e aggiungi metodi:

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

## Struttura del repository

```
t-suite/
├── packages/
│   ├── shared/           # Interfacce condivise (IRequest, ITSDKError)
│   ├── t-sdk/            # Core + sub-SDK (lomkit, rest, …)
│   ├── t-sdk-cli/        # CLI (add, add-resource, add-method)
│   ├── t-sdk-react/      # Adattatore React
│   ├── t-sdk-vue/        # Adattatore Vue
│   └── t-sdk-astro/      # Adattatore Astro
├── apps/                 # App playground (React, Next.js, Astro, Nuxt)
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## Licenza

MIT — © 2026 Gaetan Compigni
