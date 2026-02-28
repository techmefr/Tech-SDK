import type { IDriver, IRequest } from '@t-suite/shared'

export const restDriver: IDriver = {
    resolve(resource: string, method: string, payload?: unknown): IRequest {
        const methodMap: Record<string, IRequest['method']> = {
            list: 'GET',
            get: 'GET',
            create: 'POST',
            update: 'PUT',
            patch: 'PATCH',
            delete: 'DELETE',
        }

        const httpMethod = methodMap[method] ?? 'POST'
        const isBodyMethod = ['POST', 'PUT', 'PATCH'].includes(httpMethod)

        return {
            url: `/${resource}`,
            method: httpMethod,
            body: isBodyMethod ? payload : undefined,
        }
    },
}
