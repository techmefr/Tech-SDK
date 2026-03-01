export type ILomkitOperator =
    | '='
    | '!='
    | '<'
    | '<='
    | '>'
    | '>='
    | 'like'
    | 'not like'
    | 'in'
    | 'not in'

export interface ILomkitFilter {
    field: string
    operator?: ILomkitOperator
    value: unknown
    type?: 'and' | 'or'
}

export interface ILomkitScope {
    name: string
    parameters?: unknown[]
}

export interface ILomkitSort {
    field: string
    direction?: 'asc' | 'desc'
}

export interface ILomkitSearchPayload {
    filters?: ILomkitFilter[]
    scopes?: ILomkitScope[]
    sorts?: ILomkitSort[]
    includes?: string[]
    page?: number
    limit?: number
}
