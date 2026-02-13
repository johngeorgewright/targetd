import {
  custom,
  registry,
  safeParse,
  superRefine,
  union,
  type ZodMiniCustom,
  type ZodMiniUnion,
} from 'zod/mini'
import type { $ZodRegistry, $ZodType } from 'zod/v4/core'

/**
 * A tuple array representing switch case mappings.
 * Each entry is a [condition, parser] pair where the condition determines which parser to use.
 */
export type $ZodSwitchMap = [condition: $ZodType, parser: $ZodType][]

/**
 * A Zod custom schema type that evaluates conditions and applies the corresponding parser.
 * The output and input types are derived from the parser schemas in the switch map.
 *
 * @template SwitchMap - The switch map defining condition-parser pairs
 */
export type ZodSwitch<SwitchMap extends $ZodSwitchMap = $ZodSwitchMap> =
  ZodMiniCustom<
    SwitchMap[number][1]['_zod']['output'],
    SwitchMap[number][1]['_zod']['input']
  >

/**
 * Registry for switch schemas that stores metadata about the union of all possible parsers.
 * Used internally by zodSwitch to register schema information.
 */
export const switchRegistry: $ZodRegistry<{
  union: ZodMiniUnion
}, ZodSwitch<$ZodSwitchMap>> = registry()

/**
 * Create a conditional Zod parser that evaluates different schemas based on conditions.
 * Similar to a switch statement, it tests each condition and applies the corresponding parser.
 *
 * @param switchMap - Array of [condition, parser] tuples to evaluate in order.
 * @returns A Zod schema that conditionally validates based on the switch map.
 *
 * @example
 * ```ts
 * import { zodSwitch } from '@targetd/api'
 * import { z } from 'zod'
 *
 * const paymentSchema = zodSwitch([
 *   [z.object({ type: z.literal('card') }), z.object({ cardNumber: z.string(), cvv: z.string() })],
 *   [z.object({ type: z.literal('paypal') }), z.object({ email: z.string().email() })],
 *   [z.object({ type: z.literal('bank') }), z.object({ accountNumber: z.string(), routing: z.string() })]
 * ])
 * ```
 */
export function zodSwitch<SwitchMap extends $ZodSwitchMap>(
  switchMap: SwitchMap,
): ZodSwitch<SwitchMap> {
  return custom<
    SwitchMap[number][1]['_zod']['output'],
    SwitchMap[number][1]['_zod']['input']
  >().check(
    superRefine((input, payload) => {
      for (const [condition, parser] of switchMap) {
        const conditionResult = safeParse(condition, input)
        if (conditionResult.success) {
          const parseResult = safeParse(parser, conditionResult.data)
          if (parseResult.success) payload.value = parseResult.data
          else {
            for (const issue of parseResult.error.issues) {
              payload.addIssue({
                ...issue,
                input: input as any,
              })
            }
          }
          break
        }
      }
    }),
  )
    .register(switchRegistry, {
      union: union(switchMap.map(([, type]) => type)) as any,
    })
}
