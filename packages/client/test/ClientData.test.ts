import {
  createTargetingDescriptor,
  Data,
  targetIncludesPredicate,
  equalsPredicate,
} from '@targetd/api'
import z from 'zod'
import { ClientData } from '../src'

const Weather = z.string()

const weatherTargeting = createTargetingDescriptor({
  predicate: targetIncludesPredicate(),
  queryValidator: Weather,
  targetingValidator: z.array(Weather),
})

const HighTide = z.boolean()

const highTideTargeting = createTargetingDescriptor({
  predicate: equalsPredicate(),
  queryValidator: HighTide,
  targetingValidator: HighTide,
})

const data = Data.create()
  .useDataValidator('bar', z.number())
  .useDataValidator('foo', z.string())

const serverData = data
  .useClientTargeting('weather', weatherTargeting)
  .useClientTargeting('highTide', highTideTargeting)
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

let clientData = new ClientData(
  data
    .useTargeting('weather', weatherTargeting)
    .useTargeting('highTide', highTideTargeting)
)

test('client data', async () => {
  clientData = clientData.add(await serverData.getPayloadForEachName({}))
  expect(await clientData.getPayload('bar')).toBe(123)
  expect(await clientData.getPayload('bar', { weather: 'sunny' })).toBe(123)
  expect(await clientData.getPayload('foo')).toBeUndefined()
  expect(await clientData.getPayload('foo', { weather: 'sunny' })).toBe('😎')
})
