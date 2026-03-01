# T-SDK

Capa de transporte de API independiente del framework para el ecosistema T-Suite.

**Disponible en:** [English](./README.md) · [Français](./README.fr.md) · [Italiano](./README.it.md) · [Deutsch](./README.de.md) · [Português](./README.pt.md) · [中文](./README.zh.md)

---

## Descripción general

T-SDK es una capa de transporte HTTP fuertemente tipada y basada en plugins. En lugar de configurar métodos HTTP y rutas por recurso, instalas un **sub-SDK** (un plugin para tu convención de backend) y declaras únicamente los nombres de recursos que necesitas. El plugin proporciona todos los métodos.

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

### Principios clave

- **Arquitectura plugin** — el sub-SDK posee los métodos, el driver y los tipos
- **Recurso = un nombre** — pasas `'user'` y obtienes todos los métodos del plugin inferidos por TypeScript
- **Método = un archivo** — cada método es un archivo independiente que resuelve su propia petición HTTP
- **Nombrado por el equipo frontend** — `softDelete`, `archive`, `publish` se mapean a lo que espera el backend
- **Scaffolding CLI** — añade sub-SDKs, recursos y métodos sin tocar ningún archivo existente

---

## Paquetes

| Paquete | Descripción |
|---|---|
| `@t-suite/t-sdk` | Core + sub-SDKs integrados (`/rest`, `/lomkit`) |
| `@t-suite/t-sdk-cli` | CLI — `t-sdk add`, `t-sdk add-resource`, `t-sdk add-method` |
| `@t-suite/t-sdk-react` | Contexto React + hooks `useQuery` / `useMutation` |
| `@t-suite/t-sdk-vue` | Composables Vue (`useTSDK`, `useQuery`, `useMutation`) |
| `@t-suite/t-sdk-astro` | Helper servidor Astro (`defineTSDK`) |

---

## Instalación

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

Un sub-SDK es una carpeta independiente dentro de `t-sdk/src/` que agrupa un **plugin** (métodos + tipos) para una convención de backend específica.

```
t-sdk/src/
├── core/           ← createTSDK, TSDKError
├── lomkit/         ← sub-SDK Lomkit
│   ├── driver.ts
│   ├── methods/    ← search.ts, mutate.ts, destroy.ts, restore.ts, actions.ts
│   ├── resources/  ← interfaces de recursos por proyecto (generadas por el CLI)
│   ├── types/      ← ILomkitSearchPayload, ILomkitMutatePayload, …
│   └── index.ts    ← createLomkitSDK, lomkitPlugin
├── rest/           ← sub-SDK REST
│   ├── methods/    ← list.ts, get.ts, create.ts, update.ts, delete.ts
│   └── index.ts    ← createRestSDK, restPlugin
└── index.ts
```

### Archivos de métodos

Cada método es un archivo que exporta una `IMethodDefinition` — una única función `resolve` que mapea `(resource, payload) → IRequest`.

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

El nombre frontend (`destroy`) y el payload del backend están **desacoplados**. Nombra el método como tenga sentido en tu base de código.

---

## Sub-SDKs integrados

### Lomkit

Para backends que usan [Laravel Lomkit](https://github.com/lomkit/laravel-rest-api).

```ts
import { createLomkitSDK } from '@t-suite/t-sdk/lomkit'

const TSDK = createLomkitSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product'] as const,
})
```

| Método | Endpoint | Descripción |
|---|---|---|
| `search(payload)` | `POST /{resource}/search` | Filtrar, ordenar, paginar |
| `mutate(payload)` | `POST /{resource}/mutate` | Crear, actualizar en lote |
| `destroy({ key })` | `POST /{resource}/mutate` | Eliminar por clave |
| `restore({ key })` | `POST /{resource}/restore` | Restaurar registro eliminado de forma lógica |
| `actions({ action, ...body })` | `POST /{resource}/actions/{action}` | Acciones personalizadas del backend |

#### Ejemplo de búsqueda

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

#### Ejemplo de mutación

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

Para backends RESTful convencionales.

```ts
import { createRestSDK } from '@t-suite/t-sdk/rest'

const TSDK = createRestSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product'] as const,
})
```

| Método | Endpoint | Descripción |
|---|---|---|
| `list()` | `GET /{resource}` | Obtener todos |
| `get({ id })` | `GET /{resource}/{id}` | Obtener uno |
| `create(body)` | `POST /{resource}` | Crear |
| `update({ id, ...body })` | `PUT /{resource}/{id}` | Reemplazar |
| `delete({ id })` | `DELETE /{resource}/{id}` | Eliminar |

---

## CLI

### Añadir un sub-SDK

Genera una nueva carpeta de sub-SDK y actualiza `t-sdk/src/index.ts`.

```bash
t-sdk add graphql
# → crea t-sdk/src/graphql/ (methods/, resources/, types/, index.ts)
# → actualiza t-sdk/src/index.ts
# → el desarrollador principal implementa driver.ts
```

### Añadir un recurso

Genera una interfaz de recurso tipada. Si se proporciona una URL del backend, intenta la introspección.

```bash
# Plantilla pre-rellenada (el dev completa los campos)
t-sdk add-resource user --sdk=lomkit

# Con introspección (envía POST /user/search, mapea la forma de la respuesta)
t-sdk add-resource user --sdk=lomkit --url=https://api.example.com
```

Archivo generado:

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

### Añadir un método

Genera un nuevo archivo de método y actualiza el `methods/index.ts` del SDK.

```bash
t-sdk add-method softDelete --sdk=lomkit
# → crea methods/softDelete.ts con una plantilla
# → actualiza methods/index.ts
# → el desarrollador principal implementa la función resolve
```

---

## Manejo de errores

Toda petición fallida se expone como una `TSDKError`.

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.mutate(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        error.status   // Código de estado HTTP
        error.message  // Mensaje legible por humanos
        error.errors   // Record<string, string[]> — errores a nivel de campo
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

## Extender con un sub-SDK personalizado

```bash
t-sdk add mybackend
```

Luego implementa `driver.ts` y añade métodos:

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

## Estructura del repositorio

```
t-suite/
├── packages/
│   ├── shared/           # Interfaces compartidas (IRequest, ITSDKError)
│   ├── t-sdk/            # Core + sub-SDKs (lomkit, rest, …)
│   ├── t-sdk-cli/        # CLI (add, add-resource, add-method)
│   ├── t-sdk-react/      # Adaptador React
│   ├── t-sdk-vue/        # Adaptador Vue
│   └── t-sdk-astro/      # Adaptador Astro
├── apps/                 # Aplicaciones playground (React, Next.js, Astro, Nuxt)
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## Licencia

MIT — © 2026 Gaetan Compigni
