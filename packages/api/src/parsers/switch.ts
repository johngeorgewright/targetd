import {
  custom,
  registry,
  safeParse,
  superRefine,
  union,
  type ZodMiniCustom,
  type ZodMiniUnion,
} from 'zod/mini'
import type { $ZodType } from 'zod/v4/core'

export type $ZodSwitchMap = [condition: $ZodType, parser: $ZodType][]

export type ZodSwitch<SwitchMap extends $ZodSwitchMap = $ZodSwitchMap> =
  ZodMiniCustom<
    SwitchMap[number][1]['_zod']['output'],
    SwitchMap[number][1]['_zod']['input']
  >

export const switchRegistry = registry<
  { union: ZodMiniUnion },
  ZodSwitch
>()

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
