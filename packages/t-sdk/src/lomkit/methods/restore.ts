import type { IMethodDefinition } from '../../types/ITSDK'

export const restore: IMethodDefinition = {
    resolve: (resource, payload) => {
        const { key } = payload as { key: number | string }
        return {
            url: `/${resource}/restore`,
            method: 'POST',
            body: { restore: [key] },
        }
    },
}
