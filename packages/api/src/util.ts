export function mapObject<O extends Record<string, unknown>, R>(
  obj: O,
  fn: <K extends keyof O>(v: O[K], k: K) => R
): Record<keyof O, R> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    result[key] = fn(value as any, key)
  }

  return result as Record<keyof O, R>
}
