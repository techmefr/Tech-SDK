export interface IRequest {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    headers?: Record<string, string>
}

export interface IResponse<T = unknown> {
    data: T
    status: number
}

export interface IDriver {
    resolve(resource: string, method: string, payload?: unknown): IRequest
}
