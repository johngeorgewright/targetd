import { test, expect } from 'bun:test'
import { queryToURLSearchParams } from '../src/queryToURLSearchParams.ts'

test('numbers', () => {
  expect(queryToURLSearchParams({ number: 1 }).toString()).toBe('number=1')
})

test('strings', () => {
  expect(queryToURLSearchParams({ string: 'foo' }).toString()).toBe('string=foo')
})

test('booleans', () => {
  expect(queryToURLSearchParams({ bool: true }).toString()).toBe('bool=true')
})

test('arrays', () => {
  expect(queryToURLSearchParams({ array: [1, 2, true, 'foo'] }).toString()).toBe(
    'array=1&array=2&array=true&array=foo',
  )
})

test('objects', () => {
  expect(queryToURLSearchParams({ a: { b: { c: 'foo' }, d: 'bar' }, e: 'ber' }).toString()).toBe(
    encodeURI('a[b][c]=foo&a[d]=bar&e=ber'),
  )
})

test('arrays and objects', () => {
  expect(
    queryToURLSearchParams({
      a: [{ b: ['foo', 'bar'] }, { b: ['boo', 'far'] }],
    }).toString(),
  ).toBe(encodeURI('a[b]=foo&a[b]=bar&a[b]=boo&a[b]=far'))
})
