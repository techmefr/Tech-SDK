import type { IDriver, IRequest } from '@t-suite/shared'

export const lomkitDriver: IDriver = {
    resolve(resource: string, method: string, payload?: unknown): IRequest {
        return {
            url: `/${resource}`,
            method: 'POST',
            body: { action: method, payload },
        }
    },
}
