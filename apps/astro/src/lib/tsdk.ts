import { defineTSDK } from '@t-suite/t-sdk-astro'
import { restPlugin } from '@t-suite/t-sdk/rest'
import type { ITransport } from '@t-suite/t-sdk'
import { ofetch } from 'ofetch'

export const tsdk = {
    rest: defineTSDK({
        transport: ofetch as unknown as ITransport,
        baseURL: 'https://jsonplaceholder.typicode.com',
        plugin: restPlugin,
        resources: ['posts', 'users'] as const,
    }),
}
