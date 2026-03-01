import type { IMethodDefinition } from '../../types/ITSDK'

export const search: IMethodDefinition = {
    resolve: (resource, payload) => ({
        url: `/${resource}/search`,
        method: 'POST',
        body: payload ?? {},
    }),
}
