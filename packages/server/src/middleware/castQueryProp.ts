import type { RequestHandler } from 'express'
import type { ParsedQs as $ParsedQs } from 'qs'

export function castQueryProp<
  P extends Record<string, string>,
  ResBody,
  ReqBody,
  ReqQuery extends $ParsedQs,
  Locals extends Record<string, any>,
>(): RequestHandler<
  P,
  ResBody,
  ReqBody,
  ReqQuery,
  Locals & { query: ParsedQs }
> {
  return function (req, res, next) {
    res.locals.query = parseObject(req.query) as any
    next()
  }
}

type ParsedQsParam =
  | $ParsedQs[string]
  | boolean
  | number
  | ParsedQsParam[]
  | ParsedQs

export type ParsedQs = { [key: string]: ParsedQsParam }

function isObject(val: unknown): val is $ParsedQs {
  return typeof val === 'object' && !!val
}

function isNumber(val: unknown): val is `${number}` {
  return val === 'string' && !isNaN(parseFloat(val)) || isFinite(Number(val))
}

function isBoolean(val: unknown): val is 'true' | 'false' {
  return val === 'false' || val === 'true'
}

function isArray(val: $ParsedQs[string]): val is $ParsedQs[] {
  return Array.isArray(val)
}

function parseValue(val: $ParsedQs[string]): ParsedQsParam {
  if (typeof val == 'undefined' || val == '') {
    return undefined
  } else if (isBoolean(val)) {
    return parseBoolean(val)
  } else if (isArray(val)) {
    return parseArray(val)
  } else if (isObject(val)) {
    return parseObject(val)
  } else if (isNumber(val)) {
    return parseNumber(val)
  } else {
    return val
  }
}

function parseObject(obj: $ParsedQs): ParsedQs {
  return Object.entries(obj)
    .reduce(
      (result, [key, value]) => {
        const parsedValue = parseValue(value)
        if (parsedValue !== null) result[key] = parsedValue
        return result
      },
      {} as ParsedQs,
    )
}

function parseArray(arr: $ParsedQs[]): ParsedQsParam[] {
  return arr.map(parseValue)
}

function parseNumber(val: string): number {
  return Number(val)
}

function parseBoolean(val: string): boolean {
  return val === 'true'
}
