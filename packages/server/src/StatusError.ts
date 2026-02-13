/**
 * HTTP error with a specific status code.
 * Used internally by the server to return appropriate HTTP error responses.
 *
 * @example
 * ```ts
 * throw new StatusError(404, 'Resource not found')
 * throw new StatusError(403, 'Forbidden')
 * ```
 */
export class StatusError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
  }
}
