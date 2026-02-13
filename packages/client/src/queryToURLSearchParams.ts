/**
 * Convert a query object to URLSearchParams for HTTP requests.
 * Handles nested objects and arrays by flattening them into bracket notation.
 *
 * @param query - Query object to convert.
 * @returns URLSearchParams instance with flattened query parameters.
 *
 * @example
 * ```ts
 * queryToURLSearchParams({ country: 'US', date: { start: '2024-01-01' } })
 * // Returns URLSearchParams: "country=US&date[start]=2024-01-01"
 *
 * queryToURLSearchParams({ tags: ['news', 'tech'] })
 * // Returns URLSearchParams: "tags=news&tags=tech"
 * ```
 */
export function queryToURLSearchParams(query: Record<string, unknown>) {
  const urlSearchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    for (const [n, v] of queryValueToParams(key, value)) {
      urlSearchParams.append(n, v)
    }
  }
  return urlSearchParams
}

function* queryValueToParams(
  key: string,
  value: unknown,
): Generator<[string, string]> {
  if (Array.isArray(value)) {
    for (const item of value) yield* queryValueToParams(key, item)
  } else if (isObject(value)) {
    for (const [k, v] of Object.entries(value)) {
      yield* queryValueToParams(`${key}[${k}]`, v)
    }
  } else yield [key, String(value)]
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}
