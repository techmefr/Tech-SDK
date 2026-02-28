import type { IDriver } from '@t-suite/shared'

export interface IMethod {
    path: string
    httpMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
}

export interface IResource {
    methods: Record<string, IMethod>
}

export type ITransport = (url: string, options?: ITransportOptions) => Promise<unknown>

export interface ITransportOptions {
    method: string
    body?: unknown
    headers?: Record<string, string>
}

export interface ITSDKOptions<TResources extends Record<string, IResource>> {
    transport: ITransport
    driver: IDriver
    baseURL: string
    resources: TResources
}

export type IMethodCaller = (payload?: unknown) => Promise<unknown>

export type ITSDKInstance<TResources extends Record<string, IResource>> = {
    [K in keyof TResources]: {
        [M in keyof TResources[K]['methods']]: IMethodCaller
    }
}
