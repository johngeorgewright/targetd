import { strictObject, type ZodRawShape } from 'zod'
import type { ZodPartialObject } from '../types.ts'
import { DataItemParser } from './DataItem.ts'

export function DataItemsParser<
  D extends ZodRawShape,
  T extends ZodRawShape,
  CT extends ZodRawShape,
>(payloadParsers: D, targeting: T, fallThroughTargeting: CT) {
  const dataItems: Record<string, any> = {}
  for (const [key, Payload] of Object.entries(payloadParsers)) {
    dataItems[key] = DataItemParser(Payload, targeting, fallThroughTargeting)
  }
  return strictObject(dataItems).partial() as DataItemsParser<D, T, CT>
}

export type DataItemsParser<
  DataTypes extends ZodRawShape,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
> = ZodPartialObject<
  {
    [Name in keyof DataTypes]: DataItemParser<
      DataTypes[Name],
      Targeting,
      FallThroughTargeting
    >
  },
  'strict'
>
