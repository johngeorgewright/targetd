export type RecordKey<R extends Record<keyof any, any>> =
  R extends Record<infer V, any> ? V : never

/**
 * Override methods on an object.
 *
 * @example
 * ```
 * const obj = {
 *   foo: () => 'foo',
 *   bar: () => 'bar',
 * }
 *
 * const obj2 = overrideObject(obj, {
 *   foo: (obj) => obj.foo().reverse()
 * })
 *
 * console.info(obj2.bar())
 * // 'bar'
 * console.info(obj2.foo())
 * // 'oof'
 * ```
 */
export function overrideMethods<T extends object>(
  target: T,
  methods: Partial<MethodOverrides<T>>,
): T {
  return new Proxy(target, {
    get: (target, prop, receiver) =>
      prop in methods
        ? methods[prop as keyof typeof methods]
        : Reflect.get(target, prop, receiver),
  })
}

type MethodOverrides<T> = {
  [K in keyof T as T[K] extends (...args: unknown[]) => unknown
    ? K
    : never]: T[K] extends (...args: unknown[]) => unknown
    ? (target: T, ...args: Parameters<T[K]>) => ReturnType<T[K]>
    : never
}
