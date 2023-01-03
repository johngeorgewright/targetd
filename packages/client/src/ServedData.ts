import { zod as z } from '@targetd/api'
import { RuleWithPayload } from '@targetd/api/dist/validators/DataItemRule'

export type ServedData<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape
> = {
  [K in keyof Partial<DataValidators>]:
    | {
        __rules__: z.infer<
          RuleWithPayload<DataValidators[K], TargetingValidators>
        >[]
      }
    | z.infer<DataValidators[K]>
}
