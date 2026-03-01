// @ts-check
import { defineConfig } from 'astro/config'

export default defineConfig({
    vite: {
        ssr: {
            noExternal: ['@t-suite/t-sdk', '@t-suite/t-sdk-astro', '@t-suite/shared'],
        },
    },
})
