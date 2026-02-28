import { createTSDK } from '@t-suite/t-sdk'
import type { IResource, ITSDKInstance, ITSDKOptions } from '@t-suite/t-sdk'

export function defineTSDK<TResources extends Record<string, IResource>>(
    options: ITSDKOptions<TResources>
): ITSDKInstance<TResources> {
    return createTSDK(options)
}
