import type { IMethodDefinition } from '../../types/ITSDK'

export const destroy: IMethodDefinition = {
    resolve: (resource, payload) => {
        const { key } = payload as { key: number | string }
        return {
            url: `/${resource}/mutate`,
            method: 'POST',
            body: {
                mutate: [{ operation: 'destroy', key }],
            },
        }
    },
}
