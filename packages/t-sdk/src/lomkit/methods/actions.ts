import type { IMethodDefinition } from '../../types/ITSDK'

export const actions: IMethodDefinition = {
    resolve: (resource, payload) => {
        const { action, ...body } = payload as { action: string; [key: string]: unknown }
        return {
            url: `/${resource}/actions/${action}`,
            method: 'POST',
            body,
        }
    },
}
