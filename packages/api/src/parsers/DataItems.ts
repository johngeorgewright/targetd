import type { ZodPartialObject } from '../types.ts'
import {
  type DataItemIn,
  type DataItemOut,
  DataItemParser,
} from './DataItem.ts'
import { partial, strictObject } from 'zod/v4-mini'
import type { $strict, $ZodShape } from 'zod/v4/core'

export function DataItemsParser<
  D extends $ZodShape,
  T extends $ZodShape,
  CT extends $ZodShape,
>(
  payloadParsers: D,
  targeting: T,
  fallThroughTargeting: CT,
): DataItemsParser<D, T, CT> {
  const dataItems: Record<string, any> = {}
  for (const [key, Payload] of Object.entries(payloadParsers)) {
    dataItems[key] = DataItemParser(Payload, targeting, fallThroughTargeting)
  }
  return partial(strictObject(dataItems)) as DataItemsParser<D, T, CT>
}

export type DataItemsParser<
  DataTypes extends $ZodShape,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> = ZodPartialObject<
  {
    [Name in keyof DataTypes]: DataItemParser<
      DataTypes[Name],
      Targeting,
      FallThroughTargeting
    >
  },
  $strict
>

export type DataItemsIn<
  DataTypes extends $ZodShape,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> = {
  [Name in keyof DataTypes]?: DataItemIn<
    DataTypes[Name],
    Targeting,
    FallThroughTargeting
  >
}

export type DataItemsOut<
  DataTypes extends $ZodShape,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> = {
  [Name in keyof DataTypes]?: DataItemOut<
    DataTypes[Name],
    Targeting,
    FallThroughTargeting
  >
}
