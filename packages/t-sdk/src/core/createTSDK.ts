import type { IResource, ITSDKInstance, ITSDKOptions } from '../types/ITSDK'
import { TSDKError } from './TSDKError'

export function createTSDK<TResources extends Record<string, IResource>>(
    options: ITSDKOptions<TResources>
): ITSDKInstance<TResources> {
    const { transport, driver, baseURL, resources } = options

    const instance = {} as ITSDKInstance<TResources>

    for (const resourceKey of Object.keys(resources) as (keyof TResources & string)[]) {
        const resource = resources[resourceKey]
        const resourceObj: Record<string, (payload?: unknown) => Promise<unknown>> = {}

        for (const methodKey of Object.keys(resource.methods)) {
            resourceObj[methodKey] = async (payload?: unknown) => {
                const request = driver.resolve(resourceKey, methodKey, payload)

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

        instance[resourceKey] = resourceObj as ITSDKInstance<TResources>[keyof TResources]
    }

    return instance
}
