import { createContext, useContext, type ReactNode } from 'react'
import type { IAnyTSDKInstance } from '@t-suite/t-sdk'

const TSDKContext = createContext<IAnyTSDKInstance | null>(null)

export interface ITSDKProviderProps {
    sdk: IAnyTSDKInstance
    children: ReactNode
}

export function TSDKProvider({ sdk, children }: ITSDKProviderProps) {
    return <TSDKContext.Provider value={sdk}>{children}</TSDKContext.Provider>
}

export function useTSDKContext(): IAnyTSDKInstance {
    const ctx = useContext(TSDKContext)
    if (!ctx) throw new Error('useTSDKContext must be called inside <TSDKProvider>')
    return ctx
}
