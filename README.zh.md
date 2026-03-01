# T-SDK

T-Suite 生态系统的框架无关 API 传输层。

**其他语言：** [English](./README.md) · [Français](./README.fr.md) · [Español](./README.es.md) · [Italiano](./README.it.md) · [Deutsch](./README.de.md) · [Português](./README.pt.md)

---

## 概述

T-SDK 是一个基于插件、强类型的 HTTP 传输层。无需为每个资源配置 HTTP 方法和路由，只需安装一个**子 SDK**（针对你的后端规范的插件），并声明所需的资源名称即可。插件会提供所有方法。

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

### 核心理念

- **插件架构** — 子 SDK 拥有方法、driver 和类型
- **资源 = 一个名称** — 传入 `'user'`，即可获得 TypeScript 推断出的所有插件方法
- **方法 = 一个文件** — 每个方法是一个独立文件，负责解析自身的 HTTP 请求
- **由前端团队命名** — `softDelete`、`archive`、`publish` 对应后端所期望的任意操作
- **CLI 脚手架** — 无需修改任何已有文件，即可添加子 SDK、资源和方法

---

## 包列表

| 包 | 描述 |
|---|---|
| `@t-suite/t-sdk` | Core + 内置子 SDK（`/rest`、`/lomkit`） |
| `@t-suite/t-sdk-cli` | CLI — `t-sdk add`、`t-sdk add-resource`、`t-sdk add-method` |
| `@t-suite/t-sdk-react` | React 上下文 + `useQuery` / `useMutation` 钩子 |
| `@t-suite/t-sdk-vue` | Vue 组合式函数（`useTSDK`、`useQuery`、`useMutation`） |
| `@t-suite/t-sdk-astro` | Astro 服务端助手（`defineTSDK`） |

---

## 安装

```bash
pnpm add @t-suite/t-sdk

# 框架适配器
pnpm add @t-suite/t-sdk-react   # React / Next.js
pnpm add @t-suite/t-sdk-vue     # Vue / Nuxt
pnpm add @t-suite/t-sdk-astro   # Astro

# CLI
pnpm add -D @t-suite/t-sdk-cli
```

---

## 架构

### 子 SDK

子 SDK 是 `t-sdk/src/` 内的一个独立文件夹，为特定的后端规范打包了一个**插件**（方法 + 类型）。

```
t-sdk/src/
├── core/           ← createTSDK, TSDKError
├── lomkit/         ← Lomkit 子 SDK
│   ├── driver.ts
│   ├── methods/    ← search.ts, mutate.ts, destroy.ts, restore.ts, actions.ts
│   ├── resources/  ← 各项目的资源接口（由 CLI 生成）
│   ├── types/      ← ILomkitSearchPayload, ILomkitMutatePayload, …
│   └── index.ts    ← createLomkitSDK, lomkitPlugin
├── rest/           ← REST 子 SDK
│   ├── methods/    ← list.ts, get.ts, create.ts, update.ts, delete.ts
│   └── index.ts    ← createRestSDK, restPlugin
└── index.ts
```

### 方法文件

每个方法是一个导出 `IMethodDefinition` 的文件 — 一个单一的 `resolve` 函数，将 `(resource, payload) → IRequest` 进行映射。

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

前端名称（`destroy`）与后端 payload **解耦**。请根据代码库的实际需要为方法命名。

---

## 内置子 SDK

### Lomkit

适用于使用 [Laravel Lomkit](https://github.com/lomkit/laravel-rest-api) 的后端。

```ts
import { createLomkitSDK } from '@t-suite/t-sdk/lomkit'

const TSDK = createLomkitSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product'] as const,
})
```

| 方法 | Endpoint | 描述 |
|---|---|---|
| `search(payload)` | `POST /{resource}/search` | 过滤、排序、分页 |
| `mutate(payload)` | `POST /{resource}/mutate` | 批量创建、更新 |
| `destroy({ key })` | `POST /{resource}/mutate` | 按键删除 |
| `restore({ key })` | `POST /{resource}/restore` | 恢复软删除记录 |
| `actions({ action, ...body })` | `POST /{resource}/actions/{action}` | 自定义后端操作 |

#### 搜索示例

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

#### 变更示例

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

适用于传统 RESTful 后端。

```ts
import { createRestSDK } from '@t-suite/t-sdk/rest'

const TSDK = createRestSDK({
    transport: ofetch,
    baseURL:   'https://api.example.com',
    resources: ['user', 'product'] as const,
})
```

| 方法 | Endpoint | 描述 |
|---|---|---|
| `list()` | `GET /{resource}` | 获取全部 |
| `get({ id })` | `GET /{resource}/{id}` | 获取单个 |
| `create(body)` | `POST /{resource}` | 创建 |
| `update({ id, ...body })` | `PUT /{resource}/{id}` | 替换 |
| `delete({ id })` | `DELETE /{resource}/{id}` | 删除 |

---

## CLI

### 添加子 SDK

生成新的子 SDK 文件夹并更新 `t-sdk/src/index.ts`。

```bash
t-sdk add graphql
# → 创建 t-sdk/src/graphql/（methods/、resources/、types/、index.ts）
# → 更新 t-sdk/src/index.ts
# → 主开发者实现 driver.ts
```

### 添加资源

生成带类型的资源接口。若提供了后端 URL，则尝试内省。

```bash
# 预填模板（开发者完善字段）
t-sdk add-resource user --sdk=lomkit

# 带内省（发送 POST /user/search，映射响应结构）
t-sdk add-resource user --sdk=lomkit --url=https://api.example.com
```

生成的文件：

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

### 添加方法

生成新的方法文件并更新 SDK 的 `methods/index.ts`。

```bash
t-sdk add-method softDelete --sdk=lomkit
# → 使用模板创建 methods/softDelete.ts
# → 更新 methods/index.ts
# → 主开发者实现 resolve 函数
```

---

## 错误处理

每个失败的请求都以 `TSDKError` 的形式返回。

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.mutate(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        error.status   // HTTP 状态码
        error.message  // 人类可读的消息
        error.errors   // Record<string, string[]> — 字段级别错误
    }
}
```

---

## 框架适配器

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

## 使用自定义子 SDK 进行扩展

```bash
t-sdk add mybackend
```

然后实现 `driver.ts` 并添加方法：

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

## 仓库结构

```
t-suite/
├── packages/
│   ├── shared/           # 共享接口（IRequest、ITSDKError）
│   ├── t-sdk/            # Core + 子 SDK（lomkit、rest、…）
│   ├── t-sdk-cli/        # CLI（add、add-resource、add-method）
│   ├── t-sdk-react/      # React 适配器
│   ├── t-sdk-vue/        # Vue 适配器
│   └── t-sdk-astro/      # Astro 适配器
├── apps/                 # Playground 应用（React、Next.js、Astro、Nuxt）
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## 许可证

MIT — © 2026 Gaetan Compigni
