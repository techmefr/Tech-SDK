import type { IMethodDefinition } from '../../types/ITSDK'

export const list: IMethodDefinition = {
    resolve: (resource) => ({
        url: `/${resource}`,
        method: 'GET',
    }),
}
