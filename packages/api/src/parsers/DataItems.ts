import type { ZodPartialObject } from '../types.ts'
import {
  type DataItemIn,
  type DataItemOut,
  DataItemParser,
} from './DataItem.ts'
import { object, partial, strictObject } from 'zod/mini'
import type { $strict, $ZodShape } from 'zod/v4/core'

/**
 * Parses all items in a Data class.
 *
 * @example
 * ```ts
 * import { equal, assertThrows } from 'jsr:@std/assert'
 * import { z } from 'zod/mini'
 * const dataItemsParser = DataItemsParser(
 *   { a: z.number() },
 *   { foo: z.string() },
 *   {},
 * )
 * equal(
 *   z.parse(dataItemsParser, {
 *     a: { rules: [{ targeting: { foo: 'bar' }, payload: 123 }], variables: {} }
 *   }),
 *   {
 *     a: { rules: [{ targeting: { foo: 'bar' }, payload: 123 }], variables: {} }
 *   }
 * )
 * ```
 */
export function DataItemsParser<
  D extends $ZodShape,
  T extends $ZodShape,
  CT extends $ZodShape,
>(
  payloadParsers: D,
  targeting: T,
  fallThroughTargeting: CT,
  strict = true,
): DataItemsParser<D, T, CT> {
  const dataItems: Record<string, any> = {}
  for (const [key, Payload] of Object.entries(payloadParsers)) {
    dataItems[key] = DataItemParser(
      Payload,
      targeting,
      fallThroughTargeting,
      strict,
    )
  }
  return partial(
    (strict ? strictObject : object)(dataItems),
  ) as DataItemsParser<D, T, CT>
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
