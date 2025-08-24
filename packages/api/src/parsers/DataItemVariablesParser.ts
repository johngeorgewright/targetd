import type { $ZodShape, $ZodType } from 'zod/v4/core'
import {
  any,
  record,
  safeParse,
  string,
  type ZodMiniAny,
  type ZodMiniRecord,
  type ZodMiniString,
} from 'zod/mini'
import { DataItemRulesParser } from './DataItemRules.ts'
import type { VariablesRegistry } from './variablesRegistry.ts'

export function DataItemVariablesParser<
  T extends $ZodShape,
  FTT extends $ZodShape,
>(
  variablesRegistry: VariablesRegistry,
  targeting: T,
  fallThroughTargeting: FTT,
): DataItemVariablesParser<T, FTT> {
  return record(
    string(),
    DataItemRulesParser(
      variablesRegistry,
      any(),
      targeting,
      fallThroughTargeting,
    ),
  ).check((ctx) => {
    const variables = variablesRegistry.get()
    for (const [varName, parser] of Object.entries(variables)) {
      if (!(varName in ctx.value)) {
        ctx.issues.push({
          code: 'custom',
          input: varName,
          message: `Variable ${varName} has not been set`,
        })
      } else {
        ctx.value[varName].forEach((rule, index) => {
          if ('payload' in rule) {
            parseVarPayload(parser, rule.payload, [varName, index, 'payload'])
          } else {
            for (const fallthroughRule of rule.fallThrough) {
              parseVarPayload(parser, fallthroughRule.payload, [
                varName,
                index,
                JSON.stringify({ targeting: fallthroughRule.targeting }),
                'payload',
              ])
            }
          }
        })
      }
    }

    function parseVarPayload(
      parser: $ZodType,
      payload: unknown,
      path: (string | number)[],
    ) {
      const result = safeParse(parser, payload)
      if (!result.success) {
        ctx.issues.push(
          ...result.error.issues.map((issue) => ({
            ...issue,
            input: payload as any,
            path,
          })),
        )
      }
    }
  })
}

export type DataItemVariablesParser<
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> = ZodMiniRecord<
  ZodMiniString<string>,
  DataItemRulesParser<ZodMiniAny, Targeting, FallThroughTargeting>
>
