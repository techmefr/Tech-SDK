import type { IMethodDefinition } from '../../types/ITSDK'
import type { ILomkitMutatePayload } from '../types/ILomkitMutate'

export const mutate: IMethodDefinition = {
    resolve: (resource, payload) => ({
        url: `/${resource}/mutate`,
        method: 'POST',
        body: payload as ILomkitMutatePayload,
    }),
}
