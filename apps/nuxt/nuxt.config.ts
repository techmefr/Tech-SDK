export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    build: {
        transpile: ['@t-suite/t-sdk', '@t-suite/t-sdk-vue', '@t-suite/shared'],
    },
})
