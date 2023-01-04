import { Data, zod as z } from '@targetd/api'
import { ClientData } from '../src'

const data = Data.create()
  .useDataValidator('bar', z.number())
  .useDataValidator('foo', z.string())
  .useTargeting('weather', {
    predicate: (q) => (t) => typeof q === 'string' && t.includes(q),
    queryValidator: z.string(),
    targetingValidator: z.array(z.string()),
  })
  .useTargeting('highTide', {
    predicate: (q) => (t) => q === t,
    queryValidator: z.boolean(),
    targetingValidator: z.boolean(),
  })

const serverData = data
  .addRules('bar', [
    {
      payload: 123,
    },
  ])
  .addRules('foo', [
    {
      client: [
        {
          targeting: {
            highTide: true,
            weather: ['sunny'],
          },
          payload: '🏄‍♂️',
        },
        {
          targeting: {
            weather: ['sunny'],
          },
          payload: '😎',
        },
        {
          targeting: {
            weather: ['rainy'],
          },
          payload: '☂️',
        },
        {
          targeting: {
            highTide: true,
          },
          payload: '🌊',
        },
      ],
    },
  ])

let clientData = new ClientData(data)

test('client data', async () => {
  clientData = clientData.add(await serverData.getPayloadForEachName({}))
  expect(await clientData.getPayload('bar')).toBe(123)
  expect(await clientData.getPayload('bar', { weather: 'sunny' })).toBe(123)
  expect(await clientData.getPayload('foo')).toBeUndefined()
  expect(await clientData.getPayload('foo', { weather: 'sunny' })).toBe('😎')
})
