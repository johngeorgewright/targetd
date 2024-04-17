import { type ZodRawShape, strictObject } from 'zod'
import { type ZodPartialObject } from '../types'
import { DataItemParser } from './DataItem'
import { VT } from '../types/Variables'

export function DataItemsParser<
  D extends ZodRawShape,
  T extends ZodRawShape,
  CT extends ZodRawShape,
  Q extends ZodRawShape,
  Vs extends VT.FromPayload<D>,
>(
  payloadParsers: D,
  targeting: T,
  fallThroughTargeting: CT,
  query: Q,
  variableParsers: Partial<Vs>,
) {
  const dataItems: Record<string, any> = {}
  for (const [key, Payload] of Object.entries(payloadParsers))
    dataItems[key] = DataItemParser(
      Payload,
      targeting,
      fallThroughTargeting,
      query,
      variableParsers[key] || {},
    )
  return strictObject(dataItems).partial() as DataItemsParser<D, T, CT, Q, Vs>
}

export type DataItemsParser<
  DataTypes extends ZodRawShape,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
  Query extends ZodRawShape,
  Variables extends VT.FromPayload<DataTypes>,
> = ZodPartialObject<
  {
    [Name in keyof DataTypes]: DataItemParser<
      DataTypes[Name],
      Targeting,
      FallThroughTargeting,
      Query,
      Variables[Name]
    >
  },
  'strict'
>
