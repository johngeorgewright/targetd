import { Data } from '@targetd/api'
import { z } from 'zod'
import { dataJSONSchemas } from '../src'

test('json schema for simple data object', () => {
  expect(
    dataJSONSchemas(
      Data.create()
        .useDataValidator('foo', z.string())
        .addRules('foo', [
          {
            payload: 'bar',
          },
        ])
    )
  ).toMatchInlineSnapshot(`
    {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "additionalProperties": false,
      "properties": {
        "$schema": {
          "type": "string",
        },
        "foo": {
          "additionalProperties": false,
          "properties": {
            "rules": {
              "items": {
                "additionalProperties": false,
                "properties": {
                  "payload": {
                    "type": "string",
                  },
                  "targeting": {
                    "additionalProperties": false,
                    "properties": {},
                    "type": "object",
                  },
                },
                "required": [
                  "payload",
                ],
                "type": "object",
              },
              "type": "array",
            },
          },
          "required": [
            "rules",
          ],
          "type": "object",
        },
      },
      "type": "object",
    }
  `)
})
