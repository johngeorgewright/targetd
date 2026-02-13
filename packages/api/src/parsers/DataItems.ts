import type * as DT from '../types/Data.ts'
import type { ObjValues, ZodPartialObject } from '../types.ts'
import {
  type DataItemIn,
  type DataItemOut,
  DataItemParser,
} from './DataItem.ts'
import { object, partial, strictObject } from 'zod/mini'
import type { $strict } from 'zod/v4/core'

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
  $ extends DT.Meta,
>(
  payloadParsers: $['PayloadParsers'],
  targeting: $['TargetingParsers'],
  fallThroughTargeting: $['FallThroughTargetingParsers'],
  strict = true,
): DataItemsParser<$> {
  const dataItems: Record<string, any> = {}
  for (const [key, Payload] of Object.entries(payloadParsers)) {
    dataItems[key] = DataItemParser(
      Payload as ObjValues<$['PayloadParsers']>,
      targeting,
      fallThroughTargeting,
      strict,
    )
  }
  return partial(
    (strict ? strictObject : object)(dataItems),
  ) as DataItemsParser<$>
}

/**
 * Zod parser for all items in a Data instance.
 * Returns a partial object where each key is a payload name.
 *
 * @template $ - Data meta configuration.
 */
export type DataItemsParser<
  $ extends DT.Meta,
> = ZodPartialObject<
  {
    [Name in keyof $['PayloadParsers']]: DataItemParser<
      $,
      $['PayloadParsers'][Name]
    >
  },
  $strict
>

/**
 * Input type for {@link DataItemsParser}.
 * Maps payload names to their item input configurations.
 *
 * @template $ - Data meta configuration.
 */
export type DataItemsIn<$ extends DT.Meta> = {
  [Name in keyof $['PayloadParsers']]?: DataItemIn<$, $['PayloadParsers'][Name]>
}

/**
 * Output type for {@link DataItemsParser}.
 * Maps payload names to their item output configurations.
 *
 * @template $ - Data meta configuration.
 */
export type DataItemsOut<$ extends DT.Meta> = {
  [Name in keyof $['PayloadParsers']]?: DataItemOut<
    $,
    $['PayloadParsers'][Name]
  >
}
