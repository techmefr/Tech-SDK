import type { IRequest } from '@t-suite/shared'

export interface IMethodDefinition {
    resolve: (resource: string, payload?: unknown) => IRequest
}

export interface IPlugin {
    methods: Record<string, IMethodDefinition>
}

export type ITransport = (url: string, options?: ITransportOptions) => Promise<unknown>

export interface ITransportOptions {
    method: string
    body?: unknown
    headers?: Record<string, string>
}

export interface ITSDKOptions<
    TMethods extends Record<string, IMethodDefinition>,
    TResources extends readonly string[],
> {
    transport: ITransport
    baseURL: string
    plugin: { methods: TMethods }
    resources: TResources
}

export type ITSDKInstance<
    TMethods extends Record<string, IMethodDefinition>,
    TResources extends readonly string[],
> = {
    [K in TResources[number]]: {
        [M in keyof TMethods]: (payload?: unknown) => Promise<unknown>
    }
}

export type IAnyTSDKInstance = Record<string, Record<string, (payload?: unknown) => Promise<unknown>>>
