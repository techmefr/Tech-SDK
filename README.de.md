# T-SDK

Framework-agnostische API-Transportschicht für das T-Suite-Ökosystem.

**Verfügbar in:** [English](./README.md) · [Français](./README.fr.md) · [Español](./README.es.md) · [Italiano](./README.it.md) · [Português](./README.pt.md) · [中文](./README.zh.md)

---

## Überblick

T-SDK ist eine stark typisierte, plugin-basierte HTTP-Transportschicht. Anstatt HTTP-Methoden und Routen pro Ressource zu konfigurieren, installierst du ein **Sub-SDK** (ein Plugin für deine Backend-Konvention) und deklarierst nur die Ressourcennamen, die du benötigst. Das Plugin stellt alle Methoden bereit.

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

### Kernprinzipien

- **Plugin-Architektur** — das Sub-SDK besitzt die Methoden, den Driver und die Typen
- **Ressource = ein Name** — du übergibst `'user'` und erhältst alle Plugin-Methoden, die von TypeScript inferiert werden
- **Methode = eine Datei** — jede Methode ist eine eigenständige Datei, die ihre eigene HTTP-Anfrage auflöst
- **Benannt vom Frontend-Team** — `softDelete`, `archive`, `publish` werden auf das gemappt, was das Backend erwartet
- **CLI-Scaffolding** — füge Sub-SDKs, Ressourcen und Methoden hinzu, ohne bestehende Dateien anfassen zu müssen

---

## Pakete

| Paket | Beschreibung |
|---|---|
| `@t-suite/t-sdk` | Core + integrierte Sub-SDKs (`/rest`, `/lomkit`) |
| `@t-suite/t-sdk-cli` | CLI — `t-sdk add`, `t-sdk add-resource`, `t-sdk add-method` |
| `@t-suite/t-sdk-react` | React-Kontext + `useQuery` / `useMutation` Hooks |
| `@t-suite/t-sdk-vue` | Vue Composables (`useTSDK`, `useQuery`, `useMutation`) |
| `@t-suite/t-sdk-astro` | Astro Server-Helper (`defineTSDK`) |

---

## Installation

```bash
pnpm add @t-suite/t-sdk

# Framework-Adapter
pnpm add @t-suite/t-sdk-react   # React / Next.js
pnpm add @t-suite/t-sdk-vue     # Vue / Nuxt
pnpm add @t-suite/t-sdk-astro   # Astro

# CLI
pnpm add -D @t-suite/t-sdk-cli
```

---

## Architektur

### Sub-SDKs

Ein Sub-SDK ist ein eigenständiger Ordner innerhalb von `t-sdk/src/`, der ein **Plugin** (Methoden + Typen) für eine spezifische Backend-Konvention bündelt.

```
t-sdk/src/
├── core/           ← createTSDK, TSDKError
├── lomkit/         ← Lomkit Sub-SDK
│   ├── driver.ts
│   ├── methods/    ← search.ts, mutate.ts, destroy.ts, restore.ts, actions.ts
│   ├── resources/  ← projektspezifische Ressource-Interfaces (vom CLI generiert)
│   ├── types/      ← ILomkitSearchPayload, ILomkitMutatePayload, …
│   └── index.ts    ← createLomkitSDK, lomkitPlugin
├── rest/           ← REST Sub-SDK
│   ├── methods/    ← list.ts, get.ts, create.ts, update.ts, delete.ts
│   └── index.ts    ← createRestSDK, restPlugin
└── index.ts
```

### Methoden-Dateien

Jede Methode ist eine Datei, die eine `IMethodDefinition` exportiert — eine einzige `resolve`-Funktion, die `(resource, payload) → IRequest` abbildet.

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

Der Frontend-Name (`destroy`) und der Backend-Payload sind **entkoppelt**. Benenne die Methode so, wie es in deiner Codebasis sinnvoll ist.

---

## Integrierte Sub-SDKs

### Lomkit

Für Backends, die [Laravel Lomkit](https://github.com/lomkit/laravel-rest-api) verwenden.

```ts
import { createLomkitSDK } from '@t-suite/t-sdk/lomkit'

const TSDK = createLomkitSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product'] as const,
})
```

| Methode | Endpoint | Beschreibung |
|---|---|---|
| `search(payload)` | `POST /{resource}/search` | Filtern, sortieren, paginieren |
| `mutate(payload)` | `POST /{resource}/mutate` | Erstellen, stapelweise aktualisieren |
| `destroy({ key })` | `POST /{resource}/mutate` | Nach Schlüssel löschen |
| `restore({ key })` | `POST /{resource}/restore` | Weich gelöschten Datensatz wiederherstellen |
| `actions({ action, ...body })` | `POST /{resource}/actions/{action}` | Benutzerdefinierte Backend-Aktionen |

#### Suchbeispiel

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

#### Mutationsbeispiel

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

Für konventionelle RESTful-Backends.

```ts
import { createRestSDK } from '@t-suite/t-sdk/rest'

const TSDK = createRestSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product'] as const,
})
```

| Methode | Endpoint | Beschreibung |
|---|---|---|
| `list()` | `GET /{resource}` | Alle abrufen |
| `get({ id })` | `GET /{resource}/{id}` | Einen abrufen |
| `create(body)` | `POST /{resource}` | Erstellen |
| `update({ id, ...body })` | `PUT /{resource}/{id}` | Ersetzen |
| `delete({ id })` | `DELETE /{resource}/{id}` | Löschen |

---

## CLI

### Ein Sub-SDK hinzufügen

Erstellt einen neuen Sub-SDK-Ordner und aktualisiert `t-sdk/src/index.ts`.

```bash
t-sdk add graphql
# → erstellt t-sdk/src/graphql/ (methods/, resources/, types/, index.ts)
# → aktualisiert t-sdk/src/index.ts
# → der Lead-Entwickler implementiert driver.ts
```

### Eine Ressource hinzufügen

Generiert ein typisiertes Ressource-Interface. Wenn eine Backend-URL angegeben wird, wird Introspektion versucht.

```bash
# Vorgefüllte Vorlage (Entwickler vervollständigt die Felder)
t-sdk add-resource user --sdk=lomkit

# Mit Introspektion (sendet POST /user/search, mappt die Antwortstruktur)
t-sdk add-resource user --sdk=lomkit --url=https://api.example.com
```

Generierte Datei:

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

### Eine Methode hinzufügen

Erstellt eine neue Methoden-Datei und aktualisiert das `methods/index.ts` des SDK.

```bash
t-sdk add-method softDelete --sdk=lomkit
# → erstellt methods/softDelete.ts mit einer Vorlage
# → aktualisiert methods/index.ts
# → der Lead-Entwickler implementiert die resolve-Funktion
```

---

## Fehlerbehandlung

Jede fehlgeschlagene Anfrage wird als `TSDKError` zurückgegeben.

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.mutate(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        error.status   // HTTP-Statuscode
        error.message  // Menschenlesbare Meldung
        error.errors   // Record<string, string[]> — Fehler auf Feldebene
    }
}
```

---

## Framework-Adapter

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

## Mit einem benutzerdefinierten Sub-SDK erweitern

```bash
t-sdk add mybackend
```

Dann `driver.ts` implementieren und Methoden hinzufügen:

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

## Repository-Struktur

```
t-suite/
├── packages/
│   ├── shared/           # Gemeinsame Interfaces (IRequest, ITSDKError)
│   ├── t-sdk/            # Core + Sub-SDKs (lomkit, rest, …)
│   ├── t-sdk-cli/        # CLI (add, add-resource, add-method)
│   ├── t-sdk-react/      # React-Adapter
│   ├── t-sdk-vue/        # Vue-Adapter
│   └── t-sdk-astro/      # Astro-Adapter
├── apps/                 # Playground-Apps (React, Next.js, Astro, Nuxt)
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## Lizenz

MIT — © 2026 Gaetan Compigni
