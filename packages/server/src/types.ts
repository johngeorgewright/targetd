/**
 * Type that can be either a value or a Promise resolving to that value.
 *
 * @internal
 */
export type MaybePromise<T> = T | Promise<T>
