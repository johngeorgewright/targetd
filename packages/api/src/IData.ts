import type * as DT from './types/Data.ts'

export type { ConfigurableData } from './ConfigurableData.ts'
export type { InsertableData } from './InsertableData.ts'
export type { QueryableData } from './QueryableData.ts'

export type IData<$ extends DT.Meta> =
  & import('./ConfigurableData.ts').ConfigurableData<$>
  & import('./InsertableData.ts').InsertableData<$>
  & import('./QueryableData.ts').QueryableData<$>
