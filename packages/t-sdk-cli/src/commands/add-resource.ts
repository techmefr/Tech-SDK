import { defineCommand } from 'citty'
import { consola } from 'consola'
import { writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'pathe'
import { resourceTemplate } from '../templates/sdk'

export const addResource = defineCommand({
    meta: {
        name: 'add-resource',
        description: 'Add a resource to an existing sub-SDK',
    },
    args: {
        name: {
            type: 'positional',
            description: 'Resource name (e.g. user, product)',
            required: true,
        },
        sdk: {
            type: 'string',
            description: 'Target SDK (e.g. lomkit, rest)',
            required: true,
        },
        url: {
            type: 'string',
            description: 'Backend URL for introspection (optional)',
        },
    },
    async run({ args }) {
        const { name, sdk, url } = args
        const root = process.cwd()
        const resourceDir = join(root, 'packages', 't-sdk', 'src', sdk, 'resources')

        if (!existsSync(resourceDir)) {
            consola.error(`SDK "${sdk}" not found. Run: t-sdk add ${sdk}`)
            process.exit(1)
        }

        const resourceFile = join(resourceDir, `${name}.ts`)

        if (existsSync(resourceFile)) {
            consola.error(`Resource "${name}" already exists in SDK "${sdk}"`)
            process.exit(1)
        }

        let content = resourceTemplate(name)

        if (url) {
            const introspected = await tryIntrospect(url, sdk, name)
            if (introspected) {
                content = introspected
                consola.success(`Introspection successful — types filled in automatically`)
            } else {
                consola.warn(`Introspection failed — pre-filled template created, complete the fields manually`)
            }
        }

        await writeFile(resourceFile, content)
        await updateResourceIndex(resourceDir, name)

        consola.success(`Resource "${name}" added to SDK "${sdk}"`)
        consola.info(`Edit: packages/t-sdk/src/${sdk}/resources/${name}.ts`)
    },
})

async function tryIntrospect(baseUrl: string, _sdk: string, resource: string): Promise<string | null> {
    try {
        const response = await fetch(`${baseUrl}/${resource}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ limit: 1 }),
        })

        if (!response.ok) return null

        const json = (await response.json()) as { data?: Record<string, unknown>[] }
        const sample = json?.data?.[0]

        if (!sample) return null

        const fields = Object.entries(sample)
            .map(([key, val]) => `    ${key}: ${inferType(val)}`)
            .join('\n')

        const name = resource
        const capitalized = name.charAt(0).toUpperCase() + name.slice(1)

        return `export interface I${capitalized} {\n${fields}\n}\n`
    } catch {
        return null
    }
}

async function updateResourceIndex(resourceDir: string, name: string): Promise<void> {
    const indexPath = join(resourceDir, 'index.ts')
    const current = existsSync(indexPath) ? await readFile(indexPath, 'utf-8') : ''
    const exportLine = `export type { I${name.charAt(0).toUpperCase() + name.slice(1)} } from './${name}'`

    if (current.includes(exportLine)) return

    const cleaned = current.replace(/^\/\/.*\n?/gm, '').trim()
    await writeFile(indexPath, `${cleaned ? `${cleaned}\n` : ''}${exportLine}\n`)
}

function inferType(value: unknown): string {
    if (value === null) return 'string | null'
    switch (typeof value) {
        case 'number': return 'number'
        case 'boolean': return 'boolean'
        default: return 'string'
    }
}
