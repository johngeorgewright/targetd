import { assertEquals, assertStrictEquals } from 'jsr:@std/assert'
import {
  arrayInit,
  arrayLast,
  objectEveryAsync,
  objectMap,
} from '../src/util.ts'

Deno.test('objectMap', () => {
  assertEquals(
    objectMap(
      {
        foo: 123,
        bar: 321,
      },
      (v) => v + 1,
    ),
    {
      foo: 124,
      bar: 322,
    },
  )
})

Deno.test('objectEveryAsync', async () => {
  assertStrictEquals(
    await objectEveryAsync(
      {
        foo: 1,
        bar: 2,
        goo: 3,
        car: 4,
      },
      (value) => Promise.resolve(value).then((v) => v > 2),
    ),
    false,
  )
  assertStrictEquals(
    await objectEveryAsync(
      {
        foo: 1,
        bar: 2,
        goo: 3,
        car: 4,
      },
      (value) => Promise.resolve(value).then((v) => v > 0),
    ),
    true,
  )
})

Deno.test('arrayInit', () => {
  assertEquals(arrayInit([1, 2, 3, 4, 5]), [1, 2, 3, 4])
})

Deno.test('arrayLast', () => {
  assertStrictEquals(arrayLast([1, 2, 3, 4, 5]), 5)
})
