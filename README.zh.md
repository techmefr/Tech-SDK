# T-SDK

T-Suite 生态系统的框架无关 API 传输层。

**其他语言：** [English](./README.md) · [Français](./README.fr.md) · [Español](./README.es.md) · [Italiano](./README.it.md) · [Deutsch](./README.de.md) · [Português](./README.pt.md)

---

## 概述

T-SDK 是一个基于驱动程序的强类型 HTTP 传输层。它将后端通信协议抽象在以资源为核心的流式 API 之后，使前端无需关心后端是 REST、Lomkit 还是 GraphQL。

```ts
const res = await TSDK.user.create(payload)
```

### 核心理念

- **后端无关** — 更换驱动，无需修改调用代码
- **框架无关** — 纯 TypeScript 核心，配备 React、Vue 和 Astro 适配器
- **强类型** — 资源和方法在编译时推断
- **错误标准化** — 所有 HTTP 错误均以 `TSDKError` 形式返回

---

## 包列表

| 包 | 描述 |
|---|---|
| `@t-suite/t-sdk` | 核心传输层（驱动、错误标准化） |
| `@t-suite/t-sdk-react` | React 上下文 + `useQuery` / `useMutation` 钩子 |
| `@t-suite/t-sdk-vue` | Vue 组合式函数（`useTSDK`、`useQuery`、`useMutation`） |
| `@t-suite/t-sdk-astro` | Astro 服务端助手（`defineTSDK`） |

---

## 安装

```bash
pnpm add @t-suite/t-sdk
pnpm add @t-suite/t-sdk-react  # React / Next.js
pnpm add @t-suite/t-sdk-vue    # Vue / Nuxt
pnpm add @t-suite/t-sdk-astro  # Astro
```

---

## 核心 SDK

### 1. 定义资源

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

### 2. 选择驱动

#### REST 驱动

```ts
import { restDriver } from '@t-suite/t-sdk'
```

#### Lomkit 驱动

```ts
import { lomkitDriver } from '@t-suite/t-sdk'
```

#### 自定义驱动

```ts
import type { IDriver, IRequest } from '@t-suite/shared'

const myDriver: IDriver = {
    resolve(resource, method, payload): IRequest {
        return { url: `/${resource}/${method}`, method: 'POST', body: payload }
    },
}
```

### 3. 创建实例

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

### 4. 发起请求

```ts
const users   = await TSDK.user.list()
const newUser = await TSDK.user.create({ name: 'Alice', email: 'alice@example.com' })
```

---

## 错误处理

```ts
import { TSDKError } from '@t-suite/t-sdk'

try {
    await TSDK.user.create(payload)
} catch (error) {
    if (error instanceof TSDKError) {
        console.log(error.status)   // HTTP 状态码
        console.log(error.message)  // 可读错误信息
        console.log(error.errors)   // 字段级别错误
    }
}
```

---

## 框架适配器

### React / Next.js

```tsx
// 根布局中添加 Provider
import { TSDKProvider } from '@t-suite/t-sdk-react'
import { TSDK } from '@/lib/tsdk'

<TSDKProvider sdk={TSDK}>{children}</TSDKProvider>
```

```tsx
// 数据查询
import { useTSDKContext, useQuery } from '@t-suite/t-sdk-react'

const sdk = useTSDKContext()
const { data, isLoading, error } = useQuery(() => sdk.user.list())
```

```tsx
// 数据写入
import { useTSDKContext, useMutation } from '@t-suite/t-sdk-react'

const sdk = useTSDKContext()
const { mutate } = useMutation((p: UserPayload) => sdk.user.create(p))
```

---

### Vue / Nuxt

```ts
// plugins/tsdk.ts（Nuxt 插件）
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

## 许可证

MIT — © 2026 Gaetan Compigni
