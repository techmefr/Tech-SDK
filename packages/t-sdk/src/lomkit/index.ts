import { createTSDK } from '../core/createTSDK'
import type { IMethodDefinition, ITSDKInstance, ITransport } from '../types/ITSDK'
import * as methods from './methods'

export const lomkitPlugin = { methods } satisfies { methods: Record<string, IMethodDefinition> }

export function createLomkitSDK<TResources extends readonly string[]>(options: {
    transport: ITransport
    baseURL: string
    resources: TResources
}): ITSDKInstance<typeof lomkitPlugin.methods, TResources> {
    return createTSDK({ ...options, plugin: lomkitPlugin })
}

export type { ILomkitSearchPayload, ILomkitFilter, ILomkitScope, ILomkitSort } from './types/ILomkitSearch'
export type { ILomkitMutatePayload, ILomkitMutateOperation, ILomkitOperation } from './types/ILomkitMutate'
export type { ILomkitSearchResponse, ILomkitMutateResponse, ILomkitMeta } from './types/ILomkitResponse'
