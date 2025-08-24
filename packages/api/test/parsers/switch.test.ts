import { any, number, safeParse, string, templateLiteral } from 'zod/mini'
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
    safeParse(parser, '{{mung}}').data,
    '{{mung}}',
  )

  assertEquals(
    safeParse(parser, 1_000).data,
    1_000,
  )

  assertIsError(
    safeParse(parser, 'mung').error,
    $ZodError,
    '"expected": "number"',
  )
})
