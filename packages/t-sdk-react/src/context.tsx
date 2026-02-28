import { createContext, useContext, type ReactNode } from 'react'
import type { ITSDKInstance, IResource } from '@t-suite/t-sdk'

type IAnySDK = ITSDKInstance<Record<string, IResource>>

const TSDKContext = createContext<IAnySDK | null>(null)

export interface ITSDKProviderProps {
    sdk: IAnySDK
    children: ReactNode
}

export function TSDKProvider({ sdk, children }: ITSDKProviderProps) {
    return <TSDKContext.Provider value={sdk}>{children}</TSDKContext.Provider>
}

export function useTSDKContext(): IAnySDK {
    const ctx = useContext(TSDKContext)
    if (!ctx) throw new Error('useTSDKContext must be called inside <TSDKProvider>')
    return ctx
}
