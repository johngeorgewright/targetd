import { Config } from '@config/api'
import targetingPredicate from '.'

let config: Config

beforeEach(() => {
  config = new Config([
    {
      name: 'foo',
      rules: [
        {
          payload: '😎',
          targeting: {
            weather: ['sunny'],
          },
        },
        {
          payload: '☔︎',
          targeting: {
            weather: ['rainy'],
          },
        },
        {
          payload: 'bar',
        },
      ],
    },
  ])

  config.usePredicate(targetingPredicate)
})

test('targeting predicate', () => {
  expect(config.getPayload('foo', { weather: 'sunny' })).toBe('😎')
  expect(config.getPayload('foo', { weather: 'rainy' })).toBe('☔︎')
  expect(config.getPayload('foo', { weather: ['rainy'] })).toBe('☔︎')
  expect(config.getPayload('foo', { weather: 'foggy' })).toBe('bar')
})
