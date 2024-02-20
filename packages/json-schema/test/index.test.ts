import { Data, targetIncludes } from '@targetd/api'
import { z } from 'zod'
import { dataJSONSchemas } from '../src'

test('json schema for simple data object', () => {
  expect(
    dataJSONSchemas(
      Data.create()
        .useData('foo', z.string())
        .useTargeting('weather', targetIncludes(z.string()))
        .useFallThroughTargeting('browser', targetIncludes(z.string()))
        .addRules('foo', [
          {
            payload: 'bar',
          },
        ]),
    ),
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
                    "anyOf": [
                      {
                        "additionalProperties": false,
                        "properties": {
                          "browser": {
                            "items": {
                              "type": "string",
                            },
                            "type": "array",
                          },
                          "weather": {
                            "items": {
                              "type": "string",
                            },
                            "type": "array",
                          },
                        },
                        "type": "object",
                      },
                      {
                        "items": {
                          "$ref": "#/properties/foo/properties/rules/items/properties/targeting/anyOf/0",
                        },
                        "type": "array",
                      },
                    ],
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
