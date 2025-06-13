import { assertSnapshot } from 'jsr:@std/testing/snapshot'
import { test } from 'jsr:@std/testing/bdd'
import { Data, targetIncludes } from '@targetd/api'
import { dataJSONSchemas } from '@targetd/json-schema'
import { z } from 'zod/v4'

test('json schema for simple data object', async (t) => {
  await assertSnapshot(
    t,
    dataJSONSchemas(
      await Data.create({
        data: {
          foo: z.string(),
        },
        targeting: {
          weather: targetIncludes(z.string()),
        },
        fallThroughTargeting: {
          browser: targetIncludes(z.string()),
        },
      }).addRules('foo', [
        {
          payload: 'bar',
        },
      ]),
    ),
  )
})
