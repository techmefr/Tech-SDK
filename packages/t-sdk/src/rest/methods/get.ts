import type { IMethodDefinition } from '../../types/ITSDK'

export const get: IMethodDefinition = {
    resolve: (resource, payload) => {
        const { id } = payload as { id: string | number }
        return {
            url: `/${resource}/${id}`,
            method: 'GET',
        }
    },
}
