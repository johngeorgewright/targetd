import { L } from 'ts-toolbelt'

export function objectMap<O extends Record<string, unknown>, R>(
  obj: O,
  fn: <K extends keyof O>(v: O[K], k: K) => R
): Record<keyof O, R> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    result[key] = fn(value as any, key)
  }

  return result as Record<keyof O, R>
}

export function objectEvery<T extends Record<string, unknown>>(
  obj: T,
  fn: <K extends keyof T>(key: K, value: T[K]) => boolean
) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      fn(key, obj[key])
    }
  }
}

export function arrayInit<T extends unknown[]>(array: T) {
  return array.slice(0, -1) as L.Pop<T>
}

export function arrayLast<T extends unknown[]>(array: T): L.Last<T> {
  return array[array.length - 1]
}
