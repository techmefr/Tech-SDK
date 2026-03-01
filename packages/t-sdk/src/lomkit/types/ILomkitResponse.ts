export interface ILomkitMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
}

export interface ILomkitSearchResponse<T> {
    data: T[]
    meta: ILomkitMeta
}

export interface ILomkitMutateResponse<T = Record<string, unknown>> {
    created: T[]
    updated: T[]
}
