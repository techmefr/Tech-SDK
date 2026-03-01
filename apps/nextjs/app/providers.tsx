'use client'

import { TSDKProvider } from '@t-suite/t-sdk-react'
import { tsdk } from '../lib/tsdk'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
    return <TSDKProvider sdk={tsdk.rest}>{children}</TSDKProvider>
}
