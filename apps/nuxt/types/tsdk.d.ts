import type { IAnyTSDKInstance } from '@t-suite/t-sdk'

declare module '#app' {
    interface NuxtApp {
        $tsdk: IAnyTSDKInstance
    }
}

declare module 'vue' {
    interface ComponentCustomProperties {
        $tsdk: IAnyTSDKInstance
    }
}

export {}
