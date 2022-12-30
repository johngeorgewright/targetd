import { runtypes as rt } from '@targetd/api'
import { RuleWithPayload } from '@targetd/api/dist/validators/DataItemRule'

export type ServedData<
  DataValidators extends Record<string, rt.Runtype>,
  TargetingValidators extends Record<string, rt.Runtype>
> = {
  [K in keyof Partial<DataValidators>]:
    | {
        __rules__: rt.Static<
          RuleWithPayload<DataValidators[K], TargetingValidators>
        >[]
      }
    | rt.Static<DataValidators[K]>
}
