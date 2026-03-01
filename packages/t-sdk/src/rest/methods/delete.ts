import type { IMethodDefinition } from '../../types/ITSDK'

export const del: IMethodDefinition = {
    resolve: (resource, payload) => {
        const { id } = payload as { id: string | number }
        return {
            url: `/${resource}/${id}`,
            method: 'DELETE',
        }
    },
}
