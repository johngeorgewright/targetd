import Config from './Config'
import * as rt from 'runtypes'

let config: Config<any>

beforeEach(() => {
  config = Config.create()
    .usePredicate({
      name: 'weather',
      predicate: (q) => (t) =>
        typeof q.weather === 'string' && t.weather.includes(q.weather),
      runtype: rt.Array(rt.String),
    })
    .usePredicate({
      name: 'highTide',
      predicate: (q) => (t) => q.highTide === t.highTide,
      runtype: rt.Boolean,
    })
    .add([
      {
        name: 'foo',
        rules: [
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
            payload: '🏄‍♂️',
          },
          {
            payload: 'bar',
          },
        ],
      },
    ])
})

test('getPayload', () => {
  expect(config.getPayload('foo', {})).toBe('bar')
  expect(config.getPayload('foo', { weather: 'sunny' })).toBe('😎')
  expect(config.getPayload('foo', { weather: 'rainy' })).toBe('☂️')
  expect(config.getPayload('foo', { highTide: true })).toBe('🏄‍♂️')
})
