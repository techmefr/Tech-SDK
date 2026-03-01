import { createTSDK } from '@t-suite/t-sdk'
import type { IMethodDefinition, ITSDKInstance, ITSDKOptions } from '@t-suite/t-sdk'

export function defineTSDK<
    TMethods extends Record<string, IMethodDefinition>,
    TResources extends readonly string[],
>(options: ITSDKOptions<TMethods, TResources>): ITSDKInstance<TMethods, TResources> {
    return createTSDK(options)
}
