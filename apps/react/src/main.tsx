import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TSDKProvider } from '@t-suite/t-sdk-react'
import { tsdk } from './lib/tsdk'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <TSDKProvider sdk={tsdk.rest}>
            <App />
        </TSDKProvider>
    </StrictMode>,
)
