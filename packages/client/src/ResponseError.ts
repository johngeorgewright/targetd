/**
 * Error thrown when the server returns an HTTP error response.
 * Contains the original Response object for inspection.
 *
 * @example
 * ```ts
 * try {
 *   await client.getPayload('feature', { country: 'US' })
 * } catch (error) {
 *   if (error instanceof ResponseError) {
 *     console.error('Server error:', error.response.status, error.response.statusText)
 *   }
 * }
 * ```
 */
export class ResponseError extends Error {
  /**
   * The HTTP Response object that caused the error.
   * Contains status, statusText, headers, and other response details.
   */
  public readonly response: Response

  /**
   * Create a ResponseError.
   *
   * @param response - The HTTP Response object that represents the error.
   */
  constructor(response: Response) {
    super(`The server responded with an error.`)
    this.response = response
  }
}
