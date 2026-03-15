import {
  any,
  enum as zEnum,
  minimum,
  number,
  object,
  optional,
  parse,
  safeExtend,
  safeParse,
  strictObject,
  string,
  templateLiteral,
  union,
} from 'zod/mini'
import { zodSwitch } from '../../src/parsers/switch.ts'
import { assertEquals, assertIsError } from 'jsr:@std/assert'
import { $ZodError } from 'zod/v4/core'

Deno.test('zodSwitch', () => {
  const variableParser = templateLiteral(['{{', string(), '}}'])
  const numberParser = number()

  const parser = zodSwitch([
    [variableParser, variableParser],
    [any(), numberParser],
  ])

  assertEquals(
    parse(parser, '{{mung}}'),
    '{{mung}}',
  )

  assertEquals(
    parse(parser, 1_000),
    1_000,
  )

  assertIsError(
    safeParse(parser, 'mung').error,
    $ZodError,
    '"expected": "number"',
  )
})

Deno.test('zodSwitch 2', () => {
  const min1 = () => number().check(minimum(1))

  const BaseAdListItem = strictObject({
    position: zEnum(['left', 'right', 'center']),
    variant: optional(union([string(), number()])),
  })

  const StaticAdListItem = strictObject({
    position: zEnum(['left', 'right', 'center']),
    variant: optional(union([string(), number()])),
    index: min1(),
    range: optional(min1()),
  })

  const RecurringAdListItem = safeExtend(BaseAdListItem, {
    start: min1(),
    every: min1(),
    maxNum: optional(min1()),
  })

  const AdListItem = zodSwitch([
    [object({ index: any() }), StaticAdListItem],
    [any(), RecurringAdListItem],
  ])

  assertEquals(
    parse(AdListItem, {
      position: 'left',
      index: 1,
      range: 4,
    }),
    {
      position: 'left',
      index: 1,
      range: 4,
    },
  )
})
