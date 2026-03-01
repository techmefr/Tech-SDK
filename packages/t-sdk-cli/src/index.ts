import { defineCommand, runMain } from 'citty'
import { add } from './commands/add'
import { addResource } from './commands/add-resource'
import { addMethod } from './commands/add-method'

const main = defineCommand({
    meta: {
        name: 't-sdk',
        version: '0.0.1',
        description: 'T-SDK CLI — scaffold sub-SDKs, resources and methods',
    },
    subCommands: {
        add,
        'add-resource': addResource,
        'add-method': addMethod,
    },
})

runMain(main)
