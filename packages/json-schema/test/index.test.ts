import { Data, zod as z } from '@targetd/api'
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
        "foo": {
          "additionalProperties": false,
          "properties": {
            "rules": {
              "items": {
                "anyOf": [
                  {
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
                  {
                    "additionalProperties": false,
                    "properties": {
                      "client": {
                        "items": {
                          "$ref": "#/properties/foo/properties/rules/items/anyOf/0",
                        },
                        "type": "array",
                      },
                      "targeting": {
                        "$ref": "#/properties/foo/properties/rules/items/anyOf/0/properties/targeting",
                      },
                    },
                    "required": [
                      "client",
                    ],
                    "type": "object",
                  },
                ],
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
