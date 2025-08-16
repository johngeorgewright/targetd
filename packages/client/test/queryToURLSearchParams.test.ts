import { assertStrictEquals } from 'jsr:@std/assert'
import { queryToURLSearchParams } from '../src/queryToURLSearchParams.ts'

Deno.test('numbers', () => {
  assertStrictEquals(
    queryToURLSearchParams({ number: 1 }).toString(),
    'number=1',
  )
})

Deno.test('strings', () => {
  assertStrictEquals(
    queryToURLSearchParams({ string: 'foo' }).toString(),
    'string=foo',
  )
})

Deno.test('booleans', () => {
  assertStrictEquals(
    queryToURLSearchParams({ bool: true }).toString(),
    'bool=true',
  )
})

Deno.test('arrays', () => {
  assertStrictEquals(
    queryToURLSearchParams({ array: [1, 2, true, 'foo'] }).toString(),
    'array=1&array=2&array=true&array=foo',
  )
})

Deno.test('objects', () => {
  assertStrictEquals(
    queryToURLSearchParams({ a: { b: { c: 'foo' }, d: 'bar' }, e: 'ber' })
      .toString(),
    encodeURI('a[b][c]=foo&a[d]=bar&e=ber'),
  )
})

Deno.test('arrays and objects', () => {
  assertStrictEquals(
    queryToURLSearchParams({
      a: [{ b: ['foo', 'bar'] }, { b: ['boo', 'far'] }],
    }).toString(),
    encodeURI('a[b]=foo&a[b]=bar&a[b]=boo&a[b]=far'),
  )
})
