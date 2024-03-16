import { type ZodRawShape, strictObject } from 'zod'
import { type ZodPartialObject } from '../types'
import { DataItemParser } from './DataItem'

export function DataItemsParser<
  D extends ZodRawShape,
  T extends ZodRawShape,
  CT extends ZodRawShape,
  Vs extends Record<keyof D, ZodRawShape>,
>(
  payloadParsers: D,
  targeting: T,
  fallThroughTargeting: CT,
  variableParsers: Partial<Vs>,
) {
  const dataItems: Record<string, any> = {}
  for (const [key, Payload] of Object.entries(payloadParsers))
    dataItems[key] = DataItemParser(
      Payload,
      targeting,
      fallThroughTargeting,
      variableParsers[key] || {},
    )
  return strictObject(dataItems).partial() as DataItemsParser<D, T, CT, Vs>
}

export type DataItemsParser<
  DataTypes extends ZodRawShape,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
  Variables extends Record<keyof DataTypes, ZodRawShape>,
> = ZodPartialObject<
  {
    [Name in keyof DataTypes]: DataItemParser<
      DataTypes[Name],
      Targeting,
      FallThroughTargeting,
      Variables[Name]
    >
  },
  'strict'
>
