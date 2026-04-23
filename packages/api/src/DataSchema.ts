import { type $ZodShape, $ZodType } from 'zod/v4/core'
import type TargetingPredicates from './parsers/TargetingPredicates.ts'
import type * as TT from './types/Targeting.ts'
import type * as FTTT from './types/FallThroughTargeting.ts'
import type * as QT from './types/Query.ts'
import { objectMap } from './util.ts'

/**
 * Fluent builder for configuring a {@link Data} instance.
 *
 * Each method returns a new schema with intersection-accumulated type
 * parameters — this avoids the deep mapped-type instantiation that caused
 * TS2589 when chaining many schema calls directly on {@link Data}.
 *
 * The schema is its own public record: pass the result of any
 * `use*` chain directly into {@link Data.create}; there is no separate
 * "built" step.
 *
 * **Key uniqueness:** payload, targeting, query, and fall-through targeting
 * names are expected to be unique across calls. Registering the same key
 * twice is a user error: at runtime the later registration wins (object
 * spread), but at the type level the entries are intersected. If the two
 * parsers have incompatible types, the intersected key may resolve to
 * `never`. Use unique names, or call {@link DataSchema.create} again to
 * start a fresh configuration.
 *
 * @example
 * ```ts
 * const schema = DataSchema.create()
 *   .usePayload({ greeting: z.string() })
 *   .useTargeting({ country: targetIncludes(z.string()) })
 *
 * const data = await Data.create(schema).addRules('greeting', [
 *   { targeting: { country: ['US'] }, payload: 'Hello!' },
 * ])
 * ```
 */
export class DataSchema<
  PP extends $ZodShape = $ZodShape,
  TP extends $ZodShape = $ZodShape,
  QP extends $ZodShape = $ZodShape,
  FP extends $ZodShape = $ZodShape,
> {
  readonly payloadParsers: PP
  readonly targetingParsers: TP
  readonly queryParsers: QP
  readonly fallThroughTargetingParsers: FP
  readonly targetingPredicates: TargetingPredicates<{
    targetingParsers: TP
    queryParsers: QP
  }>

  private constructor(
    payloadParsers: PP,
    targetingParsers: TP,
    queryParsers: QP,
    fallThroughTargetingParsers: FP,
    targetingPredicates: TargetingPredicates<{
      targetingParsers: TP
      queryParsers: QP
    }>,
  ) {
    this.payloadParsers = Object.freeze({ ...payloadParsers })
    this.targetingParsers = Object.freeze({ ...targetingParsers })
    this.queryParsers = Object.freeze({ ...queryParsers })
    this.fallThroughTargetingParsers = Object.freeze({
      ...fallThroughTargetingParsers,
    })
    this.targetingPredicates = Object.freeze({ ...targetingPredicates })
  }

  /**
   * Start a new empty configuration.
   */
  static create(): DataSchema<{}, {}, {}, {}> {
    return new DataSchema({}, {}, {}, {}, {})
  }

  /**
   * Register additional payload parsers.
   */
  usePayload<P extends $ZodShape>(
    parsers: P,
  ): DataSchema<PP & P, TP, QP, FP> {
    return new DataSchema(
      { ...this.payloadParsers, ...parsers } as PP & P,
      this.targetingParsers,
      this.queryParsers,
      this.fallThroughTargetingParsers,
      this.targetingPredicates,
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
      ...this.targetingParsers,
      ...objectMap(targeting, ({ targetingParser }) => targetingParser),
    } as TP & TT.ParserRecord<TDs>
    const nextQueryParsers = {
      ...this.queryParsers,
      ...objectMap(targeting, ({ queryParser }) => queryParser),
    } as QP & QT.ParserRecord<TDs>
    const nextPredicates = {
      ...this.targetingPredicates,
      ...objectMap(targeting, (descriptor) => ({
        predicate: descriptor.predicate,
        requiresQuery: descriptor.requiresQuery ?? true,
      })),
    } as TargetingPredicates<{
      targetingParsers: TP & TT.ParserRecord<TDs>
      queryParsers: QP & QT.ParserRecord<TDs>
    }>
    return new DataSchema(
      this.payloadParsers,
      nextTargetingParsers,
      nextQueryParsers,
      this.fallThroughTargetingParsers,
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
      ...this.fallThroughTargetingParsers,
      ...objectMap(
        targeting,
        (descriptorOrParser) =>
          descriptorOrParser instanceof $ZodType
            ? descriptorOrParser
            : descriptorOrParser.targetingParser,
      ),
    } as FP & FTTT.ParsersRecord<TDs>
    return new DataSchema(
      this.payloadParsers,
      this.targetingParsers,
      this.queryParsers,
      next,
      this.targetingPredicates,
    )
  }
}
