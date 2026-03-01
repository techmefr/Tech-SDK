import type { IMethodDefinition } from '../../types/ITSDK'

export const create: IMethodDefinition = {
    resolve: (resource, payload) => ({
        url: `/${resource}`,
        method: 'POST',
        body: payload,
    }),
}
