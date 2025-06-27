import { assertSnapshot } from 'jsr:@std/testing/snapshot'
import { Data, targetIncludes } from '@targetd/api'
import { dataJSONSchemas } from '@targetd/json-schema'
import { z } from 'zod/v4'

Deno.test('json schema for simple data object', async (t) => {
  await assertSnapshot(
    t,
    dataJSONSchemas(
      await Data.create()
        .usePayload(
          {
            foo: z.string(),
          },
        )
        .useTargeting({
          weather: targetIncludes(z.string()),
        })
        .useFallThroughTargeting({
          browser: targetIncludes(z.string()),
        })
        .addRules('foo', [
          {
            payload: 'bar',
          },
        ]),
    ),
  )
})
