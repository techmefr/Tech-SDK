import type { IMethodDefinition, ITSDKInstance, ITSDKOptions } from '../types/ITSDK'
import { TSDKError } from './TSDKError'

export function createTSDK<
    TMethods extends Record<string, IMethodDefinition>,
    TResources extends readonly string[],
>(options: ITSDKOptions<TMethods, TResources>): ITSDKInstance<TMethods, TResources> {
    const { transport, baseURL, plugin, resources } = options

    const instance = {} as ITSDKInstance<TMethods, TResources>

    for (const resourceName of resources) {
        const resourceObj: Record<string, (payload?: unknown) => Promise<unknown>> = {}

        for (const [methodName, methodDef] of Object.entries(plugin.methods)) {
            resourceObj[methodName] = async (payload?: unknown) => {
                const request = methodDef.resolve(resourceName, payload)

                try {
                    return await transport(`${baseURL}${request.url}`, {
                        method: request.method,
                        body: request.body,
                        headers: request.headers,
                    })
                } catch (error) {
                    if (TSDKError.isHttpError(error)) {
                        const data = error.data as {
                            message?: string
                            errors?: Record<string, string[]>
                        }

                        throw new TSDKError({
                            status: error.status,
                            message: data?.message ?? 'Request failed',
                            errors: data?.errors ?? {},
                        })
                    }

                    throw TSDKError.from(error)
                }
            }
        }

        instance[resourceName as TResources[number]] =
            resourceObj as ITSDKInstance<TMethods, TResources>[TResources[number]]
    }

    return instance
}
