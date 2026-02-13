import { unflatten } from 'flat'
import type { Explode } from './types.ts'

/**
 * Transform flat key notation to nested objects.
 *
 * @param x - Object with flat keys to transform.
 * @param pathSeparator - Character(s) used to separate path segments in keys.
 * @returns Nested object with keys exploded into hierarchy.
 *
 * @example
 * ```ts
 * import { explode } from '@targetd/explode'
 *
 * explode({ 'user.name': 'John', 'user.age': 30 }, '.')
 * // Returns: { user: { name: 'John', age: 30 } }
 *
 * explode({ 'config/api/url': 'https://api.com' }, '/')
 * // Returns: { config: { api: { url: 'https://api.com' } } }
 * ```
 */
export function explode<
  T extends Record<string, unknown>,
  PathSeparator extends string,
>(x: T, pathSeparator: PathSeparator): Explode<T, PathSeparator> {
  return unflatten(x, { delimiter: pathSeparator })
}
