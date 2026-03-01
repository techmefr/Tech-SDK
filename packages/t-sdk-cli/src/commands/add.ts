import { defineCommand } from 'citty'
import { consola } from 'consola'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'pathe'
import { sdkTemplate, methodTemplate } from '../templates/sdk'

export const add = defineCommand({
    meta: {
        name: 'add',
        description: 'Scaffold a new sub-SDK inside t-sdk',
    },
    args: {
        name: {
            type: 'positional',
            description: 'SDK name (e.g. lomkit, rest, graphql)',
            required: true,
        },
    },
    async run({ args }) {
        const { name } = args
        const root = process.cwd()
        const sdkSrc = join(root, 'packages', 't-sdk', 'src')
        const sdkDir = join(sdkSrc, name)

        if (existsSync(sdkDir)) {
            consola.error(`SDK "${name}" already exists at ${sdkDir}`)
            process.exit(1)
        }

        await mkdir(join(sdkDir, 'methods'), { recursive: true })
        await mkdir(join(sdkDir, 'types'), { recursive: true })
        await mkdir(join(sdkDir, 'resources'), { recursive: true })

        await writeFile(join(sdkDir, 'index.ts'), sdkTemplate(name))
        await writeFile(join(sdkDir, 'methods', 'index.ts'), `// Add methods here and re-export them\n`)
        await writeFile(join(sdkDir, 'types', 'index.ts'), `// Add types here and re-export them\n`)
        await writeFile(
            join(sdkDir, 'resources', 'index.ts'),
            `// Resources are registered here by the CLI (t-sdk add-resource)\n`
        )

        await writeFile(join(sdkDir, 'driver.ts'), methodTemplate('driver'))

        await updateTSDKIndex(sdkSrc, name)

        consola.success(`SDK "${name}" created at packages/t-sdk/src/${name}/`)
        consola.info(`Next: implement packages/t-sdk/src/${name}/driver.ts`)
    },
})

async function updateTSDKIndex(sdkSrc: string, name: string): Promise<void> {
    const indexPath = join(sdkSrc, 'index.ts')
    const current = await readFile(indexPath, 'utf-8')
    const exportLine = `export * from './${name}'`

    if (current.includes(exportLine)) return

    await writeFile(indexPath, `${current.trimEnd()}\nexport * from './${name}'\n`)
}
