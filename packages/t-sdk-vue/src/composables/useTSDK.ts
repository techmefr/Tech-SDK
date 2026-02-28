import { provide, inject } from 'vue'
import type { ITSDKInstance, IResource } from '@t-suite/t-sdk'

type IAnySDK = ITSDKInstance<Record<string, IResource>>

const TSDK_KEY = Symbol('tsdk')

export function provideTSDK(sdk: IAnySDK): void {
    provide(TSDK_KEY, sdk)
}

export function useTSDK(): IAnySDK {
    const sdk = inject<IAnySDK>(TSDK_KEY)
    if (!sdk) throw new Error('useTSDK must be called after provideTSDK')
    return sdk
}
