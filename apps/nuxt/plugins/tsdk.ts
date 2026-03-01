import { provideTSDK } from '@t-suite/t-sdk-vue'
import { createRestSDK } from '@t-suite/t-sdk/rest'
import type { ITransport } from '@t-suite/t-sdk'
import { ofetch } from 'ofetch'

export default defineNuxtPlugin(() => {
    const sdk = createRestSDK({
        transport: ofetch as unknown as ITransport,
        baseURL: 'https://jsonplaceholder.typicode.com',
        resources: ['posts', 'users'] as const,
    })

    provideTSDK(sdk)
})
