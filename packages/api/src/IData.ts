import type { $ZodShape } from 'zod/v4/core'
import type * as DT from './types/Data.ts'
import type * as FTTT from './types/FallThroughTargeting.ts'
import type * as PT from './types/Payload.ts'
import type * as QT from './types/Query.ts'
import type * as TT from './types/Targeting.ts'

export interface IData<$ extends DT.Meta> {
  usePayload<Parsers extends $ZodShape>(
    parsers: Parsers,
  ): Promise<IData<$ & { PayloadParsers: $['PayloadParsers'] & Parsers }>>

  useTargeting<TDs extends TT.DescriptorRecord>(targeting: TDs): Promise<
    IData<
      $ & {
        TargetingParsers: $['TargetingParsers'] & TT.ParserRecord<TDs>
        QueryParsers: $['QueryParsers'] & QT.ParserRecord<TDs>
      }
    >
  >

  useFallThroughTargeting<TDs extends FTTT.DescriptorRecord>(
    targeting: TDs,
  ): Promise<
    IData<
      $ & {
        FallThroughTargetingParsers:
          & $['FallThroughTargetingParsers']
          & FTTT.ParsersRecord<TDs>
      }
    >
  >

  insert(data: DT.InsertableData<$>): Promise<IData<$>>

  getPayloadForEachName(
    rawQuery?: QT.Raw<$['QueryParsers']>,
  ): Promise<PT.Payloads<$>>

  getPayload<Name extends keyof $['PayloadParsers']>(
    name: Name,
    rawQuery?: QT.Raw<$['QueryParsers']>,
  ): Promise<
    | PT.Payload<$, $['PayloadParsers'][Name]>
    | undefined
  >

  getPayloads<Name extends keyof $['PayloadParsers']>(
    name: Name,
    rawQuery?: QT.Raw<$['QueryParsers']>,
  ): Promise<
    PT.Payload<$, $['PayloadParsers'][Name]>[]
  >
}
