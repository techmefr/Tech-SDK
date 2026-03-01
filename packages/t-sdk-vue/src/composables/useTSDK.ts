import { provide, inject } from 'vue'
import type { IAnyTSDKInstance } from '@t-suite/t-sdk'

const TSDK_KEY = Symbol('tsdk')

export function provideTSDK(sdk: IAnyTSDKInstance): void {
    provide(TSDK_KEY, sdk)
}

export function useTSDK(): IAnyTSDKInstance {
    const sdk = inject<IAnyTSDKInstance>(TSDK_KEY)
    if (!sdk) throw new Error('useTSDK must be called after provideTSDK')
    return sdk
}
