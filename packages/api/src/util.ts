import { L } from 'ts-toolbelt'
import { MaybePromise } from './types'

export function objectMap<O extends Record<string, unknown>, R>(
  obj: O,
  fn: <K extends keyof O>(v: O[K], k: K) => R
): Record<keyof O, R> {
  return objectEntries(obj).reduce(
    (result, [key, value]) => ({ ...result, [key]: fn(value, key) }),
    {} as Record<keyof O, R>
  )
}

export function objectKeys<O extends Record<string, unknown>>(
  obj: O
): (keyof O)[] {
  return Object.keys(obj)
}

export function objectEntries<T extends Record<string, unknown>>(obj: T) {
  return Object.entries(obj) as [keyof T, T[keyof T]][]
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  return keys.reduce(
    (obj, key) => {
      delete obj[key]
      return obj
    },
    { ...obj }
  )
}

class EveryAsyncFail extends Error {}

/**
 * Call an asynchronous function on all key/value pairs.
 * Returns true only if all calls return true.
 *
 * @example
 * if (await objectEveryAsync({ foo: 'bar' }, (value) => Promise.resolve(value === 'bar'))) {
 *   console.info('Everything is bar')
 * }
 */
export async function objectEveryAsync<T extends Record<string, unknown>>(
  obj: T,
  fn: <K extends keyof T>(value: T[K], key: K) => MaybePromise<boolean>
) {
  try {
    await Promise.all(
      objectEntries(obj).map(async ([key, value]) => {
        if (!(await Promise.resolve(fn(value, key)))) throw new EveryAsyncFail()
      })
    )
  } catch (error) {
    if (error instanceof EveryAsyncFail) return false
    else throw error
  }
  return true
}

export function arrayInit<T extends unknown[]>(array: T) {
  return array.slice(0, -1) as L.Pop<T>
}

export function arrayLast<T extends unknown[]>(array: T): L.Last<T> {
  return array[array.length - 1]
}
