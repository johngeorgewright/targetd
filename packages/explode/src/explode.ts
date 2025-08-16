import { unflatten } from 'flat'
import type { Explode } from './types.ts'

export function explode<
  T extends Record<string, unknown>,
  PathSeparator extends string,
>(x: T, pathSeparator: PathSeparator): Explode<T, PathSeparator> {
  return unflatten(x, { delimiter: pathSeparator })
}
