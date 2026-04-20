import { type $ZodShape, $ZodType } from 'zod/v4/core'
import type TargetingPredicates from './parsers/TargetingPredicates.ts'
import type * as DT from './types/Data.ts'
import type * as TT from './types/Targeting.ts'
import type * as FTTT from './types/FallThroughTargeting.ts'
import type * as QT from './types/Query.ts'
import { objectMap } from './util.ts'

/**
 * Opaque, frozen output of {@link DataSchema.build}.
 * Pass this to {@link Data.create} to get a typed {@link Data} instance.
 *
 * The type parameter is a full {@link DT.Meta} — the four accumulated parser
 * shapes from the builder, materialised into the concrete structure
 * {@link Data} expects.
 */
export interface BuiltDataSchema<$ extends DT.Meta> {
  readonly payloadParsers: $['PayloadParsers']
  readonly targetingParsers: $['TargetingParsers']
  readonly queryParsers: $['QueryParsers']
  readonly fallThroughTargetingParsers: $['FallThroughTargetingParsers']
  readonly targetingPredicates: TargetingPredicates<$>
}

/**
 * Fluent builder for configuring a {@link Data} instance.
 *
 * Each method returns a new builder with intersection-accumulated type
 * parameters — this avoids the deep mapped-type instantiation that caused
 * TS2589 when chaining many schema calls directly on {@link Data}.
 *
 * @example
 * ```ts
 * const schema = DataSchema.create()
 *   .usePayload({ greeting: z.string() })
 *   .useTargeting({ country: targetIncludes(z.string()) })
 *   .build()
 *
 * const data = await Data.create(schema).addRules('greeting', [
 *   { targeting: { country: ['US'] }, payload: 'Hello!' },
 * ])
 * ```
 */
export class DataSchema<
  PP extends $ZodShape = {},
  TP extends $ZodShape = {},
  QP extends $ZodShape = {},
  FP extends $ZodShape = {},
> {
  readonly #payloadParsers: PP
  readonly #targetingParsers: TP
  readonly #queryParsers: QP
  readonly #fallThroughTargetingParsers: FP
  readonly #targetingPredicates: Record<string, {
    predicate: (...args: any[]) => any
    requiresQuery: boolean
  }>

  private constructor(
    payloadParsers: PP,
    targetingParsers: TP,
    queryParsers: QP,
    fallThroughTargetingParsers: FP,
    targetingPredicates: Record<string, {
      predicate: (...args: any[]) => any
      requiresQuery: boolean
    }>,
  ) {
    this.#payloadParsers = payloadParsers
    this.#targetingParsers = targetingParsers
    this.#queryParsers = queryParsers
    this.#fallThroughTargetingParsers = fallThroughTargetingParsers
    this.#targetingPredicates = targetingPredicates
  }

  /**
   * Start a new empty configuration.
   */
  static create(): DataSchema {
    return new DataSchema({}, {}, {}, {}, {})
  }

  /**
   * Register additional payload parsers.
   */
  usePayload<P extends $ZodShape>(
    parsers: P,
  ): DataSchema<PP & P, TP, QP, FP> {
    return new DataSchema(
      { ...this.#payloadParsers, ...parsers } as PP & P,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
      this.#targetingPredicates,
    )
  }

  /**
   * Register targeting descriptors.
   */
  useTargeting<TDs extends TT.DescriptorRecord>(
    targeting: TDs,
  ): DataSchema<
    PP,
    TP & TT.ParserRecord<TDs>,
    QP & QT.ParserRecord<TDs>,
    FP
  > {
    const nextTargetingParsers = {
      ...this.#targetingParsers,
      ...objectMap(targeting, ({ targetingParser }) => targetingParser),
    } as TP & TT.ParserRecord<TDs>
    const nextQueryParsers = {
      ...this.#queryParsers,
      ...objectMap(targeting, ({ queryParser }) => queryParser),
    } as QP & QT.ParserRecord<TDs>
    const nextPredicates = {
      ...this.#targetingPredicates,
      ...objectMap(targeting, (descriptor) => ({
        predicate: descriptor.predicate,
        requiresQuery: descriptor.requiresQuery ?? true,
      })),
    }
    return new DataSchema(
      this.#payloadParsers,
      nextTargetingParsers,
      nextQueryParsers,
      this.#fallThroughTargetingParsers,
      nextPredicates,
    )
  }

  /**
   * Register fall-through targeting descriptors.
   */
  useFallThroughTargeting<TDs extends FTTT.DescriptorRecord>(
    targeting: TDs,
  ): DataSchema<PP, TP, QP, FP & FTTT.ParsersRecord<TDs>> {
    const next = {
      ...this.#fallThroughTargetingParsers,
      ...objectMap(
        targeting,
        (descriptorOrParser) =>
          descriptorOrParser instanceof $ZodType
            ? descriptorOrParser
            : descriptorOrParser.targetingParser,
      ),
    } as FP & FTTT.ParsersRecord<TDs>
    return new DataSchema(
      this.#payloadParsers,
      this.#targetingParsers,
      this.#queryParsers,
      next,
      this.#targetingPredicates,
    )
  }

  /**
   * Materialise the accumulated configuration into a {@link BuiltDataSchema}
   * suitable for passing to {@link Data.create}.
   */
  build(): BuiltDataSchema<{
    PayloadParsers: PP
    TargetingParsers: TP
    QueryParsers: QP
    FallThroughTargetingParsers: FP
  }> {
    type $ = {
      PayloadParsers: PP
      TargetingParsers: TP
      QueryParsers: QP
      FallThroughTargetingParsers: FP
    }
    return Object.freeze({
      payloadParsers: this.#payloadParsers,
      targetingParsers: this.#targetingParsers,
      queryParsers: this.#queryParsers,
      fallThroughTargetingParsers: this.#fallThroughTargetingParsers,
      targetingPredicates: this.#targetingPredicates as TargetingPredicates<$>,
    })
  }
}
