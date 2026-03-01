export type ILomkitOperation = 'create' | 'update' | 'destroy'

export interface ILomkitMutateOperation {
    operation: ILomkitOperation
    key?: number | string
    attributes?: Record<string, unknown>
    relations?: Record<string, ILomkitMutateOperation[]>
}

export interface ILomkitMutatePayload {
    mutate: ILomkitMutateOperation[]
}
