# T-SDK

Couche de transport API agnostique au framework pour l'écosystème T-Suite.

**Disponible en :** [English](./README.md) · [Español](./README.es.md) · [Italiano](./README.it.md) · [Deutsch](./README.de.md) · [Português](./README.pt.md) · [中文](./README.zh.md)

---

## Vue d'ensemble

T-SDK est une couche de transport HTTP fortement typée et basée sur des plugins. Au lieu de configurer les méthodes HTTP et les routes par ressource, vous installez un **sous-SDK** (un plugin pour votre convention de backend) et déclarez uniquement les noms de ressources dont vous avez besoin. Le plugin fournit toutes les méthodes.

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

### Principes clés

- **Architecture plugin** — le sous-SDK possède les méthodes, le driver et les types
- **Ressource = un nom** — vous passez `'user'` et obtenez toutes les méthodes du plugin inférées par TypeScript
- **Méthode = un fichier** — chaque méthode est un fichier autonome qui résout sa propre requête HTTP
- **Nommé par l'équipe frontend** — `softDelete`, `archive`, `publish` correspondent à ce qu'attend le backend
- **Scaffolding CLI** — ajoutez des sous-SDKs, des ressources et des méthodes sans modifier aucun fichier existant

---

## Packages

| Package | Description |
|---|---|
| `@t-suite/t-sdk` | Core + sous-SDKs intégrés (`/rest`, `/lomkit`) |
| `@t-suite/t-sdk-cli` | CLI — `t-sdk add`, `t-sdk add-resource`, `t-sdk add-method` |
| `@t-suite/t-sdk-react` | Contexte React + hooks `useQuery` / `useMutation` |
| `@t-suite/t-sdk-vue` | Composables Vue (`useTSDK`, `useQuery`, `useMutation`) |
| `@t-suite/t-sdk-astro` | Helper serveur Astro (`defineTSDK`) |

---

## Installation

```bash
pnpm add @t-suite/t-sdk

# Adaptateurs de framework
pnpm add @t-suite/t-sdk-react   # React / Next.js
pnpm add @t-suite/t-sdk-vue     # Vue / Nuxt
pnpm add @t-suite/t-sdk-astro   # Astro

# CLI
pnpm add -D @t-suite/t-sdk-cli
```

---

## Architecture

### Sous-SDKs

Un sous-SDK est un dossier autonome à l'intérieur de `t-sdk/src/` qui regroupe un **plugin** (méthodes + types) pour une convention de backend spécifique.

```
t-sdk/src/
├── core/           ← createTSDK, TSDKError
├── lomkit/         ← sous-SDK Lomkit
│   ├── driver.ts
│   ├── methods/    ← search.ts, mutate.ts, destroy.ts, restore.ts, actions.ts
│   ├── resources/  ← interfaces de ressources par projet (générées par le CLI)
│   ├── types/      ← ILomkitSearchPayload, ILomkitMutatePayload, …
│   └── index.ts    ← createLomkitSDK, lomkitPlugin
├── rest/           ← sous-SDK REST
│   ├── methods/    ← list.ts, get.ts, create.ts, update.ts, delete.ts
│   └── index.ts    ← createRestSDK, restPlugin
└── index.ts
```

### Fichiers de méthodes

Chaque méthode est un fichier qui exporte une `IMethodDefinition` — une unique fonction `resolve` qui mappe `(resource, payload) → IRequest`.

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

Le nom frontend (`destroy`) et le payload backend sont **découplés**. Nommez la méthode comme il convient dans votre base de code.

---

## Sous-SDKs intégrés

### Lomkit

Pour les backends utilisant [Laravel Lomkit](https://github.com/lomkit/laravel-rest-api).

```ts
import { createLomkitSDK } from '@t-suite/t-sdk/lomkit'

const TSDK = createLomkitSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product'] as const,
})
```

| Méthode | Endpoint | Description |
|---|---|---|
| `search(payload)` | `POST /{resource}/search` | Filtrer, trier, paginer |
| `mutate(payload)` | `POST /{resource}/mutate` | Créer, mettre à jour en lot |
| `destroy({ key })` | `POST /{resource}/mutate` | Supprimer par clé |
| `restore({ key })` | `POST /{resource}/restore` | Restaurer un enregistrement supprimé en douceur |
| `actions({ action, ...body })` | `POST /{resource}/actions/{action}` | Actions backend personnalisées |

#### Exemple de recherche

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

#### Exemple de mutation

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

Pour les backends RESTful conventionnels.

```ts
import { createRestSDK } from '@t-suite/t-sdk/rest'

const TSDK = createRestSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product'] as const,
})
```

| Méthode | Endpoint | Description |
|---|---|---|
| `list()` | `GET /{resource}` | Obtenir tout |
| `get({ id })` | `GET /{resource}/{id}` | Obtenir un élément |
| `create(body)` | `POST /{resource}` | Créer |
| `update({ id, ...body })` | `PUT /{resource}/{id}` | Remplacer |
| `delete({ id })` | `DELETE /{resource}/{id}` | Supprimer |

---

## CLI

### Ajouter un sous-SDK

Génère un nouveau dossier de sous-SDK et met à jour `t-sdk/src/index.ts`.

```bash
t-sdk add graphql
# → crée t-sdk/src/graphql/ (methods/, resources/, types/, index.ts)
# → met à jour t-sdk/src/index.ts
# → le lead dev implémente driver.ts
```

### Ajouter une ressource

Génère une interface de ressource typée. Si une URL backend est fournie, une introspection est tentée.

```bash
# Modèle pré-rempli (le dev complète les champs)
t-sdk add-resource user --sdk=lomkit

# Avec introspection (envoie POST /user/search, mappe la forme de la réponse)
t-sdk add-resource user --sdk=lomkit --url=https://api.example.com
```

Fichier généré :

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

### Ajouter une méthode

Génère un nouveau fichier de méthode et met à jour le `methods/index.ts` du SDK.

```bash
t-sdk add-method softDelete --sdk=lomkit
# → crée methods/softDelete.ts avec un modèle
# → met à jour methods/index.ts
# → le lead dev implémente la fonction resolve
```

---

## Gestion des erreurs

Toute requête échouée remonte comme une `TSDKError`.

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.mutate(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        error.status   // Code de statut HTTP
        error.message  // Message lisible par un humain
        error.errors   // Record<string, string[]> — erreurs au niveau des champs
    }
}
```

---

## Adaptateurs de framework

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

## Étendre avec un sous-SDK personnalisé

```bash
t-sdk add mybackend
```

Ensuite, implémentez `driver.ts` et ajoutez des méthodes :

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

## Structure du dépôt

```
t-suite/
├── packages/
│   ├── shared/           # Interfaces partagées (IRequest, ITSDKError)
│   ├── t-sdk/            # Core + sous-SDKs (lomkit, rest, …)
│   ├── t-sdk-cli/        # CLI (add, add-resource, add-method)
│   ├── t-sdk-react/      # Adaptateur React
│   ├── t-sdk-vue/        # Adaptateur Vue
│   └── t-sdk-astro/      # Adaptateur Astro
├── apps/                 # Applications playground (React, Next.js, Astro, Nuxt)
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## Licence

MIT — © 2026 Gaetan Compigni
