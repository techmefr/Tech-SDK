import type { IMethodDefinition } from '../../types/ITSDK'

export const update: IMethodDefinition = {
    resolve: (resource, payload) => {
        const { id, ...body } = payload as { id: string | number; [key: string]: unknown }
        return {
            url: `/${resource}/${id}`,
            method: 'PUT',
            body,
        }
    },
}
