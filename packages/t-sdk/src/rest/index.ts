import { createTSDK } from '../core/createTSDK'
import type { IMethodDefinition, ITSDKInstance, ITransport } from '../types/ITSDK'
import * as methods from './methods'

export const restPlugin = { methods } satisfies { methods: Record<string, IMethodDefinition> }

export function createRestSDK<TResources extends readonly string[]>(options: {
    transport: ITransport
    baseURL: string
    resources: TResources
}): ITSDKInstance<typeof restPlugin.methods, TResources> {
    return createTSDK({ ...options, plugin: restPlugin })
}
