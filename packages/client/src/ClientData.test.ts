import { Data, runtypes as rt } from '@targetd/api'
import { ClientData } from '.'

const data = Data.create()
  .useDataValidator('bar', rt.Number)
  .useDataValidator('foo', rt.String)
  .useTargeting('weather', {
    predicate: (q) => (t) => typeof q === 'string' && t.includes(q),
    queryValidator: rt.String,
    targetingValidator: rt.Array(rt.String),
  })
  .useTargeting('highTide', {
    predicate: (q) => (t) => q === t,
    queryValidator: rt.Boolean,
    targetingValidator: rt.Boolean,
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
