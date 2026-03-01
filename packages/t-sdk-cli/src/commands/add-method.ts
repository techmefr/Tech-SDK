import { defineCommand } from 'citty'
import { consola } from 'consola'
import { writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'pathe'
import { methodTemplate } from '../templates/sdk'

export const addMethod = defineCommand({
    meta: {
        name: 'add-method',
        description: 'Add a method to an existing sub-SDK',
    },
    args: {
        name: {
            type: 'positional',
            description: 'Method name (e.g. softDelete, archive, publish)',
            required: true,
        },
        sdk: {
            type: 'string',
            description: 'Target SDK (e.g. lomkit, rest)',
            required: true,
        },
    },
    async run({ args }) {
        const { name, sdk } = args
        const root = process.cwd()
        const methodsDir = join(root, 'packages', 't-sdk', 'src', sdk, 'methods')

        if (!existsSync(methodsDir)) {
            consola.error(`SDK "${sdk}" not found. Run: t-sdk add ${sdk}`)
            process.exit(1)
        }

        const methodFile = join(methodsDir, `${name}.ts`)

        if (existsSync(methodFile)) {
            consola.error(`Method "${name}" already exists in SDK "${sdk}"`)
            process.exit(1)
        }

        await writeFile(methodFile, methodTemplate(name))
        await updateMethodIndex(methodsDir, name)

        consola.success(`Method "${name}" added to SDK "${sdk}"`)
        consola.info(`Implement: packages/t-sdk/src/${sdk}/methods/${name}.ts`)
    },
})

async function updateMethodIndex(methodsDir: string, name: string): Promise<void> {
    const indexPath = join(methodsDir, 'index.ts')
    const current = existsSync(indexPath) ? await readFile(indexPath, 'utf-8') : ''
    const exportLine = `export { ${name} } from './${name}'`

    if (current.includes(exportLine)) return

    await writeFile(indexPath, `${current.trimEnd()}\n${exportLine}\n`)
}
