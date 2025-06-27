import type { $ZodShape } from 'zod/v4/core'
import type { Data, DT, FTTT, QT, TT } from '@targetd/api'
import PromiseChain from '@myty/promise-chain'
import type { DataItemRulesIn } from './parsers/DataItemRules.ts'

export type PromisedData<
  PayloadParsers extends $ZodShape,
  TargetingParsers extends $ZodShape,
  QueryParsers extends $ZodShape,
  FallThroughTargetingParsers extends $ZodShape,
> =
  & PromisedDataMethods<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >
  & Data<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >

export function promisedData<
  PayloadParsers extends $ZodShape,
  TargetingParsers extends $ZodShape,
  QueryParsers extends $ZodShape,
  FallThroughTargetingParsers extends $ZodShape,
>(
  data: Data<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
): PromisedData<
  PayloadParsers,
  TargetingParsers,
  QueryParsers,
  FallThroughTargetingParsers
> {
  return new PromiseChain(data) as PromisedData<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >
}

interface PromisedDataMethods<
  PayloadParsers extends $ZodShape,
  TargetingParsers extends $ZodShape,
  QueryParsers extends $ZodShape,
  FallThroughTargetingParsers extends $ZodShape,
> extends
  Promise<
    Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >
  > {
  usePayload<Parsers extends $ZodShape>(
    parsers: Parsers,
  ): PromisedData<
    PayloadParsers & Parsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >

  insert(
    insertableData: DT.InsertableData<
      PayloadParsers,
      TargetingParsers,
      FallThroughTargetingParsers
    >,
  ): PromisedData<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >

  addRules<
    Name extends keyof PayloadParsers,
  >(
    name: Name,
    rules: DataItemRulesIn<
      PayloadParsers[Name],
      TargetingParsers,
      FallThroughTargetingParsers
    >,
  ): PromisedData<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >

  useTargeting<TDs extends TT.DescriptorRecord>(
    targeting: TDs,
  ): PromisedData<
    PayloadParsers,
    TargetingParsers & TT.ParserRecord<TDs>,
    QueryParsers & QT.ParserRecord<TDs>,
    FallThroughTargetingParsers
  >

  useFallThroughTargeting<TDs extends FTTT.DescriptorRecord>(
    targeting: TDs,
  ): PromisedData<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers & FTTT.ParsersRecord<TDs>
  >
}
