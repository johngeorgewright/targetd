import Config from './Config'

let config: Config

beforeEach(() => {
  config = new Config([
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
  expect(config.getPayload('foo', { weather: ['rainy'] })).toBe('☂️')
  expect(config.getPayload('foo', { highTide: true })).toBe('🏄‍♂️')
})
