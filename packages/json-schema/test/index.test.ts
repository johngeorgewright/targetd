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
  ).toMatchInlineSnapshot(/*json*/ `
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
            "$schema": {
              "type": "string",
            },
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
                          "additionalProperties": false,
                          "properties": {
                            "payload": {
                              "$ref": "#/properties/foo/properties/rules/items/anyOf/0/properties/payload",
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
