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
import { zodSwitch } from '../../src/parsers/switch.js'
import { test, expect } from 'bun:test'
import { $ZodError } from 'zod/v4/core'

test('zodSwitch', () => {
  const variableParser = templateLiteral(['{{', string(), '}}'])
  const numberParser = number()

  const parser = zodSwitch([
    [variableParser, variableParser],
    [any(), numberParser],
  ])

  expect(parse(parser, '{{mung}}')).toEqual('{{mung}}')

  expect(parse(parser, 1_000)).toEqual(1_000)

  const result = safeParse(parser, 'mung')
  expect(result.error).toBeInstanceOf($ZodError)
  expect(result.error?.message).toContain('"expected": "number"')
})

test('zodSwitch 2', () => {
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

  expect(
    parse(AdListItem, {
      position: 'left',
      index: 1,
      range: 4,
    }),
  ).toEqual({
    position: 'left',
    index: 1,
    range: 4,
  })
})
