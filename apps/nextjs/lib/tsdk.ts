import { createRestSDK } from '@t-suite/t-sdk/rest'
import type { ITransport } from '@t-suite/t-sdk'
import { ofetch } from 'ofetch'

export const tsdk = {
    rest: createRestSDK({
        transport: ofetch as unknown as ITransport,
        baseURL: 'https://jsonplaceholder.typicode.com',
        resources: ['posts', 'users'] as const,
    }),
}
