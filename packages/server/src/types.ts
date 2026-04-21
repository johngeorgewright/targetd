/**
 * Type that can be either a value or a Promise resolving to that value.
 *
 * @internal
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * Type that can be either a value of a function that returns the value.
 *
 * @internal
 */
export type MaybeCallable<T> = T | (() => T)
