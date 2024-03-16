import { ZodRawShape } from 'zod'

export namespace VT {
  export type Any = Record<string, ZodRawShape>

  export type FromPayload<P extends ZodRawShape> = Record<keyof P, ZodRawShape>
}
